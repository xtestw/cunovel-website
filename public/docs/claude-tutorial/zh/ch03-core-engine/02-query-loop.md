# 3.2 query.ts：主循环的源码精读

> **章节目标**：逐行理解 `queryLoop` 函数的核心逻辑，掌握 Agent 主循环的实现方式。

---

## 函数签名：async generator

```typescript
// src/query.ts
export async function* query(
  params: QueryParams,
): AsyncGenerator<StreamEvent | RequestStartEvent | Message | ...> {
  const consumedCommandUuids: string[] = []
  const terminal = yield* queryLoop(params, consumedCommandUuids)
  // ...
  return terminal
}
```

`query()` 是 `queryLoop()` 的外层包装，主要负责命令生命周期的收尾通知。核心逻辑在 `queryLoop()` 里。

---

## QueryParams：进入循环的"入场券"

```typescript
export type QueryParams = {
  messages: Message[]              // 历史消息（含本次用户输入）
  systemPrompt: SystemPrompt       // 系统提示
  userContext: { [k: string]: string }  // 注入到 System Prompt 的用户上下文
  systemContext: { [k: string]: string } // 注入到 System Prompt 的系统上下文
  canUseTool: CanUseToolFn         // 权限检查函数
  toolUseContext: ToolUseContext   // 工具执行所需的所有上下文
  fallbackModel?: string           // 备用模型（Sonnet 降级到 Haiku 等场景）
  querySource: QuerySource         // 请求来源（REPL / SDK / headless）
  maxOutputTokensOverride?: number // 覆盖最大输出 token
  maxTurns?: number                // 最大循环轮次
  taskBudget?: { total: number }   // API 层的 task budget（beta 功能）
}
```

---

## 循环状态：State 对象

```typescript
type State = {
  messages: Message[]                   // 不断增长的消息数组
  toolUseContext: ToolUseContext         // 工具上下文（可能随循环更新）
  autoCompactTracking: ...              // 自动压缩状态追踪
  maxOutputTokensRecoveryCount: number  // max_output_tokens 恢复计数（最多 3 次）
  hasAttemptedReactiveCompact: boolean  // 是否已尝试响应式压缩
  maxOutputTokensOverride: number | undefined
  pendingToolUseSummary: Promise<...>   // 工具调用摘要（后台生成）
  stopHookActive: boolean | undefined   // Stop Hook 是否激活
  turnCount: number                     // 当前轮次数
  transition: Continue | undefined      // 上次迭代继续的原因
}
```

**关键设计**：State 是不可变更新风格——

```typescript
// 不这样写：
state.messages = newMessages

// 而是这样：
state = { ...state, messages: newMessages, transition: continueReason }
```

这让状态变化可追踪，便于调试。

---

## 循环主体骨架

```typescript
async function* queryLoop(params, consumedCommandUuids) {
  let state = { messages: params.messages, ... }

  while (true) {
    const { messages, toolUseContext } = state

    // ① 构建 API 请求
    const model = getRuntimeMainLoopModel(...)
    const apiMessages = normalizeMessagesForAPI(messages)
    
    // ② yield 开始事件（让 UI 知道请求开始了）
    yield { type: 'request_start', model }

    // ③ 流式调用 Claude API
    for await (const event of callClaudeAPI({ model, messages: apiMessages, ... })) {
      yield event  // 实时 yield 给 UI
    }

    // ④ 获取最终的 AssistantMessage
    const assistantMessage = getLastAssistantMessage(messages)

    // ⑤ 判断退出条件
    if (assistantMessage.stop_reason === 'end_turn') {
      return { type: 'end_turn', ... }  // 退出循环
    }

    // ⑥ 处理工具调用
    if (assistantMessage.stop_reason === 'tool_use') {
      const toolResults = yield* runTools(assistantMessage, toolUseContext)
      state = { ...state, messages: [...messages, assistantMessage, ...toolResults] }
      continue  // 继续下一轮
    }

    // ⑦ 处理异常情况（max_tokens、prompt_too_long 等）
    // ...
  }
}
```

