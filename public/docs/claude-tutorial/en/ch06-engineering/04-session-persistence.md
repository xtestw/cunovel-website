# 6.4 Session Persistence and History

> **Goal**: understand how Claude Code persists conversation history on disk and how resume works.

---

## Why history persistence matters

A core Claude Code strength is resumable sessions:

```bash
# start a session
claude

# do substantial work, then Ctrl+C or crash...

# later
claude --resume
```

This requires durable persistence of complete dialog history, including tool calls and results.

---

## Storage layout

```
~/.claude/projects/
    └── <project-id>/          <- path-hash project ID
          └── sessions/
                └── <session-uuid>.jsonl
```

Each session maps to one `.jsonl` file (JSON Lines: one JSON object per line).

---

## `flushSessionStorage()`

Core persistence entrypoint in `src/utils/sessionStorage.ts`:

```typescript
export async function flushSessionStorage(
  messages: Message[],
  sessionId: SessionId,
  cwd: string,
  options?: {
    compactBoundaryMessage?: CompactBoundaryMessage
  },
): Promise<void>
```

Called:

- after each turn ends
- on Ctrl+C interrupt handling
- during normal app exit

Why JSONL over plain JSON:

```javascript
// JSON needs read-parse-rewrite entire file
// JSONL can append one line directly
appendFileSync('session.jsonl', JSON.stringify(newMessage) + '\n')
```

Append operations are crash-safe for existing content and avoid full-file rewrites.

---

## Serialization format

Each line stores one `Message`, with cleanup before write:

```typescript
function serializeMessageForStorage(msg: Message): StoredMessage {
  // remove toolUseResult (large payload, can be reconstructed)
  return { ...msg, toolUseResult: undefined }
}
```

`toolUseResult` is omitted to reduce file size because equivalent data can be rebuilt from `tool_result` content blocks.

---

## `recordTranscript()`

```typescript
export function recordTranscript(
  message: Message,
  sessionId: SessionId,
  cwd: string,
): void
```

Immediate write path for each message, independent from end-of-turn flushing.

Difference:

- `recordTranscript`: real-time durability for crash recovery
- `flushSessionStorage`: coherent turn-level sync of final message state

---

## `contentReplacement`: tool-result budget control

Large tool outputs are not always embedded directly in message history:

```typescript
type ContentReplacementState = {
  replacements: Map<string, ContentReplacement> // toolUseId -> replacement text
  totalTokens: number
}
```

When tool output exceeds budget:

1. full output stored in `~/.claude/tool-results/<uuid>`
2. transcript stores reference placeholder
3. full content can be fetched on demand

```typescript
export async function recordContentReplacement(
  toolUseId: string,
  replacement: ContentReplacement,
  state: ContentReplacementState,
): Promise<void>
```

---

## Resume flow

```bash
claude --resume
claude --resume --session-id 01JXXXXX
```

Flow:

```
1. read all .jsonl under project session directory
2. sort by mtime (newest first)
3. user selects one session (or auto-pick latest)
4. deserialize all messages -> mutableMessages
5. if incomplete turn exists (tool_use without tool_result):
   -> yieldMissingToolResultBlocks() generates error tool_result blocks
6. start session with restored history
```

### Incomplete-turn handling

```typescript
function* yieldMissingToolResultBlocks(
  assistantMessages: AssistantMessage[],
  errorMessage: string,
) {
  for (const assistantMessage of assistantMessages) {
    const toolUseBlocks = assistantMessage.message.content.filter(
      content => content.type === 'tool_use',
    )
    for (const toolUse of toolUseBlocks) {
      yield createUserMessage({
        content: [{
          type: 'tool_result',
          content: errorMessage,
          is_error: true,
          tool_use_id: toolUse.id,
        }],
      })
    }
  }
}
```

This guarantees restored history conforms to Anthropic API constraints (every `tool_use` has a matching `tool_result`).

---

## Session persistence switch

```typescript
export function isSessionPersistenceDisabled(): boolean {
  return isEnvTruthy(process.env.CLAUDE_NO_SESSION_PERSISTENCE)
}
```

Useful for transient environments (e.g., CI/headless runs).

---

## File cleanup policy

Session cleanup logic in `src/utils/sessionStorage.ts`:

```typescript
const MAX_SESSIONS_PER_PROJECT = 100
const MAX_SESSION_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
```

If limits are exceeded:

- delete oldest session files beyond count cap
- trim old messages when file size exceeds threshold

---

## End-to-end persistence data flow

```
user input
    ↓
recordTranscript(userMessage)          <- immediate disk write
    ↓
tool calls -> recordTranscript(toolResult)
    ↓
Claude response -> recordTranscript(assistantMessage)
    ↓
turn ends
    ↓
flushSessionStorage(allMessages)       <- coherent turn sync
    ↓
update telemetry (cost, tokens)
```

This dual-write strategy balances crash safety (immediate writes) and performance (batched turn flushes).
