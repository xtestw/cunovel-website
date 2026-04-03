# 3.2 query.ts: Source-Level Deep Dive of the Main Loop

> **Chapter goal**: Understand the core logic of the `queryLoop` function line by line, and master how the agent main loop is implemented.

---

## Function signature: async generator

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

`query()` is an outer wrapper around `queryLoop()`, mainly responsible for command-lifecycle wrap-up notifications. The core logic is inside `queryLoop()`.

---

## QueryParams: the "ticket" into the loop

```typescript
export type QueryParams = {
  messages: Message[]              // history messages (including current user input)
  systemPrompt: SystemPrompt       // system prompt
  userContext: { [k: string]: string }  // user context injected into System Prompt
  systemContext: { [k: string]: string } // system context injected into System Prompt
  canUseTool: CanUseToolFn         // permission check function
  toolUseContext: ToolUseContext   // all context needed for tool execution
  fallbackModel?: string           // fallback model (e.g., Sonnet downgraded to Haiku)
  querySource: QuerySource         // request source (REPL / SDK / headless)
  maxOutputTokensOverride?: number // override max output tokens
  maxTurns?: number                // maximum loop turns
  taskBudget?: { total: number }   // API-layer task budget (beta)
}
```

---

## Loop state: State object

```typescript
type State = {
  messages: Message[]                   // ever-growing message array
  toolUseContext: ToolUseContext         // tool context (may be updated during loop)
  autoCompactTracking: ...              // auto-compaction state tracking
  maxOutputTokensRecoveryCount: number  // max_output_tokens recovery counter (up to 3)
  hasAttemptedReactiveCompact: boolean  // whether reactive compaction was attempted
  maxOutputTokensOverride: number | undefined
  pendingToolUseSummary: Promise<...>   // tool-use summary (generated in background)
  stopHookActive: boolean | undefined   // whether Stop Hook is active
  turnCount: number                     // current turn count
  transition: Continue | undefined      // reason for continuing from last iteration
}
```

**Key design**: State uses immutable-update style:

```typescript
// Not this:
state.messages = newMessages

// But this:
state = { ...state, messages: newMessages, transition: continueReason }
```

This makes state changes traceable and easier to debug.

---

## Main loop skeleton

```typescript
async function* queryLoop(params, consumedCommandUuids) {
  let state = { messages: params.messages, ... }

  while (true) {
    const { messages, toolUseContext } = state

    // ① Build API request
    const model = getRuntimeMainLoopModel(...)
    const apiMessages = normalizeMessagesForAPI(messages)
    
    // ② Yield request-start event (so UI knows request started)
    yield { type: 'request_start', model }

    // ③ Call Claude API in streaming mode
    for await (const event of callClaudeAPI({ model, messages: apiMessages, ... })) {
      yield event  // yield to UI in real time
    }

    // ④ Get final AssistantMessage
    const assistantMessage = getLastAssistantMessage(messages)

    // ⑤ Check exit condition
    if (assistantMessage.stop_reason === 'end_turn') {
      return { type: 'end_turn', ... }  // exit loop
    }

    // ⑥ Handle tool calls
    if (assistantMessage.stop_reason === 'tool_use') {
      const toolResults = yield* runTools(assistantMessage, toolUseContext)
      state = { ...state, messages: [...messages, assistantMessage, ...toolResults] }
      continue  // next iteration
    }

    // ⑦ Handle exceptional cases (max_tokens, prompt_too_long, etc.)
    // ...
  }
}
```

---

## Context compaction: prevent conversation "explosion"

Claude has a context-window limit (~200K tokens). When history gets too long, `queryLoop` has two strategies:

### AutoCompact

Triggered when token usage approaches the limit:

```typescript
// src/services/compact/autoCompact.ts
export function calculateTokenWarningState(
  contextTokens: number,
  maxTokens: number,
): 'safe' | 'warning' | 'critical' {
  const ratio = contextTokens / maxTokens
  if (ratio < 0.7) return 'safe'
  if (ratio < 0.85) return 'warning'
  return 'critical'  // trigger AutoCompact
}
```

How AutoCompact works:
1. Send history messages to a small model (Haiku)
2. Ask it to generate a conversation summary
3. Replace old messages with the summary
4. Continue the current Turn

### ReactiveCompact (feature gate)

```typescript
// Controlled by compile switch
const reactiveCompact = feature('REACTIVE_COMPACT')
  ? require('./services/compact/reactiveCompact.js')
  : null
```

ReactiveCompact triggers immediately upon `prompt_too_long` errors and retries, more aggressively than AutoCompact.

---

## max_output_tokens recovery logic

When Claude output is truncated (`stop_reason = 'max_tokens'`), the loop attempts recovery:

```typescript
const MAX_OUTPUT_TOKENS_RECOVERY_LIMIT = 3

// Recovery strategy
if (assistantMessage.stop_reason === 'max_tokens' && 
    state.maxOutputTokensRecoveryCount < MAX_OUTPUT_TOKENS_RECOVERY_LIMIT) {
  
  // Append a "continue" user message
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

This is why Claude can sometimes continue output automatically after being cut off.

---

## Tool execution: runTools

Tool execution is the most complex part of the main loop and is delegated to `runTools()`:

```typescript
// src/services/tools/toolOrchestration.ts
import { runTools } from './services/tools/toolOrchestration.js'

// Inside queryLoop
const toolMessages = yield* runTools(assistantMessage, toolUseContext, canUseTool)
```

`runTools` handles:
- **Concurrent execution** of multiple tools (one message may have multiple `tool_use` blocks)
- Permission checks (`canUseTool`)
- Tool result collection
- Error handling (tool failures become results returned to Claude, not loop crashes)

---

## Token budget (feature gate)

```typescript
const budgetTracker = feature('TOKEN_BUDGET') ? createBudgetTracker() : null
```

The token budget system (`TOKEN_BUDGET` switch) tracks token consumption in the current Turn and forcibly terminates the loop when budget is exceeded, then informs Claude.

---

## Exit state: Terminal

`queryLoop` is not an infinite loop; it returns a `Terminal` type to indicate why it exited:

```typescript
type Terminal =
  | { type: 'end_turn' }           // normal finish
  | { type: 'max_turns' }          // reached max turns
  | { type: 'abort' }              // user interrupt (Ctrl+C)
  | { type: 'budget_exceeded' }    // token budget exceeded
  | { type: 'error'; error: Error } // unrecoverable error
```

---

## Next

- [3.3 QueryEngine: Conversation state manager](./03-query-engine.md) — detailed QueryEngine class
- [3.4 System Prompt construction mechanism](./04-system-prompt.md) — parsing `fetchSystemPromptParts`
