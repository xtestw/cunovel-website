# 4.3 Permission System: canUseTool Decision Chain

> **Chapter goal**: Understand how Claude Code decides whether Claude is allowed to execute a tool, and master the full permission decision flow.

---

## Permission system design goal

Claude Code must balance between two extremes:

- **too strict**: every operation requires confirmation → very low efficiency, poor UX
- **too loose**: Claude can run anything freely → high security risk

The goal is: **safe operations proceed automatically; risky operations require confirmation**.

---

## PermissionMode: permission modes

Top-level control is `PermissionMode`:

```typescript
type PermissionMode =
  | 'default'            // standard mode (read auto-approve, write needs confirmation)
  | 'acceptEdits'        // accept all edits (file writes auto-approve, Bash still asks)
  | 'bypassPermissions'  // bypass all permissions (--dangerously-skip-permissions)
  | 'plan'               // plan mode (Claude can analyze but not execute)
```

Stored in React AppState at `toolPermissionContext.mode`.

---

## Permission rules: three rule sets

```typescript
type ToolPermissionRulesBySource = {
  [source: string]: ToolPermissionRule[]  // source = 'settings' | 'cli' | 'user'
}

type ToolPermissionRule =
  | { type: 'bash_command_prefix'; value: string }  // allow/deny specific Bash prefixes
  | { type: 'mcp_tool'; serverName: string; toolName: string }
  | { type: 'tool'; toolName: string }
  | { type: 'file_path'; value: string }            // allow/deny specific file paths
```

Three rule categories in `toolPermissionContext`:

- **alwaysAllowRules**: direct allow on match, no confirmation
- **alwaysDenyRules**: direct reject on match (permanent blacklist)
- **alwaysAskRules**: always ask user on match

---

## CanUseToolFn: permission function signature

```typescript
type CanUseToolFn = (
  tool: Tool,
  input: unknown,
  toolUseContext: ToolUseContext,
  assistantMessage: AssistantMessage,
  toolUseID: string,
  forceDecision?: 'allow' | 'reject',
) => Promise<PermissionResult>

type PermissionResult = {
  behavior: 'allow' | 'ask' | 'reject'
  decisionReason?: string
  updater?: (prev: AppState) => AppState  // if user picks "always allow", this updates rules
}
```

---

## Decision chain (7 steps)

```
canUseTool(tool, input) called
        │
        ▼
1. forceDecision override?
   → if 'allow'/'reject' is passed, return directly
        │
        ▼
2. bypassPermissions mode?
   → yes: allow directly (--dangerously-skip-permissions)
        │
        ▼
3. plan mode?
   → yes: tool must be readonly to allow, otherwise ask
        │
        ▼
4. is tool.isReadOnly() = true?
   → yes: allow in most cases
   → exception: if matched by alwaysDenyRules, still reject
        │
        ▼
5. check alwaysDenyRules
   → match: reject, execution not allowed
        │
        ▼
6. check alwaysAllowRules
   → match: allow, skip confirmation
        │
        ▼
7. tool-specific checkPermissions()
   → BashTool: check command prefix against approved prefixes
   → FileEditTool: check path is inside allowed working dirs
   → AgentTool: check max nesting depth
        │
        ▼
   behavior = 'ask' → trigger UI permission popup → wait for user response
```

---

## Path permissions: additionalWorkingDirectories

By default, Claude Code only allows file operations inside current `cwd`. `additionalWorkingDirectories` expands allowed path scope:

```typescript
// In toolPermissionContext
additionalWorkingDirectories: Map<string, AdditionalWorkingDirectory>
```

Each `AdditionalWorkingDirectory` records:
- path
- `autoApproved: true` — no confirmation needed when added; disappears after restart
- `requiresConfirmation: true` — first use needs confirmation

**Actual check** (`src/utils/permissions/filesystem.ts`):

```typescript
export function isPathAllowed(
  filePath: string,
  cwd: string,
  additionalDirs: Map<string, AdditionalWorkingDirectory>,
): boolean {
  // 1. Check whether inside current cwd
  if (isSubPath(filePath, cwd)) return true
  
  // 2. Check whether inside additionalDirs
  for (const [dir] of additionalDirs) {
    if (isSubPath(filePath, dir)) return true
  }
  
  return false
}
```

---

## Permission popup: what user sees

When `behavior = 'ask'`, `PermissionRequest` shows:

```
╔═ Permission Request ═══════════════════╗
║                                        ║
║  Claude wants to run this command:     ║
║                                        ║
║  rm -rf dist/                          ║
║                                        ║
║  ❯ Allow once                          ║
║    Allow for this session              ║
║    Always allow (persist)              ║
║    Reject                              ║
║    Reject and send reason              ║
╚════════════════════════════════════════╝
```

Selection effects:
- **Allow once**: run this time, ask again next time
- **Allow for this session**: add to session-level `alwaysAllowRules` (not persisted)
- **Always allow**: write to `~/.claude/settings.json` `alwaysAllowRules` (persistent)
- **Reject**: returns `behavior: 'reject'`, Claude receives rejection reason
- **Reject and send reason**: show text box for user explanation

---

## Permission denial tracking

```typescript
// src/utils/permissions/denialTracking.ts
type DenialTrackingState = {
  denialCount: number
  lastDeniedAt: number | null
}
```

System tracks denial counts. When Claude is denied repeatedly, it enters a degraded mode that forces UI permission prompts instead of auto hook handling, preventing repeated unsupervised retries of denied actions.

---

## Next

- [4.4 MCP protocol: extension boundary of tools](./04-mcp-tools.md) — how external tools integrate
- [4.5 Tool concurrency and orchestration](./05-tool-orchestration.md) — parallel multi-tool execution
