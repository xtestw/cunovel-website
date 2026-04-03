# 5.2 Coordinator: Multi-Agent Orchestration Mode

> **Source location**: `src/coordinator/coordinatorMode.ts` (370 lines)  
> **Compile gate**: `feature('COORDINATOR_MODE')`  
> **Env var**: `CLAUDE_CODE_COORDINATOR_MODE`

---

## One-line understanding

Coordinator mode turns one Claude into a "commander" that distributes work to multiple Worker Claudes in parallel.

```
Normal mode:
  User -> Claude -> does all work directly

Coordinator mode:
  User -> Coordinator Claude (planning + orchestration only)
               ├── Worker 1 (parallel: repository research)
               ├── Worker 2 (parallel: implement module A)
               └── Worker 3 (parallel: implement module B)
```

---

## Role split

| Role | Responsibility | Tools |
|------|----------------|-------|
| **Coordinator** | understand goals, break tasks down, synthesize results, communicate with user | Agent (dispatch), SendMessage (follow-up), TaskStop (terminate) |
| **Worker** | concrete code operations (read/write files, run commands) | full toolset (BashTool, FileEditTool, etc.) |

**Coordinator never edits code directly** - it is a pure commander.

---

## Activation

```typescript
// src/coordinator/coordinatorMode.ts
export function isCoordinatorMode(): boolean {
  if (feature('COORDINATOR_MODE')) {
    return isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE)
  }
  return false
}
```

Startup:

```bash
CLAUDE_CODE_COORDINATOR_MODE=1 claude
```

---

## Core rules in Coordinator System Prompt

`getCoordinatorSystemPrompt()` returns ~400 lines of system guidance. These are hard rules:

### 1) No lazy delegation

```
DO NOT: delegate research without giving the worker full context
DO NOT: write "based on your findings" — you must synthesize first, THEN instruct
DO: tell workers exactly which files to change, at which lines, doing what
```

Most important rule: Coordinator must first synthesize Worker findings, **then** issue precise implementation instructions.

### 2) Workers cannot know each other

```
Workers cannot see the Coordinator's conversation.
Each prompt must be fully self-contained.
```

Each Worker prompt must include all required context.

### 3) Never predict Worker results

```
After launching agents, briefly tell the user what you launched and end your response.
Never fabricate or predict agent results in any format.
Results arrive as separate messages.
```

---

## Worker result transport

When a Worker finishes, its result is injected into Coordinator conversation flow as XML:

```xml
<task-notification>
  <task-id>{agentId}</task-id>
  <status>completed</status>
  <summary>One-line worker status</summary>
  <result>Full final worker response text</result>
  <usage>
    <total_tokens>15420</total_tokens>
  </usage>
</task-notification>
```

These messages are not user-visible; only Coordinator receives them for synthesis.

---

## Standard workflow (four stages)

```
Stage 1: Research
  └── multiple Workers in parallel
  └── inspect codebase, locate files, understand the issue

Stage 2: Synthesis
  └── Coordinator only
  └── read findings and write precise implementation spec

Stage 3: Implementation
  └── multiple Workers (partitioned by files/areas)
  └── apply exact code edits from the spec

Stage 4: Verification
  └── Worker
  └── run tests and validate correctness
```

---

## Continue vs Spawn

Coordinator chooses whether to continue an existing Worker (`SendMessage`) or spawn a new one (`Agent`):

| Scenario | Recommendation | Why |
|----------|----------------|-----|
| researched files are the same files to edit | `SendMessage` continue | avoid reloading context |
| broad research, narrow implementation scope | `Agent` new | avoid anchoring on irrelevant findings |
| fixing a failed run or extending recent work | `SendMessage` continue | leverage existing context |
| verifying code written by another Worker | `Agent` new | keep independent perspective |
| first approach was fundamentally wrong | `Agent` new | avoid anchoring bias |

---

## Scratchpad: cross-worker shared knowledge

When GrowthBook `tengu_scratch` is enabled, Coordinator can tell Workers about a shared directory:

```typescript
// src/coordinator/coordinatorMode.ts
if (scratchpadDir && isScratchpadGateEnabled()) {
  content += `\n\nScratchpad directory: ${scratchpadDir}\n` +
    `Workers can read and write here without permission prompts.` +
    `Use this for durable cross-worker knowledge.`
}
```

Workers can freely read/write there for durable coordination (e.g., Research Worker writes notes, Implementation Worker reads them).

---

## Simple mode

```bash
CLAUDE_CODE_SIMPLE=1 CLAUDE_CODE_COORDINATOR_MODE=1 claude
```

In Simple mode, Worker tools are heavily reduced:

```typescript
const workerTools = isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)
  ? [BASH_TOOL_NAME, FILE_READ_TOOL_NAME, FILE_EDIT_TOOL_NAME]  // 3 tools
  : Array.from(ASYNC_AGENT_ALLOWED_TOOLS)  // full toolset
```

---

## Session resume: mode alignment

When resuming a historical Coordinator session, `matchSessionMode()` keeps mode consistent:

```typescript
// if historical session is coordinator mode but current env is not,
// flip env var back to coordinator mode automatically
if (sessionIsCoordinator && !currentIsCoordinator) {
  process.env.CLAUDE_CODE_COORDINATOR_MODE = '1'
}
```

---

## Next

- [5.3 Bridge: Remote Control](./03-bridge.md) - Remote control local CLI from claude.ai
- [5.4 BUDDY: AI Desktop Pet](./04-buddy.md) - deterministic generation algorithm
