# 3.1 The Full Lifecycle of a Conversation

> **Chapter goal**: Understand, from a macro perspective, how Claude Code processes a user request and what happens at each stage.

---

## Overall flowchart

```
User presses Enter
      │
      ▼
┌─────────────────────────────────────────────┐
│ Stage 1: Input processing                   │
│ - Parse whether it is a slash command       │
│   (/help, /clear...)                        │
│ - Process image/file attachments            │
│ - Record into session history               │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│ Stage 2: Context construction               │
│ - Build System Prompt                       │
│   (tool descriptions, project info)         │
│ - Inject CLAUDE.md content                  │
│ - Inject git status snapshot                │
│ - Load memory files (MEMORY.md)             │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│ Stage 3: API call (streaming)               │
│ - Format message array (with history)       │
│ - Select model (primary/fallback)           │
│ - Call Anthropic API                        │
│   (or Bedrock/Vertex)                       │
│ - Receive tokens in a stream                │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│ Stage 4: Response handling loop             │
│                                             │
│  loop:                                      │
│    Receive Assistant Message                │
│    if tool_use:                             │
│      → Permission check (canUseTool)        │
│      → Execute all tools concurrently       │
│      → Collect tool results                 │
│      → Append to message history            │
│      → Continue next API call               │
│    if end_turn:                             │
│      → Exit loop                            │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│ Stage 5: Wrap-up work                       │
│ - Persist session history to disk           │
│ - Update cost tracking (token / USD)        │
│ - Trigger post_turn hooks                   │
│ - Update OpenTelemetry metrics              │
└─────────────────────────────────────────────┘
```

---

## Key data structure: Message

The whole lifecycle revolves around the `Message[]` array. Each message has a type:

```typescript
type Message =
  | UserMessage           // user input
  | AssistantMessage      // AI response (can include tool_use)
  | SystemMessage         // system message (tool results, status notifications)
  | ProgressMessage       // tool execution progress (UI only, not sent to API)
  | ToolUseSummaryMessage // tool-use summary (replaces tool-call history during compact)
  | TombstoneMessage      // placeholder for deleted messages
```

Only `UserMessage` and `AssistantMessage` can be sent to the API. Other types are filtered out in `normalizeMessagesForAPI()`.

---

## What is a "Turn"?

One Turn = from the user sending one message to Claude finally returning a plain-text response (`stop_reason = 'end_turn'`).

Inside one Turn, there can be **multiple API calls** (after each tool call, Claude needs another API call to continue thinking):

```
Turn 1 starts:
  User: "Help me fix this bug"
    │
    ├── API Call 1: Claude says "I'll inspect the code", calls FileReadTool
    │   └── Execute FileReadTool → get file contents
    │
    ├── API Call 2: Claude says "I'll fix it", calls FileEditTool
    │   └── Execute FileEditTool → edit succeeds
    │
    └── API Call 3: Claude says "Fixed. The reason was..." ← end_turn, Turn ends
```

Each tool call is a full API round trip. The `queryLoop` function in `query.ts` implements this behavior with a while loop.

---

## Async Generator: produce and consume simultaneously

The `query()` function is an **async generator**:

```typescript
export async function* query(params: QueryParams): AsyncGenerator<...> {
  yield* queryLoop(params, ...)
}
```

What is elegant about this design:
- The UI layer consumes with `for await`: each yielded event is rendered to terminal immediately
- Streaming tokens are yielded directly, so users see output before the full response completes
- Tool execution progress updates in real time

---

## Error recovery mechanisms

In `query.ts`, there are several automatic recovery mechanisms:

| Error type | Recovery strategy |
|---------|---------|
| `max_output_tokens` | Retry up to 3 times, each time trying to continue unfinished output |
| Context too long | Trigger AutoCompact, compress history, then continue |
| API network error | Auto retry with backoff (`withRetry`) |
| Tool execution failure | Return the error as tool result to Claude so it can handle it |

---

## Next

- [3.2 query.ts: Source-level deep dive of the main loop](./02-query-loop.md) — dive into `queryLoop`
- [3.3 QueryEngine: Conversation state manager](./03-query-engine.md) — understand `submitMessage`
