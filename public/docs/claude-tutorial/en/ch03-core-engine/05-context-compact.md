# 3.5 Context Compaction: How Conversation History Avoids Explosion

> **Chapter goal**: Understand Claude Code's multi-layer context-compaction mechanisms, including trigger conditions and implementation details for each strategy.

---

## The problem: limited context window

Claude's context window is around 200K tokens. A complex coding session can easily exceed this:

- each large file read: possibly 5K-50K tokens
- detailed tool outputs: possibly 1K-5K tokens each call
- long conversation history: 500-2000 tokens per round
- System Prompt: around 5K-15K tokens

Claude Code implements multiple compaction mechanisms for this.

---

## Overview of compaction mechanisms

```
Context size
    │
    ▼
normalizeMessagesForAPI()        ← baseline filtering (always runs)
    │ filter UI-only messages
    │
    ▼
AutoCompact                      ← auto-trigger near limit (>85%)
    │ summarize history
    │ optimized by feature('CACHED_MICROCOMPACT')
    │
    ▼
ReactiveCompact                  ← when prompt_too_long error is received
    │ feature('REACTIVE_COMPACT')
    │
    ▼
ContextCollapse                  ← collapse tool-call results
    │ feature('CONTEXT_COLLAPSE')
    │
    ▼
SnipCompact                      ← history truncation
      feature('HISTORY_SNIP')
```

---

## normalizeMessagesForAPI()

This is baseline filtering that runs before every API call:

```typescript
// src/utils/messages.ts
export function normalizeMessagesForAPI(messages: Message[]): APIMessage[] {
  return messages
    .filter(m => !isUIOnlyMessage(m))  // filter ProgressMessage etc.
    .filter(m => !isTombstoneMessage(m)) // filter deleted placeholders
    .map(m => toAPIFormat(m))
    // ... more processing
}
```

Filtered-out message types:
- `ProgressMessage`: tool progress updates (UI-only)
- `TombstoneMessage`: placeholder for deleted messages
- `SystemMessage` (specific kinds): UI notification messages

---

## AutoCompact: proactive compaction

### Trigger timing

```typescript
// src/services/compact/autoCompact.ts
export type TokenWarningState = 'safe' | 'warning' | 'critical'

export function calculateTokenWarningState(
  contextTokens: number,
  maxTokens: number,
): TokenWarningState {
  const ratio = contextTokens / maxTokens
  if (ratio < 0.7) return 'safe'      // safe zone
  if (ratio < 0.85) return 'warning'  // warning zone (user sees warning)
  return 'critical'                    // trigger AutoCompact
}
```

When conversation enters `critical` zone, `queryLoop` triggers compaction before next iteration.

### Compaction flow

```
1. Call Claude (small model Haiku) to generate summary
   - Input: all history messages
   - Output: conversation summary text

2. Build compacted message array
   - Keep: System Prompt (unchanged)
   - Replace: history messages → summary UserMessage

3. Continue current Turn
   - Message array shrinks to ~5K tokens
   - Raw history is persisted to disk (not lost)
```

### CACHED_MICROCOMPACT (compile-switch optimization)

```typescript
const compactModule = feature('CACHED_MICROCOMPACT')
  ? require('./services/compact/microCompact.js')
  : require('./services/compact/compact.js')
```

MicroCompact uses Anthropic **Prompt Cache**:

- mark compaction boundaries as cacheable
- reuse cached summary tokens in consecutive turns
- reduce per-call cost and latency

---

## ReactiveCompact: reactive compaction

**Trigger condition**: API returns `prompt_too_long` (HTTP 400)

```typescript
// in src/query.ts
if (feature('REACTIVE_COMPACT') && reactiveCompact) {
  if (reactiveCompact.isPromptTooLongMessage(lastMessage) && 
      !state.hasAttemptedReactiveCompact) {
    // Compact immediately, no wait for next loop
    const compacted = await reactiveCompact.compact(state.messages, ...)
    state = {
      ...state,
      messages: compacted.messages,
      hasAttemptedReactiveCompact: true,  // try only once
    }
    continue  // retry with compacted messages
  }
}
```

This is a "last-resort" safeguard when AutoCompact did not trigger in time. It runs at most once per Turn to avoid infinite compaction loops.

---

## ContextCollapse: tool-result collapsing

**Function**: collapse large tool results into summaries

```typescript
// controlled by feature('CONTEXT_COLLAPSE')
const contextCollapse = feature('CONTEXT_COLLAPSE')
  ? require('./services/contextCollapse/index.js')
  : null
```

When a tool call (e.g., `FileReadTool`) returns very large content, ContextCollapse can:
1. keep full content for the current Turn
2. replace it with a summary in later Turns ("File X has been read; key content is ...")

---

## Manual compaction: `/compact` command

Users can trigger compaction anytime:

```bash
/compact       # use default summary
/compact 请重点保留关于认证系统的上下文  # custom summary instruction
```

Source path: `src/commands/compact/`

---

## Compaction boundary (Compact Boundary)

After `/compact`, a special `CompactBoundaryMessage` is inserted into history:

```typescript
// Mark compaction boundary
type CompactBoundaryMessage = {
  type: 'compact_boundary'
  summary: string  // compaction summary content
  uuid: string
}
```

This boundary is used to:
1. show "context compacted" in UI
2. let `getMessagesAfterCompactBoundary()` send only post-boundary messages to API
3. indicate compaction status when resuming sessions

---

## Next

- [Chapter 4: Tool system](../ch04-tools/01-tool-abstraction.md) — the design of 53 tools