---

## 上下文压缩：不让对话"爆炸"

Claude 有上下文窗口限制（约 200K tokens）。当对话历史过长时，`queryLoop` 有两种策略：

### AutoCompact（自动压缩）

当 token 数接近上限时触发：

```typescript
// src/services/compact/autoCompact.ts
export function calculateTokenWarningState(
  contextTokens: number,
  maxTokens: number,
): 'safe' | 'warning' | 'critical' {
  const ratio = contextTokens / maxTokens
  if (ratio < 0.7) return 'safe'
  if (ratio < 0.85) return 'warning'
  return 'critical'  // 触发 AutoCompact
}
```

AutoCompact 的工作原理：
1. 把历史消息发给一个小模型（Haiku）
2. 请求它生成对话摘要
3. 用摘要替换旧消息
4. 继续当前 Turn

### ReactiveCompact（响应式压缩，feature gate）

```typescript
// 编译开关控制
const reactiveCompact = feature('REACTIVE_COMPACT')
  ? require('./services/compact/reactiveCompact.js')
  : null
```

ReactiveCompact 会在收到 `prompt_too_long` 错误时立即触发压缩并重试，比 AutoCompact 更激进。

---

## max_output_tokens 恢复逻辑

当 Claude 的输出被截断（`stop_reason = 'max_tokens'`），循环会尝试恢复：

```typescript
const MAX_OUTPUT_TOKENS_RECOVERY_LIMIT = 3

// 恢复策略
if (assistantMessage.stop_reason === 'max_tokens' && 
    state.maxOutputTokensRecoveryCount < MAX_OUTPUT_TOKENS_RECOVERY_LIMIT) {
  
  // 追加一条"继续"的用户消息
  const continueMessage = createUserMessage({
    content: [{ type: 'text', text: 'Continue' }]
  })
  
  state = {
    ...state,
    messages: [...messages, assistantMessage, continueMessage],
    maxOutputTokensRecoveryCount: state.maxOutputTokensRecoveryCount + 1,
    transition: { type: 'max_tokens_recovery' }
  }
  continue
}
```

这就是为什么 Claude 有时会在被截断后自动继续输出的原因。

---

## 工具执行：runTools

工具执行是主循环里最复杂的部分，委托给 `runTools()` 函数：

```typescript
// src/services/tools/toolOrchestration.ts
import { runTools } from './services/tools/toolOrchestration.js'

// 在 queryLoop 中
const toolMessages = yield* runTools(assistantMessage, toolUseContext, canUseTool)
```

`runTools` 处理：
- 多个工具的**并发执行**（同一消息里可能有多个 tool_use 块）
- 权限检查（`canUseTool`）
- 工具结果收集
- 错误处理（工具失败不导致循环崩溃，错误作为结果返回给 Claude）

---

## Token 预算（feature gate）

```typescript
const budgetTracker = feature('TOKEN_BUDGET') ? createBudgetTracker() : null
```

Token 预算系统（`TOKEN_BUDGET` 开关）会追踪当前 Turn 的 token 消耗，在超过预算时强制终止循环并告知 Claude。

---

## 退出状态：Terminal

`queryLoop` 不是无限循环，它返回一个 `Terminal` 类型表示退出原因：

```typescript
type Terminal =
  | { type: 'end_turn' }           // 正常结束
  | { type: 'max_turns' }          // 达到最大轮次
  | { type: 'abort' }              // 用户中断（Ctrl+C）
  | { type: 'budget_exceeded' }    // Token 预算超限
  | { type: 'error'; error: Error } // 不可恢复的错误
```

---

## 下一步

- [3.3 QueryEngine：会话状态管理器](./03-query-engine.md) — QueryEngine 类详解
- [3.4 System Prompt 的构建机制](./04-system-prompt.md) — fetchSystemPromptParts 解析
