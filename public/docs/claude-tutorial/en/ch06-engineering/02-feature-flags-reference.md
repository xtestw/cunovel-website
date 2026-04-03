# 6.2 Full Compile-Flag Reference (50 `feature()` flags)

> Derived from all `feature('...')` calls in source code, with descriptions and scope.

---

## Core feature gates (not enabled externally)

| Flag | Description | Related source |
|------|-------------|----------------|
| `BUDDY` | AI desktop pet system (18 species) | `src/buddy/` |
| `KAIROS` | persistent assistant mode | `src/assistant/` |
| `KAIROS_BRIEF` | KAIROS brief mode | `src/assistant/` |
| `KAIROS_CHANNELS` | KAIROS channel notifications | `src/assistant/` |
| `KAIROS_GITHUB_WEBHOOKS` | KAIROS GitHub webhook integration | `src/tools/SubscribePRTool/` |
| `KAIROS_PUSH_NOTIFICATION` | KAIROS push notifications | `src/tools/PushNotificationTool/` |
| `ULTRAPLAN` | cloud deep planning (up to 30 min) | `src/commands/ultraplan.tsx` |
| `COORDINATOR_MODE` | multi-agent orchestration mode | `src/coordinator/` |
| `BRIDGE_MODE` | remote control bridge (claude.ai -> local CLI) | `src/bridge/` |
| `VOICE_MODE` | voice interaction (STT + TTS) | `src/services/voice.ts` |
| `PROACTIVE` | initiative mode (autonomous when idle) | `src/proactive/` |
| `FORK_SUBAGENT` | sub-agent forking mode | `src/tools/AgentTool/` |
| `DAEMON` | daemon runtime mode | `src/bridge/` |

---

## Infrastructure gates

| Flag | Description |
|------|-------------|
| `UDS_INBOX` | Unix Domain Socket inbox (IPC) |
| `WORKFLOW_SCRIPTS` | workflow script system |
| `TORCH` | Torch experimental capability |
| `MONITOR_TOOL` | MonitorTool availability |
| `HISTORY_SNIP` | history snipping (SnipCompact) |
| `BG_SESSIONS` | background session management (separate subprocess agent) |
| `HARD_FAIL` | hard-fail testing mode |
| `CCR_REMOTE_SETUP` | web remote setup flow |
| `CHICAGO_MCP` | internal MCP extension server |
| `AGENT_TRIGGERS` | cron trigger tools |
| `AGENT_TRIGGERS_REMOTE` | remote trigger tools |

---

## Context optimization gates

| Flag | Description |
|------|-------------|
| `CACHED_MICROCOMPACT` | cached micro-compact (Prompt Cache-assisted) |
| `CONTEXT_COLLAPSE` | collapse tool-result context |
| `REACTIVE_COMPACT` | compact immediately on `prompt_too_long` |
| `QUICK_SEARCH` | quick search capability |
| `TOKEN_BUDGET` | token budget tracking + forced stop |
| `STREAMLINED_OUTPUT` | streamlined output format |
| `CONNECTOR_TEXT` | connector text block support |

---

## Security and compliance gates

| Flag | Description |
|------|-------------|
| `ANTI_DISTILLATION_CC` | anti-distillation protections |
| `BASH_CLASSIFIER` | bash command safety classifier |
| `NATIVE_CLIENT_ATTESTATION` | native client attestation |
| `TRANSCRIPT_CLASSIFIER` | transcript classifier for auto mode safety |
| `UNATTENDED_RETRY` | unattended automatic retry |

---

## Data and telemetry gates

| Flag | Description |
|------|-------------|
| `EXTRACT_MEMORIES` | auto extract long-term memories from chat |
| `MEMORY_SHAPE_TELEMETRY` | memory-shape telemetry |
| `COWORKER_TYPE_TELEMETRY` | coworker type telemetry |
| `SLOW_OPERATION_LOGGING` | slow operation performance logs |
| `PROMPT_CACHE_BREAK_DETECTION` | prompt-cache break detection |
| `COMMIT_ATTRIBUTION` | Claude line-attribution in git commits |

---

## UI and interaction gates

| Flag | Description |
|------|-------------|
| `TERMINAL_PANEL` | terminal panel component |
| `MESSAGE_ACTIONS` | message action buttons (copy/edit/etc.) |
| `BREAK_CACHE_COMMAND` | `/break-cache` command |

---

## Experimental gates

| Flag | Description |
|------|-------------|
| `LODESTONE` | Lodestone experimental capability |
| `MCP_SKILLS` | MCP-based skills |
| `EXPERIMENTAL_SKILL_SEARCH` | experimental skill search |
| `TEMPLATES` | templates/task classifier |
| `TEAMMEM` | team memory synchronization |

---

## User-setting sync gates

| Flag | Description |
|------|-------------|
| `FILE_PERSISTENCE` | remote file persistence |
| `DOWNLOAD_USER_SETTINGS` | download user settings from server |
| `UPLOAD_USER_SETTINGS` | upload user settings to server |

---

## Platform detection gates (compile-injected)

| Flag | Description |
|------|-------------|
| `IS_LIBC_GLIBC` | running on glibc Linux |
| `IS_LIBC_MUSL` | running on musl Linux (e.g., Alpine) |

---

## How to see all features in dev mode

In dev mode (`bun run dev`), all `feature()` calls default to `true`:

```bash
# start in dev mode to expose all feature branches
bun run dev

# add USER_TYPE=ant to unlock internal-only runtime branches
USER_TYPE=ant bun run dev
```

> Note: some features still require GrowthBook gates or config settings. `USER_TYPE=ant` alone does not force-enable everything.

---

## Next

- [6.3 Telemetry & Observability](./03-telemetry.md) - OpenTelemetry practices
- [6.4 Session Persistence](./04-session-persistence.md) - how history is stored
