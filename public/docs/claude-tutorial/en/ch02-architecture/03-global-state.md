# 2.3 Global State Management: Dissecting `bootstrap/state.ts`

> **Chapter goal**: Understand how Claude Code uses a centralized State object to manage global state, and why it is designed this way.

---

## File Overview

`src/bootstrap/state.ts` is the application's "central nervous system": 1,759 lines managing all runtime state that must be shared across modules.

There is a very interesting comment at the top:

```typescript
// DO NOT ADD MORE STATE HERE - BE JUDICIOUS WITH GLOBAL STATE
```

This shows that even inside Anthropic, global-state growth is a risk that requires constant discipline.

---

## `State` Type Structure

```typescript
type State = {
  // ── runtime environment ──
  originalCwd: string          // startup working directory (immutable)
  projectRoot: string          // project root
  cwd: string                  // current working directory (can change)
  isInteractive: boolean       // interactive mode (REPL vs headless)

  // ── AI model ──
  mainLoopModelOverride: ModelSetting | undefined  // user-switched model override
  initialMainLoopModel: ModelSetting               // model at startup

  // ── cost and usage ──
  totalCostUSD: number          // total session cost
  totalAPIDuration: number      // cumulative API duration (including retries)
  modelUsage: { [modelName: string]: ModelUsage }  // token usage by model

  // ── telemetry ──
  meter: Meter | null           // OpenTelemetry metrics meter
  sessionId: SessionId          // unique current session ID
  sessionCounter: AttributedCounter | null
  costCounter: AttributedCounter | null
  tokenCounter: AttributedCounter | null
  // ...more OTel counters

  // ── feature-switch state ──
  kairosActive: boolean         // whether KAIROS is active

  // ── security and permissions ──
  strictToolResultPairing: boolean  // strict tool-result pairing (HFI mode)

  // ...about 60+ fields in total
}
```

---

## Singleton Pattern Implementation

State is a module-level variable exposed through getter/setter functions:

```typescript
// module-private state
let state: State = {
  originalCwd: realpathSync(cwd()),
  // ...initial values
}

// public read functions
export function getOriginalCwd(): string {
  return state.originalCwd
}

export function getTotalCost(): number {
  return state.totalCostUSD
}

// public write functions
export function setKairosActive(active: boolean): void {
  state = { ...state, kairosActive: active }
}

export function incrementTotalCost(delta: number): void {
  state = { ...state, totalCostUSD: state.totalCostUSD + delta }
}
```

**Why wrap with functions instead of exporting the object directly?**

1. **Immutable updates**: each write returns a new object (`state = { ...state, ... }`), making state transitions easier to track
2. **Access control**: logging, validation, and guards can be added in getters/setters
3. **Type safety**: TypeScript can type-check each field-specific accessor independently

---

## Key State Fields in Detail

### Session ID (`SessionId`)

```typescript
export function getSessionId(): SessionId {
  return state.sessionId
}
```

`SessionId` flows through the entire system:
- used to correlate telemetry events (all OTel spans carry `sessionId`)
- used for naming session history files
- used as cross-process identifier for Bridge communication

### Model Usage Tracking (`modelUsage`)

```typescript
type ModelUsage = {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
}
```

Usage is tracked separately per model (e.g., `claude-opus-4-5`, `claude-sonnet-4-5`), enabling mixed-model scenarios (such as Coordinator using Opus while Workers use Sonnet).

### KAIROS Activation State

```typescript
kairosActive: boolean  // default false
```

This field controls behavior branches for persistent assistant mode. When `kairosActive = true`:
- the main loop does not exit and waits for the next user input
- Dream memory-consolidation scheduling is enabled
- proactive tick mechanism is enabled

---

## Initialization Flow

State is initialized when the module loads (ESM top-level code):

```typescript
let state: State = {
  originalCwd: realpathSync(cwd()),  // real path (resolve symlinks)
  projectRoot: realpathSync(cwd()),
  startTime: Date.now(),
  lastInteractionTime: Date.now(),
  sessionId: randomUUID() as SessionId,
  kairosActive: false,
  isInteractive: false,
  // ...other defaults
}
```

Note `realpathSync(cwd())`—symlinks are intentionally resolved to ensure path stability (avoiding permission bugs caused by mismatch between symlink paths and real paths).

---

## Relationship with React `AppState`

```
bootstrap/state.ts (global singleton)    ←→    AppState (React state)
     │                                       │
     │ accessed via getXxx()/setXxx()        │ accessed via useState/useContext
     │                                       │
     │ suitable for cross-module shared data │ suitable for UI state requiring re-render
     │ that does not need UI re-render        │
     │ e.g., sessionId, totalCost            │ e.g., message list, modal status
```

Design principle: **state that must trigger UI re-renders belongs in React AppState; state that does not belongs in bootstrap/state**.

---

## Next

- [2.4 UI Layer: React + Ink Terminal Rendering](./04-ink-tui.md)
- [Chapter 3: Core Engine](../ch03-core-engine/01-conversation-lifecycle.md) — deeper into the main loop
