# 3.5 Context 压缩：对话历史如何不爆炸

> **章节目标**：理解 Claude Code 的多层上下文压缩机制，以及各种压缩策略的触发条件和实现方式。

---

## 问题：有限的上下文窗口

Claude 的上下文窗口约为 200K tokens。一个复杂的编程会话很容易超过这个限制：

- 每个大文件读取：可能 5K-50K tokens
- 工具调用的详细输出：每次可能 1K-5K tokens
- 长对话历史：每轮 500-2000 tokens
- System Prompt：约 5K-15K tokens

Claude Code 实现了多种压缩机制来应对这个问题。

---

## 压缩机制一览

```
上下文大小
    │
    ▼
normalizeMessagesForAPI()        ← 基础过滤（永远运行）
    │ 过滤 UI-only 消息
    │
    ▼
AutoCompact                      ← 接近上限时（>85%）自动触发
    │ 把历史摘要化
    │ feature('CACHED_MICROCOMPACT') 优化版
    │
    ▼
ReactiveCompact                  ← 收到 prompt_too_long 错误时
    │ feature('REACTIVE_COMPACT')
    │
    ▼
ContextCollapse                  ← 工具调用结果折叠
    │ feature('CONTEXT_COLLAPSE')
    │
    ▼
SnipCompact                      ← 历史截断
      feature('HISTORY_SNIP')
```

---

## normalizeMessagesForAPI()

这是每次 API 调用前都会执行的基础过滤：

```typescript
// src/utils/messages.ts
export function normalizeMessagesForAPI(messages: Message[]): APIMessage[] {
  return messages
    .filter(m => !isUIOnlyMessage(m))  // 过滤掉 ProgressMessage 等
    .filter(m => !isTombstoneMessage(m)) // 过滤已删除的消息
    .map(m => toAPIFormat(m))
    // ... 更多处理
}
```

被过滤掉的消息类型：
- `ProgressMessage`：工具进度更新（仅 UI 显示）
- `TombstoneMessage`：被删除消息的占位符
- `SystemMessage`（特定类型）：UI 通知消息

---

## AutoCompact：主动压缩

### 触发时机

```typescript
// src/services/compact/autoCompact.ts
export type TokenWarningState = 'safe' | 'warning' | 'critical'

export function calculateTokenWarningState(
  contextTokens: number,
  maxTokens: number,
): TokenWarningState {
  const ratio = contextTokens / maxTokens
  if (ratio < 0.7) return 'safe'      // 安全区
  if (ratio < 0.85) return 'warning'  // 警告区（用户看到提示）
  return 'critical'                    // 触发 AutoCompact
}
```

当对话进入 `critical` 区域时，`queryLoop` 在下一次迭代前触发压缩。

### 压缩流程

```
1. 调用 Claude（小模型 Haiku）生成摘要
   - 传入: 所有历史消息
   - 得到: 对话摘要文本

2. 构建压缩后的消息数组
   - 保留: System Prompt（不变）
   - 替换: 历史消息 → 摘要 UserMessage

3. 继续当前 Turn
   - 消息数组缩小到约 5K tokens
   - 原始历史持久化到磁盘（不丢失）
```

### CACHED_MICROCOMPACT（编译开关优化）

```typescript
const compactModule = feature('CACHED_MICROCOMPACT')
  ? require('./services/compact/microCompact.js')
  : require('./services/compact/compact.js')
```

微压缩（MicroCompact）利用 Anthropic 的 **Prompt Cache** 功能：

- 标记压缩边界为可缓存
- 连续对话重用缓存的摘要 tokens
- 降低每次 API 调用的成本和延迟

---

## ReactiveCompact：响应式压缩

**触发条件**：收到 API 的 `prompt_too_long` 错误（400 状态码）

```typescript
// src/query.ts 中
if (feature('REACTIVE_COMPACT') && reactiveCompact) {
  if (reactiveCompact.isPromptTooLongMessage(lastMessage) && 
      !state.hasAttemptedReactiveCompact) {
    // 立即压缩，不等到下次循环
    const compacted = await reactiveCompact.compact(state.messages, ...)
    state = {
      ...state,
      messages: compacted.messages,
      hasAttemptedReactiveCompact: true,  // 只尝试一次
    }
    continue  // 用压缩后的消息重试
  }
}
```

这是一个"已经太晚了才触发"的保护机制——在 AutoCompact 没及时触发时的最后手段。每个 Turn 只尝试一次，避免无限压缩循环。

---

## ContextCollapse：工具结果折叠

**功能**：把大型工具调用结果折叠为摘要

```typescript
// feature('CONTEXT_COLLAPSE') 控制
const contextCollapse = feature('CONTEXT_COLLAPSE')
  ? require('./services/contextCollapse/index.js')
  : null
```

当一个工具调用（如 `FileReadTool`）返回了很大的内容时，ContextCollapse 可以：
1. 保留完整内容用于当前 Turn
2. 在后续 Turn 中用摘要替换（"文件 X 已读取，主要内容是..."）

---

## 手动压缩：/compact 命令

用户可以随时手动触发压缩：

```bash
/compact       # 使用默认摘要
/compact 请重点保留关于认证系统的上下文  # 自定义摘要指令
```

源码位置：`src/commands/compact/`

---

## 压缩边界（Compact Boundary）

`/compact` 执行后，消息历史中会插入一个特殊的 `CompactBoundaryMessage`：

```typescript
// 标记压缩边界
type CompactBoundaryMessage = {
  type: 'compact_boundary'
  summary: string  // 压缩摘要内容
  uuid: string
}
```

这个边界用于：
1. UI 显示"上下文已压缩"的提示
2. `getMessagesAfterCompactBoundary()` 只取边界之后的消息发给 API
3. Resume 会话时知道历史被压缩了

---

## 下一步

- [第四章：工具系统](../ch04-tools/01-tool-abstraction.md) — 53 个工具的设计
