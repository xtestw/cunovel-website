# 5.6 Hidden Command Reference: Slash Commands / CLI Flags / Env Vars

> **Source location**: `src/commands.ts`, `src/commands/`, `src/main.tsx`  
> Claude Code contains many commands and parameters not listed in public docs. This page summarizes known hidden capabilities.

---

## I. Feature-gated slash commands (not visible in external builds)

These only appear when corresponding compile gates are enabled:

| Command | Compile gate | Description |
|---------|--------------|-------------|
| `/buddy` | `BUDDY` | desktop pet system (hatch/pet/stats) |
| `/buddy hatch` | `BUDDY` | hatch pet (AI generates name/personality) |
| `/buddy card` | `BUDDY` | show pet card and stats |
| `/buddy pet` | `BUDDY` | pet animation (2.5s hearts) |
| `/buddy mute` | `BUDDY` | mute pet |
| `/proactive` | `PROACTIVE` / `KAIROS` | toggle proactive mode |
| `/assistant` | `KAIROS` | persistent assistant controls |
| `/brief` | `KAIROS` / `KAIROS_BRIEF` | brief mode |
| `/bridge` | `BRIDGE_MODE` | remote bridge controls |
| `/remote-control` | `BRIDGE_MODE` | start embedded REPL bridge |
| `/voice` | `VOICE_MODE` | voice interaction controls |
| `/ultraplan` | `ULTRAPLAN` | cloud deep planning (up to 30 min) |
| `/fork` | `FORK_SUBAGENT` | sub-agent forking |
| `/peers` | `UDS_INBOX` | peer messaging via Unix Domain Socket |
| `/workflows` | `WORKFLOW_SCRIPTS` | workflow scripts |
| `/torch` | `TORCH` | Torch experimental feature |
| `/force-snip` | `HISTORY_SNIP` | force history snipping |
| `/remoteControlServer` | `DAEMON` + `BRIDGE_MODE` | remote-control server |
| `/web` | `CCR_REMOTE_SETUP` | Claude Code on Web setup |
| `/remote-setup` | `CCR_REMOTE_SETUP` | remote initialization |

---

## II. Internal-only commands (`USER_TYPE === 'ant'`)

Present in source but never shown externally:

| Command | Purpose |
|---------|---------|
| `/teleport` | teleport session between remote/local |
| `/bughunter` | internal bug-hunter tooling |
| `/mock-limits` | simulate rate limits |
| `/ctx_viz` | context visualization (token distribution) |
| `/break-cache` | inject random string to break prompt cache |
| `/ant-trace` | internal API tracing |
| `/good-claude` | positive feedback/internal eval tooling |
| `/agents-platform` | multi-agent platform management |
| `/autofix-pr` | auto-fix PR |
| `/debug-tool-call` | inspect tool-call details |
| `/reset-limits` | reset rate limits |
| `/backfill-sessions` | backfill historical sessions |
| `/commit-push-pr` | internal commit/push/PR one-shot workflow |
| `/perf-issue` | performance diagnostics |
| `/share` | share session link |
| `/summary` | summarize session |
| `/bridge-kick` | kick current bridge connection |
| `/subscribe-pr` | PR subscription (`KAIROS_GITHUB_WEBHOOKS`) |
| `/tags` | tag management |
| `/files` | project file list |
| `/env` | runtime env-var management |
| `/oauth-refresh` | manual OAuth refresh |
| `/onboarding` | onboarding/testing flow |
| `/init-verifiers` | initialize verifiers |

---

## III. External-visible but lesser-known commands

| Command | Purpose |
|---------|---------|
| `/stickers` | stickers/easter egg |
| `/thinkback` | thought replay |
| `/thinkback-play` | play thought replay |
| `/rewind` | rewind history/state |
| `/heapdump` | process heap dump (memory debugging) |
| `/sandbox-toggle` | toggle sandbox mode |
| `/chrome` | Chrome integration |
| `/advisor` | server-side advisor tool |
| `/btw` | quick side note without AI response |

---

## IV. Hidden CLI flags

Flags marked via `hideHelp()` (not shown in `--help`):

### Session and connection

| Flag | Purpose |
|------|---------|
| `--teleport [session]` | resume teleported session |
| `--remote [description]` | create remote session |
| `--sdk-url <url>` | WebSocket endpoint (used in `-p` mode) |
| `--parent-session-id <id>` | parent session ID (sub-agent use) |

### Multi-agent teamwork

| Flag | Purpose |
|------|---------|
| `--agent-id <id>` | teammate agent ID |
| `--agent-name <name>` | teammate display name |
| `--team-name <name>` | team name |
| `--agent-color <color>` | teammate UI color |
| `--agent-type <type>` | custom agent type |
| `--teammate-mode <mode>` | teammate generation mode |

