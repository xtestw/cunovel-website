# 4.2 Core Tools Deep Dive: Bash / FileEdit / AgentTool

> **Chapter goal**: Analyze implementation logic of the three most critical tools and understand best practices in tool design.

---

## BashTool — secure wrapping of dangerous capability

**Location**: `src/tools/BashTool/BashTool.ts`

BashTool is the most powerful and most dangerous tool in Claude Code, allowing arbitrary shell command execution.

### Key design decision: no persistent shell

Each BashTool call runs in an isolated shell process. This means `cd /tmp` only affects the current call process; next call starts from the original directory again.

Claude Code uses global `setCwd()` / `getCwd()` in `src/utils/cwd.ts` to track a "virtual working directory":

```typescript
// Update virtual cwd when executing cd command
if (command.match(/^cd\s+(.+)/)) {
  const newDir = resolveDir(match[1], getCwd())
  setCwd(newDir)  // update global virtual cwd
}
```

Subsequent tool calls (including FileReadTool, etc.) all read current directory from `getCwd()` for consistency.

### Timeout and output control

```typescript
const DEFAULT_TIMEOUT_MS = 120_000  // default 2 minutes
const MAX_TIMEOUT_MS = 600_000      // max 10 minutes
const MAX_OUTPUT_BYTES = 1_000_000  // max 1MB output
const CONTENT_SNIP_THRESHOLD = 500_000

// Over 500KB: keep first 250KB + "...(truncated)..." + last 250KB
```

**Why keep both head and tail instead of only head?**

Because command output usually has two key info points:
- **Beginning**: whether command started correctly, any immediate errors
- **End**: whether execution succeeded, final state

Truncating the middle minimizes information loss.

### Output sanitization

```typescript
// Strip ANSI colors/control codes to avoid unexpected characters for Claude
const cleaned = stripAnsi(rawOutput)

// Detect and reject binary output
if (isBinary(rawOutput)) {
  return '(This command produced binary output which cannot be displayed.)'
}
```

---

## FileEditTool — the philosophy of precise edits

**Location**: `src/tools/FileEditTool/FileEditTool.ts` (tool name: `str_replace_based_edit`)

### Why not "write whole file"?

| Compare | FileWriteTool (full write) | FileEditTool (str-replace) |
|------|---------------------|---------------------|
| Output size | full file output | only changed snippets |
| token cost | high | low |
| risk of content loss | yes (unseen parts may be lost) | no (exact replacement) |
| best use case | create new file | modify existing file |

### str-replace mechanism

```typescript
// Claude call format
{
  "tool_use": {
    "name": "str_replace_based_edit",
    "input": {
      "path": "src/auth/login.ts",
      "old_string": "function login(user, pass) {\n  return check(user, pass)\n}",
      "new_string": "function login(user: string, pass: string): Promise<boolean> {\n  return checkAsync(user, pass)\n}"
    }
  }
}
```

Key implementation details:

```typescript
// Exact replacement, no fuzzy matching
const newContent = content.replace(old_string, new_string)

// If old_string not found, return error for Claude to retry
if (newContent === content) {
  throw new Error(`The provided old_string was not found in the file. 
  Check for whitespace, indentation, or line ending differences.`)
}
```

### FileEdit diff tracking

After each successful FileEdit, system updates `readFileState` (file state cache):

```typescript
// Track file modification history for:
// 1. Detecting concurrent modification conflicts
// 2. COMMIT_ATTRIBUTION: record which lines Claude changed in each git commit
toolUseContext.readFileState.set(path, { content: newContent, hash })
```

---

## AgentTool — recursive Claude

**Location**: `src/tools/AgentTool/AgentTool.ts`

AgentTool allows Claude to launch another Claude instance for sub-tasks, the foundation of Coordinator mode.

### Key parameters

```typescript
// Claude call format for AgentTool
{
  "name": "Task",
  "input": {
    "description": "实现用户认证模块",
    "prompt": "请实现一个 JWT 认证中间件...",
    "tools": ["Bash", "str_replace_based_edit", "FileRead"],  // optional, restrict sub-agent tools
    "model": undefined  // leave unset, use default
  }
}
```

Coordinator system prompt explicitly says:

> **Do not set the model parameter.** Workers need the default model for the substantive tasks you delegate.

### Separate subprocess vs in-process goroutine

AgentTool has two execution modes (gated by GrowthBook):

```
Mode A (default): same-process async
  sub-agent runs in parent process async context
  shares process memory, interruption passed via abort signal
  
Mode B (BG_SESSIONS switch): separate subprocess
  communicate via IPC messages
  parent crash does not kill child (persistent background tasks)
```

### Tool allowlist for agents

```typescript
// src/constants/tools.ts
export const ASYNC_AGENT_ALLOWED_TOOLS = new Set([
  'Bash',
  'str_replace_based_edit',
  'Read',
  'Write',
  'Glob',
  'Grep',
  'WebSearch',
  'WebFetch',
  'Task',       // sub-agent may spawn grandchild agent (with recursion depth limit)
  'TodoWrite',
  'Skill',
  // ...
])
```

**Coordinator-only internal tools** (not available outside coordinator):

```typescript
const INTERNAL_WORKER_TOOLS = new Set([
  'team_create',      // create worker team
  'team_delete',      // disband worker team
  'send_message',     // send message to specific worker
  'synthetic_output', // structured output (Agent SDK only)
])
```

### Recursive depth protection

```typescript
// src/tools/AgentTool/AgentTool.ts
const MAX_AGENT_DEPTH = 5  // prevent infinite recursion

// Pass current depth via ToolUseContext
const currentDepth = toolUseContext.queryTracking?.depth ?? 0
if (currentDepth >= MAX_AGENT_DEPTH) {
  throw new Error(`Maximum agent depth (${MAX_AGENT_DEPTH}) exceeded.`)
}
```

---

## Tool result size control

All tool return values are controlled by Tool Result Budget:

```typescript
// src/utils/toolResultStorage.ts
// controlled by feature('TOKEN_BUDGET')
const MAX_TOOL_RESULT_TOKENS = 25_000  // max tokens for one tool result

// When exceeded:
// 1. Store result to local filesystem
// 2. Replace full content with a reference in response
// 3. Read on demand later if needed
```

This prevents one huge file read from blowing up the whole context window.

---

## Next

- [4.3 Permission system: canUseTool decision chain](./03-permission-system.md) — full permission decision flow
- [4.4 MCP protocol: extension boundary of tools](./04-mcp-tools.md) — how MCP tools work
