# 4.5 Tool Concurrency and Orchestration

> **Chapter goal**: Understand how `toolOrchestration.ts` manages concurrent multi-tool execution, timeout, interruption, and result collection.

---

## Problem: one Assistant Message may contain multiple tool calls

Claude sometimes calls multiple tools in one response (Parallel Tool Use):

```
AssistantMessage:
  "I will inspect these two files at the same time"
  tool_use[0]: FileReadTool { path: "src/auth/login.ts" }
  tool_use[1]: FileReadTool { path: "src/auth/session.ts" }
```

These two tool calls **can run concurrently**; no need for serial waiting.

---

## runTools(): tool orchestration entry

```typescript
// src/services/tools/toolOrchestration.ts
export async function* runTools(
  assistantMessage: AssistantMessage,
  toolUseContext: ToolUseContext,
  canUseTool: CanUseToolFn,
): AsyncGenerator<Message> {
  const toolUseBlocks = extractToolUseBlocks(assistantMessage)
  
  // Execute all tools concurrently
  const toolResultGenerators = toolUseBlocks.map(block =>
    runSingleTool(block, toolUseContext, canUseTool)
  )
  
  // Collect all results
  for await (const result of mergeGenerators(toolResultGenerators)) {
    yield result
  }
}
```

---

## Key design for concurrency control

### 1. Tools execute concurrently

```typescript
// Start all tool calls in parallel
const results = await Promise.all(
  toolUseBlocks.map(block => executeToolCall(block))
)
```

This means `FileReadTool("a.ts")` and `FileReadTool("b.ts")` start I/O simultaneously and do not wait on each other.

### 2. Permission requests must be serialized

```typescript
// Permission prompts must be shown one-by-one
for (const block of toolUseBlocks) {
  const permission = await canUseTool(block.tool, block.input, ...)
  if (permission.behavior === 'ask') {
    // show permission popup, wait for user response
    await waitForUserPermission(block, permission)
  }
}
```

Tool execution is concurrent, but permission popups are serialized to avoid overwhelming users with multiple dialogs at once.

### 3. AbortSignal propagation

```typescript
// AbortController from toolUseContext passed to each tool
const result = await tool.call(input, {
  ...toolUseContext,
  abortController,  // Ctrl+C interrupts all running tools
})
```

When user presses Ctrl+C, AbortController emits signal and all running tools (including BashTool subprocesses) are terminated.

---

## StreamingToolExecutor: streaming tool execution

```typescript
// src/services/tools/StreamingToolExecutor.ts
```

For tools that support streaming progress (e.g., AgentTool, BashTool), `StreamingToolExecutor` handles:

1. receiving yielded progress events during execution
2. forwarding progress to UI in real time
3. collecting final result when tool finishes

This allows users to see real-time sub-agent progress during AgentTool runs, instead of waiting minutes and receiving output all at once.

---

## Tool timeout handling

Each tool call has dual protection from AbortSignal + timeout:

```typescript
// BashTool has independent timeout logic
const { timeout = DEFAULT_TIMEOUT_MS } = input
const timeoutId = setTimeout(() => {
  controller.abort('Bash command timed out')
}, Math.min(timeout, MAX_TIMEOUT_MS))
```

AgentTool has no hard timeout (sub-agent may run long), but limits sub-agent turn count via `maxTurns`.

---

## setInProgressToolUseIDs: UI progress tracking

```typescript
// UI callback in ToolUseContext
setInProgressToolUseIDs: (f: (prev: Set<string>) => Set<string>) => void
```

When a tool starts, add `toolUseId` to `inProgressToolUseIDs`; remove on completion. UI uses this Set to decide which tools show a spinner.

---

## Tool result formatting

After tool execution, results are wrapped into `UserMessage` with `tool_result`:

```typescript
// successful tool result
createUserMessage({
  content: [{
    type: 'tool_result',
    tool_use_id: block.id,
    content: toolOutput,  // string or content-block array
    is_error: false,
  }],
  toolUseResult: toolOutput,
})

// failed tool result (tool throws)
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

Key design: tool failures do not crash the whole loop; error is returned as tool result to Claude, and Claude decides how to handle it (retry, alternative plan, user explanation, etc.).

---

## Next

- [Chapter 5: Advanced topics](../ch05-advanced/01-kairos.md) — deep dive into KAIROS/Coordinator/Bridge
