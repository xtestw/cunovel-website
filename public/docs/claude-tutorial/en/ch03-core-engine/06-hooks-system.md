# 3.6 Hooks System: User Scripts Intervening in AI Decision Flow

> **Source location**: `src/utils/hooks/` (17 files)
> **Configuration**: `hooks` field in `settings.json` or `.claude/settings.json`

---

## One-sentence understanding

Hooks let you insert **your own scripts** into Claude's workflow — before/after tool execution, before Claude starts replying, when a session starts, and more.

```
User-script hooks ≈ OS hooks / browser extensions / framework middleware
```

---

## What Hooks can do

| Scenario | Hook event used |
|------|----------------|
| Block Claude from running dangerous bash commands | `PreToolUse` → exit code 2 |
| Log all file changes to audit log | `PostToolUse` |
| Filter sensitive words whenever user submits prompt | `UserPromptSubmit` |
| Send system notification when Claude finishes response | `Stop` |
| Inject project context at session start | `SessionStart` |
| Append custom summary instructions before `/compact` | `PreCompact` |
| Auto-monitor `.env` file changes | `FileChanged` |

---

## Full Hook event list (27 events)

### Tool-related

| Event | Trigger timing | Input | Effect of exit code 2 |
|------|---------|------|--------------|
| `PreToolUse` | before tool execution | JSON: tool args | **block tool execution**, pass error to Claude |
| `PostToolUse` | after tool execution | JSON: `{inputs, response}` | pass error to Claude immediately |
| `PostToolUseFailure` | when tool fails | JSON: `{tool_name, error, error_type, is_interrupt, is_timeout}` | pass error to Claude immediately |
| `PermissionDenied` | tool call denied by Auto-mode classifier | JSON: `{tool_name, tool_input, reason}` | returning `{"hookSpecificOutput":{"retry":true}}` lets Claude retry |
| `PermissionRequest` | when permission popup is shown | JSON: `{tool_name, tool_input, tool_use_id}` | can allow/deny via hookSpecificOutput |

### Conversation-related

| Event | Trigger timing | Effect of exit code 2 |
|------|---------|--------------|
| `UserPromptSubmit` | when user submits prompt | **block processing**, clear prompt, show error to user |
| `Stop` | before Claude finishes response | pass error to Claude, continue conversation |
| `StopFailure` | turn ends due to API error | ignored (fire-and-forget)|

### Session lifecycle

| Event | Trigger timing | `source` in input |
|------|---------|----------------|
| `SessionStart` | new session starts | `startup` / `resume` / `clear` / `compact` |
| `SessionEnd` | session ends | `clear` / `logout` / `prompt_input_exit` / `other` |

### Compaction-related

| Event | Effect of exit code 2 |
|------|--------------|
| `PreCompact` | **block compaction** (stdout appended as custom compaction instruction)|
| `PostCompact` | output shown to user |

### Subagent-related

| Event | Description |
|------|------|
| `SubagentStart` | AgentTool subagent starts (stdout passed to subagent)|
| `SubagentStop` | before subagent completes response (exit code 2 keeps subagent running)|

### Workspace and files

| Event | Description |
|------|------|
| `CwdChanged` | working directory changed (can update env vars via `CLAUDE_ENV_FILE`)|
| `FileChanged` | watched file changed (requires `watchPaths` returned via `CwdChanged`)|
| `WorktreeCreate` | request to create Worktree (stdout returns worktree path)|
| `WorktreeRemove` | request to remove Worktree |

### Multi-user collaboration (KAIROS only)

| Event | Description |
|------|------|
| `TeammateIdle` | teammate about to become idle (exit code 2 blocks idle state)|
| `TaskCreated` | task created (exit code 2 blocks creation)|
| `TaskCompleted` | task marked completed (exit code 2 blocks completion)|

### MCP-related

| Event | Description |
|------|------|
| `Elicitation` | MCP server requests user input (can auto-reply via hookSpecificOutput)|
| `ElicitationResult` | after user answers MCP request (can override user response)|

### Config and settings

| Event | Description |
|------|------|
| `Setup` | triggered by `init` or `maintenance`, for repo bootstrap/maintenance |
| `ConfigChange` | runtime config file changed (exit code 2 blocks config activation)|
| `InstructionsLoaded` | CLAUDE.md loaded (observation only, cannot block)|
| `Notification` | when notifications are sent (`permission_prompt` / `idle_prompt`, etc.)|

---

## Three Hook execution modes

### 1. Shell command (most common)

```json
// ~/.claude/settings.json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "jq -e '.command | test(\"^rm\")' && echo '禁止删除文件' >&2 && exit 2 || exit 0"
      }]
    }]
  }
}
```

### 2. HTTP Hook

```json
{
  "hooks": {
    "PostToolUse": [{
      "hooks": [{
        "type": "http",
        "url": "https://my-audit-server.com/hook",
        "method": "POST"
      }]
    }]
  }
}
```

### 3. Agent Hook (delegate handling to Claude)

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "agent",
        "prompt": "请检查刚刚完成的工作是否符合项目规范"
      }]
    }]
  }
}
```

---

## Exit code rules (general)

| Exit code | Effect |
|--------|------|
| 0 | success; stdout routed by event rules (to Claude for some events, to user for others)|
| **2** | **block/influence Claude**: stderr sent to model (or triggers special behavior)|
| others | stderr shown to user only, does not affect Claude |

Exit code 2 is "for Claude", while other non-zero codes are "for the user". This allows hooks to both inform users and control Claude behavior.

---

## Hook source (HookSource)

```typescript
type HookSource =
  | 'user_settings'      // ~/.claude/settings.json
  | 'project_settings'   // .claude/settings.json
  | 'local_settings'     // .claude/settings.local.json
  | 'policySettings'     // enterprise policy (read-only)
  | 'pluginHook'         // registered by MCP plugin
  | 'sessionHook'        // temporarily registered at runtime
  | 'builtinHook'        // built-in Claude Code hooks (compaction-related)
```

Priority: policy > project > local > user > session > builtin

---

## Matcher: fine-grained matching

Use `matcher` to trigger hooks only under specific conditions:

```json
// Intercept Bash tool only
{"matcher": "Bash", "hooks": [...]}

// Regex: intercept file-writing tools only
{"matcher": "^(str_replace|create_file|write_file)", "hooks": [...]}

// Match specific notification type
{"matcher": "permission_prompt", "hooks": [...]}
```

---

## AsyncHookRegistry: concurrency management

`AsyncHookRegistry.ts` manages concurrently running hook processes:

```typescript
// All hook event types can run multiple processes concurrently
// Used to track in-progress hooks (for UI progress display)
// Force-abort timed-out hooks (prevent hook from hanging the whole flow)
```

---

## ssrfGuard: security protection for HTTP Hooks

When HTTP hooks call external URLs, `ssrfGuard.ts` prevents SSRF (server-side request forgery):

```typescript
// Check whether URL points to private/internal addresses
// Reject 127.0.0.1, 169.254.x.x (cloud metadata), 10.x.x.x, etc.
// Prevent attacker from abusing hooks to access internal services through Claude
```

---

## Next

- [3.7 Query engine deep dive (continued)](./03-query-engine.md)
- [4.3 Permission system](../ch04-tools/03-permission-system.md) — interaction between Hooks and permissions
