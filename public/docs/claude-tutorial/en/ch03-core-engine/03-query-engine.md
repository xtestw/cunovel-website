# 3.3 QueryEngine: Conversation State Manager

> **Chapter goal**: Understand how the `QueryEngine` class manages multi-turn conversation state, and how responsibilities are split with `query.ts`.

---

## QueryEngine responsibilities

`queryLoop` in `query.ts` manages state **within a single Turn** (tool-call loops, context compaction).

`QueryEngine` manages state **across multiple Turns** (history, usage stats, permission denial records).

```
QueryEngine (session level)
    │
    ├── submitMessage() → Turn 1 → queryLoop → return
    ├── submitMessage() → Turn 2 → queryLoop → return
    └── submitMessage() → Turn 3 → queryLoop → return
    
    shared state: mutableMessages, totalUsage, permissionDenials
```

---

## Class definition and core fields

```typescript
export class QueryEngine {
  private config: QueryEngineConfig
  
  // Message history shared across turns
  private mutableMessages: Message[]
  
  // Abort Controller (supports external interruption)
  private abortController: AbortController
  
  // Permission denial records (for SDK reporting)
  private permissionDenials: SDKPermissionDenial[]
  
  // Accumulated token usage
  private totalUsage: NonNullableUsage
  
  // Discovered skill names (avoid duplicate telemetry reporting)
  private discoveredSkillNames = new Set<string>()
  
  // Loaded nested memory file paths (avoid duplicate injection)
  private loadedNestedMemoryPaths = new Set<string>()
}
```

---

## submitMessage(): entry point for each conversation turn

```typescript
async *submitMessage(
  prompt: string | ContentBlockParam[],
  options?: { uuid?: string; isMeta?: boolean },
): AsyncGenerator<SDKMessage, void, unknown> {
  // 1. Reset turn-level tracking state
  this.discoveredSkillNames.clear()
  setCwd(cwd)
  
  // 2. Build system prompt
  const { defaultSystemPrompt, userContext, systemContext } = 
    await fetchSystemPromptParts({ tools, ... })
  
  // 3. Process user input (slash commands, attachments, etc.)
  const processed = await processUserInput(prompt, ...)
  
  // 4. Push to message history
  this.mutableMessages = [...this.mutableMessages, processed.userMessage]
  
  // 5. Call query() main loop
  for await (const message of query({
    messages: this.mutableMessages,
    systemPrompt,
    canUseTool: wrappedCanUseTool,
    ...
  })) {
    // 6. Update session state
    if (isAssistantMessage(message)) {
      this.mutableMessages = [...this.mutableMessages, message]
      this.totalUsage = accumulateUsage(this.totalUsage, message.usage)
    }
    
    // 7. Yield to upper-level caller
    yield toSDKMessage(message)
  }
  
  // 8. Persist session
  if (persistSession) {
    await flushSessionStorage(this.mutableMessages, ...)
  }
}
```

---

## Permission denial tracking

QueryEngine wraps the `canUseTool` function and records each denial without changing original logic:

```typescript
const wrappedCanUseTool: CanUseToolFn = async (...args) => {
  const result = await canUseTool(...args)
  
  if (result.behavior !== 'allow') {
    // Record denied tool calls for SDK caller querying
    this.permissionDenials.push({
      tool_name: sdkCompatToolName(tool.name),
      tool_use_id: toolUseID,
      tool_input: input,
    })
  }
  
  return result
}
```

This is a classic Decorator pattern: add extra behavior (recording denials) without modifying the wrapped function.

---

## QueryEngine vs ask()

Claude Code has two code paths:

| Path | Usage scenario | Entry point |
|------|---------|------|
| `QueryEngine` | SDK calls, headless mode | `new QueryEngine(config).submitMessage(prompt)` |
| `ask()` | REPL interactive mode | `ask()` function in `src/QueryEngine.ts` |

Both eventually call `query()`. Difference:
- `QueryEngine` is object-oriented style, with state stored on the instance
- `ask()` is functional style, with state passed through React AppState

The comment explicitly says:

> *"One QueryEngine per conversation. Each submitMessage() call starts a new turn within the same conversation."*

---

## Next

- [3.4 System Prompt construction mechanism](./04-system-prompt.md) — `fetchSystemPromptParts` deep dive
- [3.5 Context compaction](./05-context-compact.md) — the secret to preventing context explosion