### Planning and permissions

| Flag | Purpose |
|------|---------|
| `--plan-mode-required` | force plan mode first |
| `--advisor <model>` | server-side advisor tool |

### Feature-gated CLI flags

| Flag | Compile gate |
|------|--------------|
| `--proactive` | `PROACTIVE` / `KAIROS` |
| `--brief` | `KAIROS` / `KAIROS_BRIEF` |
| `--assistant` | `KAIROS` |
| `--channels <servers...>` | `KAIROS_CHANNELS` |
| `--remote-control [name]` / `--rc` | `BRIDGE_MODE` |
| `--hard-fail` | `HARD_FAIL` |
| `--enable-auto-mode` | `TRANSCRIPT_CLASSIFIER` |
| `--messaging-socket-path <path>` | `UDS_INBOX` |

### ant-only CLI flags

| Flag | Purpose |
|------|---------|
| `--delegate-permissions` | alias for `--permission-mode auto` |
| `--afk` | deprecated alias for auto mode |
| `--tasks [id]` | task mode |
| `--agent-teams` | multi-agent team mode |

---

## V. Hidden env var list

### Model and output control

| Env var | Purpose | Default |
|---------|---------|---------|
| `ANTHROPIC_MODEL` | override default model | claude-sonnet-... |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | max output tokens | model max |
| `CLAUDE_CODE_DISABLE_THINKING` | disable Extended Thinking | false |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` | disable adaptive thinking budget | false |
| `MAX_THINKING_TOKENS` | max thinking tokens (ant-only) | none |
| `CLAUDE_CODE_SYNTAX_HIGHLIGHT` | syntax highlight theme | terminal-driven |

### Mode controls

| Env var | Purpose |
|---------|---------|
| `CLAUDE_CODE_PROACTIVE` | enable proactive mode (`--proactive`) |
| `CLAUDE_CODE_COORDINATOR_MODE` | enable Coordinator mode |
| `CLAUDE_CODE_BRIEF` | enable brief mode |
| `CLAUDE_CODE_SIMPLE` | Simple Worker mode (Coordinator) |

### Performance and limits

| Env var | Purpose | Default |
|---------|---------|---------|
| `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` | max concurrent tool runs | 10 |
| `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES` | idle timeout threshold | 75 min |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | AutoCompact trigger threshold (%) | auto |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | AutoCompact token window | model max |

### Memory and data

| Env var | Purpose |
|---------|---------|
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | disable automatic memory extraction |
| `CLAUDE_NO_SESSION_PERSISTENCE` | disable session persistence |

### Cloud provider integrations

| Env var | Purpose |
|---------|---------|
| `CLAUDE_CODE_USE_BEDROCK` | use AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | use Google Vertex AI |
| `CLAUDE_CODE_USE_FOUNDRY` | use Foundry |
| `CLAUDE_CODE_SKIP_BEDROCK_AUTH` | skip Bedrock auth check |
| `CLAUDE_CODE_SKIP_VERTEX_AUTH` | skip Vertex auth check |

### API extensions

| Env var | Purpose |
|---------|---------|
| `CLAUDE_CODE_EXTRA_BODY` | append JSON body fields to API requests |
| `CLAUDE_CODE_EXTRA_METADATA` | append metadata to API requests |
| `CLAUDE_CODE_CLIENT_CERT` | client certificate path |
| `CLAUDE_CODE_ATTRIBUTION_HEADER` | attribution header |

### Identity and auth

| Env var | Purpose |
|---------|---------|
| `CLAUDE_CODE_OAUTH_TOKEN` | provide OAuth access token directly |
| `CLAUDE_CODE_OAUTH_REFRESH_TOKEN` | OAuth refresh token |
| `CLAUDE_CODE_ACCOUNT_UUID` | force account UUID |
| `CLAUDE_CODE_ORGANIZATION_UUID` | force organization UUID |
| `CLAUDE_CODE_CUSTOM_OAUTH_URL` | custom OAuth server URL |

### Internal-only

| Env var | Purpose |
|---------|---------|
| `CLAUDE_INTERNAL_FC_OVERRIDES` | GrowthBook overrides (JSON string) |
| `CLAUDE_CODE_GB_BASE_URL` | override GrowthBook API URL |
| `ULTRAPLAN_PROMPT_FILE` | override Ultraplan prompt file path |
| `SESSION_INGRESS_URL` | override session ingress URL |
| `IS_DEMO` | demo mode marker |

---

## Next

- [Chapter 6: Engineering Practices](../ch06-engineering/01-three-layer-gates.md) - how gate systems control these switches
