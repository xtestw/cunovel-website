# Tutorial Summary: From User to Source-Level Researcher

> Congratulations on finishing this tutorial set. This page reviews what you learned and where to go deeper.

---

## What you have mastered

### Chapter 1: Global overview
- Claude Code is an **AI Agent-centric** terminal tool, not just "AI autocomplete"
- Tech stack: **Bun** (performance) + **React + Ink** (terminal UI) + **Anthropic SDK** (AI capabilities)
- 1,987 files are organized across 6 top-level responsibility domains
- Full built-in **Vim keybinding system** (NORMAL/INSERT, text objects, `.` repeat)

### Chapter 2: Architecture design
- **Six-layer architecture**: terminal -> tools -> agent -> persistence -> network -> planning
- **Three-layer feature gating**: compile-time `feature()` -> runtime `USER_TYPE` -> remote GrowthBook A/B
- **Global state**: `src/bootstrap/state.ts` is the single source of truth
- **Ink TUI**: React component tree rendered in terminal; `measureElement` solves dynamic layout

### Chapter 3: Core engine
- **Main loop** (`query.ts`): `while (hasToolUse) { call API -> run tools -> collect results }`
- **QueryEngine**: headless session manager used by both SDK and REPL
- **System Prompt**: dynamically assembled with a 4-part Prompt Cache strategy
- **Context compaction**: AutoCompact (85% threshold) / ReactiveCompact (API errors) / SnipCompact
- **Hooks system**: 27 event hooks to inject scripts into AI decision flow

### Chapter 4: Tool system
- **53 tools** managed through a unified `Tool` interface (`isReadOnly` / `checkPermissions` / `call`)
- **Permission decision chain** (7 steps): forceDecision -> bypassPermissions -> planMode -> readOnly -> denyRules -> allowRules -> checkPermissions
- **MCP protocol**: external tools can connect via stdio/SSE/HTTP and become proxy tools
- **Concurrency orchestration**: multi-tool parallelism, serialized permission dialogs, unified `AbortSignal`

### Chapter 5: Hidden capabilities
- **KAIROS**: persistent assistant, Dream memory consolidation (every 24h, 4 stages), permanent cron tasks
- **Coordinator**: multi-agent orchestration where commander does orchestration, workers are fully self-contained
- **Bridge**: two protocol generations for remote control from claude.ai, with `BoundedUUIDSet` dedupe
- **BUDDY**: deterministic personal pet via FNV-1a hash + Mulberry32 PRNG
- **Voice**: streaming STT + VAD + keyword boosting for terminal-native voice assistant
- **26+ hidden slash commands**, 50+ hidden env vars, and many hidden CLI parameters

### Chapter 6: Engineering practices
- Three-layer gates cooperate so features activate only when all checks pass
- GrowthBook kill switches are Anthropic's emergency control plane
- Full OpenTelemetry stack (Metrics + Traces + Logs)
- Session history uses append-only JSONL for atomic crash-safe persistence
- **Services layer**: 26 subservices connect the engine and external systems

---

## Core architecture diagram (compact)

```
User input (keyboard / voice / Bridge)
         │
    Ink TUI layer (React components)
         │
    query.ts main loop
         │
    ┌────┴────────────────────┐
    │  Anthropic API          │
    │  (claude.ts, 122KB)     │
    └────┬────────────────────┘
         │
    Tool dispatch layer
         │
    ┌────┴──────────────────────────────────────────────────┐
    │  BashTool │ FileEditTool │ AgentTool │ MCPTool │ ... │
    └───────────────────────────────────────────────────────┘
         │
    Hooks system (intercept any stage)
         │
    sessionStorage (JSONL persistence)
         │
    Services layer (compact/analytics/lsp/mcp/...)
```

---

## Suggested deep-dive paths

### Path A: AI Agent architecture

1. Read `src/query.ts` (main loop, ~820 lines)
2. Understand `src/tools/AgentTool/AgentTool.ts` (recursive sub-agent execution)
3. Study `src/coordinator/coordinatorMode.ts` (multi-agent orchestration)
4. Compare with AutoGPT / LangGraph / CrewAI

### Path B: terminal UI engineering

1. Read core components under `src/components/` (REPL/PermissionRequest/InputBox)
2. Understand pure-function state machine design in `src/vim/`
3. Study how Ink renders React in terminal
4. Compare with `tui-rs` (Rust) and `bubbletea` (Go)

### Path C: feature release engineering

1. Study `src/services/analytics/growthbook.ts` (full GrowthBook SDK configuration)
2. Understand `src/services/api/withRetry.ts` (multi-layer backoff strategy)
3. Study telemetry event types in `metadata.ts` (31KB, 100+ event types)
4. Compare with LaunchDarkly / Statsig

### Path D: AI safety engineering

1. Study permission system under `src/utils/permissions/`
2. Understand `src/utils/hooks/ssrfGuard.ts` (SSRF protection)
3. Study BASH_CLASSIFIER (command safety classifier for Auto mode)
4. Extend to prompt injection attack/defense patterns

---

## Most valuable docs to reread

| Doc | Why it matters |
|-----|----------------|
| `ch03-core-engine/02-query-loop.md` | explains how Claude "thinks" operationally |
| `ch04-tools/03-permission-system.md` | core of the safety model |
| `ch05-advanced/01-kairos.md` | full blueprint of persistent AI |
| `ch05-advanced/02-coordinator.md` | multi-agent system design principles |
| `ch06-engineering/01-three-layer-gates.md` | top-tier release engineering model |

---

## One-sentence conclusion

> Claude Code is an **AI Agent operating system**: React+Ink render the terminal UI, `query.ts` drives 53 tools, three-layer gates control 50+ capabilities, and the full internal shape is significantly richer than the external build.
