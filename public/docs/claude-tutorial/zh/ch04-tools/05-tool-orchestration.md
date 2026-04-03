# 4.5 工具并发与编排

> **章节目标**：理解 `toolOrchestration.ts` 如何管理多工具并发执行、超时、中断和结果收集。

---

## 问题：一个 Assistant Message 里可能有多个工具调用

Claude 有时会在一条响应里同时调用多个工具（称为 Parallel Tool Use）：

```
AssistantMessage:
  "我来同时看这两个文件"
  tool_use[0]: FileReadTool { path: "src/auth/login.ts" }
  tool_use[1]: FileReadTool { path: "src/auth/session.ts" }
```

这两个工具调用**可以并发执行**，没必要串行等待。

---

## runTools()：工具编排入口

```typescript
// src/services/tools/toolOrchestration.ts
export async function* runTools(
  assistantMessage: AssistantMessage,
  toolUseContext: ToolUseContext,
  canUseTool: CanUseToolFn,
): AsyncGenerator<Message> {
  const toolUseBlocks = extractToolUseBlocks(assistantMessage)
  
  // 并发执行所有工具
  const toolResultGenerators = toolUseBlocks.map(block =>
    runSingleTool(block, toolUseContext, canUseTool)
  )
  
  // 收集所有结果
  for await (const result of mergeGenerators(toolResultGenerators)) {
    yield result
  }
}
```

---

## 并发控制的关键设计

### 1. 工具可以同时执行

```typescript
// 所有工具调用并行启动
const results = await Promise.all(
  toolUseBlocks.map(block => executeToolCall(block))
)
```

这意味着 `FileReadTool("a.ts")` 和 `FileReadTool("b.ts")` 会同时发起 I/O，不互相等待。

### 2. 权限请求必须串行

```typescript
// 权限弹窗必须一个一个问用户，不能同时弹出多个
for (const block of toolUseBlocks) {
  const permission = await canUseTool(block.tool, block.input, ...)
  if (permission.behavior === 'ask') {
    // 显示权限弹窗，等待用户响应
    await waitForUserPermission(block, permission)
  }
}
```

工具执行是并发的，但权限弹窗是串行的，避免同时弹出 5 个权限确认框让用户手足无措。

### 3. AbortSignal 传播

```typescript
// AbortController 从 toolUseContext 传入每个工具
const result = await tool.call(input, {
  ...toolUseContext,
  abortController,  // Ctrl+C 时中断所有正在运行的工具
})
```

当用户按 Ctrl+C 时，AbortController 发出信号，所有正在执行的工具（包括 BashTool 的子进程）都会被终止。

---

## StreamingToolExecutor：流式工具执行

```typescript
// src/services/tools/StreamingToolExecutor.ts
```

对于支持流式进度的工具（如 AgentTool、BashTool），`StreamingToolExecutor` 负责：

1. 接收工具执行过程中的 `yield` 事件（进度消息）
2. 实时传递给 UI 层显示
3. 在工具完成后收集最终结果

这让用户在 AgentTool 执行时能看到子 Agent 的实时进度，而不是等几分钟后突然看到一堆输出。

---

## 工具超时处理

每个工具调用都有 AbortSignal 和 timeout 的双重保护：

```typescript
// BashTool 有独立的超时逻辑
const { timeout = DEFAULT_TIMEOUT_MS } = input
const timeoutId = setTimeout(() => {
  controller.abort('Bash command timed out')
}, Math.min(timeout, MAX_TIMEOUT_MS))
```

AgentTool 没有硬性超时（子 Agent 可以运行很久），但通过 `maxTurns` 限制子 Agent 的 Turn 次数。

---

## setInProgressToolUseIDs：UI 进度追踪

```typescript
// ToolUseContext 中的 UI 回调
setInProgressToolUseIDs: (f: (prev: Set<string>) => Set<string>) => void
```

工具开始执行时，把 `toolUseId` 添加到 `inProgressToolUseIDs`；
完成时移除。UI 根据这个 Set 决定哪些工具显示 Spinner。

---

## 工具结果格式化

工具执行完成后，结果被包装成 `UserMessage`（携带 `tool_result`）：

```typescript
// 成功的工具结果
createUserMessage({
  content: [{
    type: 'tool_result',
    tool_use_id: block.id,
    content: toolOutput,  // 字符串或内容块数组
    is_error: false,
  }],
  toolUseResult: toolOutput,
})

// 失败的工具结果（工具抛出异常）
createUserMessage({
  content: [{
    type: 'tool_result',
    tool_use_id: block.id,
    content: `Error: ${error.message}`,
    is_error: true,
  }],
  toolUseResult: `Error: ${error.message}`,
})
```

关键设计：工具失败不会导致整个循环崩溃，而是把错误信息作为工具结果返回给 Claude，让 Claude 自己决定如何处理（重试、换方案、告知用户等）。

---

## 下一步

- [第五章：高级专题](../ch05-advanced/01-kairos.md) — KAIROS/Coordinator/Bridge 深度解读
