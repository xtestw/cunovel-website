# 3.4 System Prompt Construction Mechanism

> **Chapter goal**: Understand how Claude Code dynamically constructs the System Prompt before each conversation turn, and what information is included.

---

## System Prompt is not static

Many people assume the System Prompt is fixed text. In Claude Code, however, it is **built dynamically in real time** at the start of each conversation and injected with real current environment state.

---

## fetchSystemPromptParts()

The entry point for System Prompt construction is `fetchSystemPromptParts()` in `src/utils/queryContext.ts`:

```typescript
export async function fetchSystemPromptParts({
  tools,
  mainLoopModel,
  additionalWorkingDirectories,
  mcpClients,
  customSystemPrompt,
}: FetchSystemPromptOptions): Promise<{
  defaultSystemPrompt: string[]  // core system prompt parts
  userContext: { [k: string]: string }  // key/value pairs injected into <user-context>
  systemContext: { [k: string]: string } // key/value pairs injected into <system-context>
}>
```

---

## Constructed parts

### 1. Core persona prompt

This is Claude's "base persona":
```
You are Claude Code, an AI assistant made by Anthropic, focused on software engineering tasks...
```

Includes:
- role definition
- capability description
- behavior guidelines (how to handle uncertainty)
- safety rules

### 2. Git status snapshot (`getGitStatus()`)

If current directory is a git repo, Claude Code injects:

```
This is the git status at the start of the conversation.

Current branch: feature/add-auth
Main branch (you will usually use this for PRs): main
Git user: xuwei
Status:
 M src/auth/login.ts
 M src/auth/session.ts
?? src/auth/oauth.ts

Recent commits:
abc1234 Add OAuth provider scaffold
def5678 Fix session expiry bug
```

This lets Claude know, from the beginning, which branch you are on and what uncommitted changes exist.

Note the source comment: `Note that this status is a snapshot in time, and will not update during the conversation.` — this is a **snapshot**, not live. For latest status, Claude must run `git status` via BashTool.

### 3. CLAUDE.md content

```typescript
// src/utils/claudemd.ts
export async function getClaudeMds(cwd: string): Promise<ClaudeMdFile[]>
```

Claude Code recursively searches `CLAUDE.md` from:
- `~/.claude/CLAUDE.md` (global user config)
- `<project>/CLAUDE.md` (project config)
- `<project>/<subdir>/CLAUDE.md` (subdirectory config, loaded on demand)

Contents are injected directly into the System Prompt. This is the main mechanism for user/team customization of Claude behavior.

### 4. Tool descriptions

Each tool's JSON Schema description is injected into the System Prompt so Claude knows available tools and parameter formats.

```typescript
// Tool description example (BashTool)
{
  name: 'Bash',
  description: 'Execute shell commands...',
  input_schema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The shell command to execute' },
      timeout: { type: 'number', description: 'Timeout in milliseconds' },
    },
    required: ['command']
  }
}
```

### 5. Memory files (MEMORY.md)

If memory feature is enabled (`EXTRACT_MEMORIES` compile switch), the system injects long-term memory:

```typescript
// src/memdir/memdir.ts
export async function loadMemoryPrompt(): Promise<string | null>
```

---

## userContext vs systemContext

These two contexts are injected at the end of System Prompt with different XML tags:

```
<user-context>
  今天是 2026年04月02日。
  当前工作目录：/Users/xuwei/projects/myapp
  [Coordinator 模式下：Workers 可用的工具列表...]
</user-context>

<system-context>
  [Coordinator 模式下的系统级指令...]
</system-context>
```

`userContext` contains dynamic information that may change on every call (date, CWD, config).

`systemContext` contains architecture-level system instructions (e.g., coordinator dispatch rules).

---

## System Prompt size limits

When building System Prompt, git status length is capped:

```typescript
const MAX_STATUS_CHARS = 2000

const truncatedStatus =
  status.length > MAX_STATUS_CHARS
    ? status.substring(0, MAX_STATUS_CHARS) +
      '\n... (truncated because it exceeds 2k characters. If you need more information, run "git status" using BashTool)'
    : status
```

If git status exceeds 2000 chars, it is truncated automatically and Claude is told how to fetch full information.

---

## Special injection in Coordinator mode

In Coordinator mode, `getCoordinatorUserContext()` additionally injects:

```typescript
// src/coordinator/coordinatorMode.ts
export function getCoordinatorUserContext(
  mcpClients: ReadonlyArray<{ name: string }>,
  scratchpadDir?: string,
): { [k: string]: string } {
  // Inject the list of tools available to Workers
  return { workerToolsContext: `Workers spawned via the Agent tool have access to these tools: ...` }
}
```

And `getCoordinatorSystemPrompt()` returns a full coordinator role definition (400+ lines), defining how to dispatch Workers, handle tasks, and forbidden behavior.

---

## Next

- [3.5 Context compaction: how conversation history avoids exploding](./05-context-compact.md)
- [Chapter 4: Tool system](../ch04-tools/01-tool-abstraction.md) — the design of 53 tools
