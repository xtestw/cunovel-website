# 5.3 Bridge: Remote Control of Local CLI from claude.ai

> **Source location**: `src/bridge/` (33 files, `replBridge.ts` alone is 98KB)  
> **Compile gates**: `feature('BRIDGE_MODE')`, `feature('DAEMON')`  
> **Remote gate**: GrowthBook `tengu_ccr_bridge`

---

## One-line understanding

Bridge is a **bidirectional transport channel** that lets you control Claude Code running on your local machine from claude.ai web or mobile.

```
Phone / Browser
       │
     HTTPS
       │
Anthropic relay server
       │
 WebSocket / SSE
       │
local claude process on your computer
```

---

## Two operating modes

### Mode 1: Embedded REPL bridge (`/remote-control`)

Inside an active local `claude` session, run `/remote-control`:

```
- current conversation is mirrored to claude.ai
- both local typing and web typing drive the same session
- closing web UI does not stop local execution
```

Code: `src/bridge/initReplBridge.ts` + `src/bridge/replBridge.ts`

### Mode 2: Standalone bridge server (`claude remote-control`)

As a long-running background service:

```
register environment -> poll tasks continuously -> spawn subprocess per task
```

Code: `src/bridge/bridgeMain.ts` (112KB)

Three session dispatch modes:

| Mode | Description |
|------|-------------|
| `single-session` | exits after handling one session |
| `worktree` | each session gets its own git worktree |
| `same-dir` | all sessions share one working directory |

---

## Enablement checks (three layers)

```typescript
// src/bridge/bridgeEnabled.ts
isBridgeEnabled() =
  feature('BRIDGE_MODE')             <- compile-time (not available externally)
  && isClaudeAISubscriber()          <- paid subscriber required
  && GrowthBook('tengu_ccr_bridge')  <- Anthropic remote gate
```

Non-subscribers get a diagnostic prompt to upgrade.

---

## Two protocol generations

### v1 protocol (environment-layer design)

Full environment lifecycle:

```
1. register env   POST /v1/environments/bridge
2. poll work      GET  /v1/environments/{id}/work/poll (long poll + exponential backoff)
3. confirm work   POST /v1/environments/{id}/work/confirm
4. heartbeat      POST /v1/environments/{id}/heartbeat
5. unregister     DELETE /v1/environments/{id}
```

Transport: `HybridTransport` (WebSocket read + HTTP POST write)

### v2 protocol (skip environment layer)

```
1. create session POST /v1/code/sessions
2. get JWT        POST /v1/code/sessions/{id}/bridge
3. open channel   SSE read + CCRClient write
4. refresh JWT    proactively refresh 5 minutes before expiry
```

v2 bypasses Environments API and connects directly to session-ingress for lower latency.

GrowthBook gate: `tengu_bridge_repl_v2` (progressive migration v1 -> v2).

---

## Server control requests

Via Bridge, claude.ai can send local CLI control instructions:

| Request type | Description |
|--------------|-------------|
| `initialize` | fetch CLI capability declaration |
| `set_model` | switch model |
| `set_max_thinking_tokens` | adjust thinking token cap |
| `set_permission_mode` | change permission mode (`accept_edits`, etc.) |
| `interrupt` | interrupt current operation (like Ctrl+C) |

**Critical deadline**: each control request must be answered within **10-14 seconds**, otherwise server closes the connection.

---

## Message dedupe: `BoundedUUIDSet`

`src/bridge/bridgeMessaging.ts` includes an elegant dedupe mechanism:

```typescript
// ring buffer to prevent unbounded memory growth
export class BoundedUUIDSet {
  private readonly maxSize: number  // default 2000
  private readonly queue: string[]  // ring-like queue
  private readonly set: Set<string>

  add(uuid: string): boolean {
    if (this.set.has(uuid)) return false
    if (this.queue.length >= this.maxSize) {
      const evicted = this.queue.shift()!
      this.set.delete(evicted)
    }
    this.queue.push(uuid)
    this.set.add(uuid)
    return true
  }
}
```

Used for:

- **echo dedupe**: filter messages originally sent by self
- **redelivery dedupe**: prevent processing same message twice

---

## Crash recovery

`src/bridge/bridgePointer.ts` implements pointer-file recovery:

```
write: ~/.claude/projects/<cwd-hash>/bridge-pointer.json
data: { sessionId, environmentId, source }
TTL: 4 hours
mtime: refreshed periodically while running
cleanup: removed on clean shutdown
```

On next startup, if pointer file exists and is fresh:

```
Found an interrupted Bridge session. Would you like to resume it?
  ❯ Yes, resume session abc-123
    No, start fresh
```

---

## Security model

| Mechanism | Description |
|-----------|-------------|
| **OAuth token** | primary identity credential, read from system keychain, auto-refreshed |
| **Worker JWT** | short-lived token per session (hours) |
| **Trusted Device Token** | device trust token to prevent unknown device takeover |
| **401 auto recovery** | detect 401 -> refresh OAuth -> reacquire credentials -> rebuild transport |
| **namespace protection** | `isInProtectedNamespace()` blocks sensitive system directory operations |

---

## Why `replBridge.ts` is 98KB

`src/bridge/replBridge.ts` is the largest single file in the project (98.18KB) because it hosts **all REPL-mode bridge logic**:

- message flush queue (preserve pre-connection history)
- full v1/v2 protocol implementation
- connection state machine (`ready -> connected -> reconnecting -> failed`)
- JWT refresh scheduler
- permission callback routing

This "big-file" design has trade-offs: it violates strict single-responsibility, but centralizes bridge REPL state to avoid difficult cross-module synchronization.

---

## Next

- [5.4 BUDDY: Deterministic AI Pet Algorithm](./04-buddy.md)
- [5.5 Voice & Proactive](./05-voice-proactive.md)
