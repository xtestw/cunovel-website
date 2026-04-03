# 2.1 Six-Layer Architecture: From Terminal Input to AI Output

> **Chapter goal**: Understand Claude Code's full layered architecture and build a clear mental model of "what each layer does and what it depends on."

---

## Architecture Panorama

Claude Code is not a flat program, but an organic system composed of six layers:

```
┌─────────────────────────────────────────────────────┐
│  Layer 6: Feature Gate Layer                           │
│  feature() / USER_TYPE / GrowthBook                    │
├─────────────────────────────────────────────────────┤
│  Layer 5: Network Layer (Network / Bridge)             │
│  Bridge remote control · MCP protocol · OAuth          │
├─────────────────────────────────────────────────────┤
│  Layer 4: Agent Orchestration Layer                    │
│  Coordinator · sub-agents · KAIROS persistent assistant│
├─────────────────────────────────────────────────────┤
│  Layer 3: Core Engine Layer                            │
│  query.ts main loop · QueryEngine · tool execution     │
├─────────────────────────────────────────────────────┤
│  Layer 2: State & Services Layer                       │
│  bootstrap/state.ts · services/ · hooks/               │
├─────────────────────────────────────────────────────┤
│  Layer 1: UI Layer (Terminal UI)                       │
│  React + Ink terminal rendering · 148 UI components    │
└─────────────────────────────────────────────────────┘
```

Each layer depends only on the layers below it and never on layers above it (unidirectional dependency principle).

---

## Layer 1: UI Layer — Rendering Terminal with React

**Location**: `src/components/`, `src/hooks/`, `src/ink.ts`

This is the layer users directly perceive. Surprisingly, Claude Code uses **React + Ink** to render the terminal interface.

```typescript
// src/components/REPL.tsx (simplified)
function REPL() {
  const [messages, setMessages] = useState<Message[]>([])
  
  return (
    <Box flexDirection="column">
      {messages.map(msg => <MessageView key={msg.uuid} message={msg} />)}
      <PromptInput onSubmit={handleSubmit} />
    </Box>
  )
}
```

**Why React?**

- **State synchronization**: streaming updates, tool progress, permission modals—all are state changes, and React's reactive updates fit perfectly
- **Component reuse**: UI elements like `Spinner`, `PermissionRequest`, and `ToolResult` can be developed and tested independently
- **Event-driven model**: user keypresses, tool completion, API responses—all are events handled uniformly by React's event system

---

## Layer 2: State & Services — Global Singleton + Functional Services

**Location**: `src/bootstrap/state.ts`, `src/services/`

### `bootstrap/state.ts`: Global State Center

This is the app's "global singleton," storing all state shared across sessions:

```typescript
// src/bootstrap/state.ts (condensed, original file is 1759 lines)
type State = {
  originalCwd: string           // working directory at startup
  totalCostUSD: number          // total cost for this session
  modelUsage: ModelUsage        // token usage by model
  kairosActive: boolean         // whether KAIROS persistent assistant is active
  meter: Meter | null           // OpenTelemetry metrics meter
  sessionId: SessionId          // current session ID
  // ... 100+ more fields
}
```

> **Note**: The file comment says `DO NOT ADD MORE STATE HERE - BE JUDICIOUS WITH GLOBAL STATE`, showing Anthropic engineers are also actively controlling global-state growth.

### `services/`: Functional Service Collection

| Service | Location | Responsibility |
|------|------|------|
| API service | `services/api/` | Claude API calls, error handling, retries |
| MCP client | `services/mcp/` | MCP protocol communication |
| Analytics & telemetry | `services/analytics/` | GrowthBook + OpenTelemetry |
| Context compaction | `services/compact/` | conversation history compaction algorithms |
| OAuth auth | `services/oauth/` | login/token management |
| Tool execution | `services/tools/` | concurrent tool scheduling |
| AutoDream | `services/autoDream/` | KAIROS memory consolidation |

---

## Layer 3: Core Engine — Agent Main Loop

**Location**: `src/query.ts`, `src/QueryEngine.ts`

This is the heart of the whole system.

```
User input
   │
   ▼
QueryEngine.submitMessage()   ← conversation state management
   │
   ▼
query() → queryLoop()         ← Agent main loop
   │
   ├── Build System Prompt
   ├── Call Claude API (streaming)
   ├── Receive Assistant Message
   │     ├── plain text → return directly
   │     └── tool_use → execute tool → append result to messages → continue loop
   └── exit only when stop_reason = 'end_turn'
```

**Key design**: `query.ts` is an **async generator** that continuously `yield`s message streams:

```typescript
export async function* query(params: QueryParams): AsyncGenerator<...> {
  yield* queryLoop(params, ...)
}
```

This allows the UI layer to consume each streamed token in real time without waiting for the whole response to complete.

---

## Layer 4: Agent Orchestration — Multi-Agent Collaboration

**Location**: `src/coordinator/`, `src/tools/AgentTool/`, `src/assistant/`

When one agent is not enough, this layer coordinates multiple agents:

```
KAIROS mode:
   Main Claude → runs persistently in background → periodically executes tasks automatically

Coordinator mode:
   Main Claude (commander)
       ├── Worker Agent 1 (parallel task A)
       ├── Worker Agent 2 (parallel task B)
       └── Worker Agent 3 (parallel task C)

Fork mode (FORK_SUBAGENT):
   Main Claude → forks sub-Claude → sub-Claude executes → results merged
```

---

## Layer 5: Network Layer — Remote Connectivity

**Location**: `src/bridge/`, `src/services/mcp/`

### Bridge: Bidirectional Remote Control Channel

```
claude.ai web / mobile app
         │
    WebSocket / SSE
         │
    local CLI process
```

The Bridge system lets users control locally running Claude Code from anywhere.

### MCP: Tool Extension Protocol

```
Claude Code
    │
    ├── built-in tools (BashTool, FileEditTool...)
    └── MCP servers (external tools extended through MCP protocol)
              ├── local MCP server (stdio)
              └── remote MCP server (HTTP/SSE)
```

---

## Layer 6: Feature Gate Layer — Code Visibility Control

**Location**: `bun:bundle` (compile time), `bootstrap/state.ts` (runtime), `services/analytics/growthbook.ts` (remote)

This is a cross-cutting concern across all other layers:

```typescript
// compile-time gate
const coordinator = feature('COORDINATOR_MODE')
  ? require('./coordinator/coordinatorMode.js')
  : null

// runtime gate
if (process.env.USER_TYPE === 'ant') {
  // internal features
}

// remote gate
const isEnabled = getFeatureValue_CACHED_MAY_BE_STALE('tengu_kairos')
```

External users see a slimmed-down version after this three-layer filtering.

---

## Data Flow Overview

```
[User typing]
   ↓ Ink events
[React state update] → setMessages()
   ↓
[QueryEngine.submitMessage()] → get SystemPrompt + tool list
   ↓
[query() / queryLoop()] → build API request
   ↓
[Claude API] → streaming response
   ↓
[tool_use check] → tool execution → append result → continue loop
   ↓
[end_turn] → final response
   ↓
[Ink render] → terminal display
   ↓
[sessionStorage] → persisted to disk
```

---

## Next

- [2.2 Three-Layer Feature Gate System](./02-feature-gates.md) — deep dive into switching mechanisms
- [2.3 Global State Management](./03-global-state.md) — detailed analysis of `bootstrap/state.ts`
- [Chapter 3: Core Engine](../ch03-core-engine/01-conversation-lifecycle.md) — deeper into the `query.ts` main loop
