# 1.3 Codebase Map: How to Navigate 1,987 Files

> **Chapter goal**: Build a mental map of the source tree so you know "which directory to go to for which feature."

---

## Global Structure

```
ClaudeCode/
├── src/           ← core source code (1,987 .ts/.tsx files)
├── docs/          ← analysis docs (the tutorial you are reading)
├── shims/         ← JS fallbacks for native modules
├── vendor/        ← C++/Rust native binding source
├── package.json   ← dependency declarations
└── tsconfig.json  ← TypeScript config
```

---

## `src/` Directory Breakdown

### 🚪 Entry Files (Start Reading Here)

```
src/
├── dev-entry.ts      ← dev-mode entry, initializes MACRO constants
├── main.tsx          ← main entry (785 KB!) React root component + full REPL logic
└── query.ts          ← main loop (67 KB), Agent core
```

> **Tip**: `main.tsx` is 785 KB; do not try to read it linearly. Start with `query.ts` to understand the core logic.

---

### 🔧 Tool System

```
src/tools/           ← one subdirectory per tool
├── BashTool/        ← execute shell commands
├── FileReadTool/    ← read files
├── FileEditTool/    ← edit files (string-replace style)
├── FileWriteTool/   ← write files (full overwrite)
├── GlobTool/        ← file path matching
├── GrepTool/        ← file content search
├── AgentTool/       ← recursively launch sub-agents
├── WebSearchTool/   ← web search
├── WebFetchTool/    ← fetch webpage content
├── MCPTool/         ← MCP protocol dynamic tools
├── TodoWriteTool/   ← task list management
└── ... (53 total)

src/Tool.ts          ← abstract base type definitions for tools (28 KB)
src/tools.ts         ← tool registry, assembles all tools together
```

---

### 💬 Command System

```
src/commands/        ← 87 slash commands, one subdirectory each
├── help/            ← /help
├── clear/           ← /clear
├── compact/         ← /compact (manual context compaction)
├── memory/          ← /memory
├── model/           ← /model (switch model)
├── mcp/             ← /mcp (MCP service management)
├── config/          ← /config
├── plan/            ← /plan (plan mode)
└── ...

src/commands.ts      ← command registry center (24 KB)
```

---

### 🏗️ State Management

```
src/bootstrap/
└── state.ts         ← global singleton state (54 KB)
                       includes: model, cost, session ID, telemetry Meter...

src/state/
└── AppState.ts      ← React app state type definitions

src/context/         ← React Context definitions
src/hooks/           ← 87 custom Hooks (state, permissions, UI, etc.)
```

---

### 🎨 UI Components

```
src/components/      ← 148 Ink/React terminal components
├── REPL.tsx         ← main conversation interface
├── Spinner.tsx      ← loading animation
├── PermissionRequest.tsx ← permission confirmation modal
├── MessageSelector.tsx   ← message selector
└── ...

src/ink.ts           ← Ink rendering engine wrapper
src/outputStyles/    ← output styling system
```

---

### 🤖 Advanced Feature Modules

```
src/assistant/       ← KAIROS persistent assistant mode
├── index.ts
└── sessionHistory.ts

src/coordinator/     ← multi-agent orchestration
└── coordinatorMode.ts

src/bridge/          ← remote control (33 files)
├── replBridge.ts    ← REPL-side bridge main file (98 KB)
├── remoteBridgeCore.ts ← remote-side core
└── ...

src/proactive/       ← proactive mode (autonomous operation when idle)
src/buddy/           ← AI virtual pet
src/voice/           ← voice interaction
src/vim/             ← Vim keybinding mode
```

---

### 🔌 Service Layer

```
src/services/
├── api/             ← Claude API client wrappers
│   ├── claude.ts    ← API call core
│   └── errors.ts    ← error types
├── mcp/             ← MCP protocol client
├── analytics/       ← event tracking (GrowthBook + custom)
├── compact/         ← context compaction algorithm
├── oauth/           ← OAuth auth
├── autoDream/       ← KAIROS memory consolidation
└── tools/           ← tool execution infrastructure
    └── toolOrchestration.ts ← tool concurrency scheduler
```

---

### 🛠️ Utility Functions

```
src/utils/           ← large collection of utility functions
├── config.ts        ← config file read/write
├── git.ts           ← Git operation wrappers
├── permissions/     ← permission decision logic
├── messages.ts      ← message formatting
├── model/           ← model selection logic
├── claudemd.ts      ← CLAUDE.md handling
├── cwd.ts           ← working directory management
└── ... (dozens of files)
```

---

## How to Read This Codebase Efficiently

### Method 1: Start from Feature Entry Points

| I want to study... | Where to look |
|------------|---------|
| Full conversation flow | `queryLoop` in `src/query.ts` |
| How tools are executed | `src/services/tools/toolOrchestration.ts` |
| Permission decision logic | `src/hooks/useCanUseTool.ts` |
| System prompt content | `fetchSystemPromptParts` in `src/utils/queryContext.ts` |
| Context compaction | `src/services/compact/compact.ts` |
| Multi-agent orchestration | `src/coordinator/coordinatorMode.ts` |

### Method 2: Trace the Data Flow

Receive user input in `main.tsx` → `QueryEngine.submitMessage()` → `query()` → `queryLoop()` → tool execution → streamed response back

### Method 3: Read Type Definitions First

`src/Tool.ts` and the `src/types/` directory define core data structures. Understand types first, then implementation.

---

## Next

- [Chapter 2: Six-Layer Architecture](../ch02-architecture/01-six-layer-architecture.md) — understand the overall design
- [Chapter 3: Deep Dive into `query.ts`](../ch03-core-engine/02-query-loop.md) — go straight into the core
