# 6.6 Complete Environment Variable Reference

> Based on exhaustive `process.env.*` scan from source. 70+ environment variables, grouped by function.

---

## Usage

```bash
# one-shot
ANTHROPIC_MODEL=claude-opus-4-5 claude

# persistent shell config
echo 'export CLAUDE_CODE_DISABLE_THINKING=1' >> ~/.zshrc

# project-level .env
echo 'ANTHROPIC_BASE_URL=http://my-proxy.com' > .env
```

---

## 1) Core API config

| Env var | Description | Example |
|---------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |
| `ANTHROPIC_BASE_URL` | override API base URL (proxy/private deployment) | `https://my-proxy.com` |
| `ANTHROPIC_MODEL` | override default model | `claude-opus-4-5` |
| `CLAUDE_CODE_API_BASE_URL` | override Files API base URL | `https://api.anthropic.com` |

---

## 2) Model and reasoning controls

| Env var | Description | Default |
|---------|-------------|---------|
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | maximum output tokens | model limit |
| `CLAUDE_CODE_DISABLE_THINKING` | disable Extended Thinking | `false` |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` | disable adaptive thinking budget | `false` |
| `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK` | disable non-stream fallback | `false` |
| `MAX_THINKING_TOKENS` | max thinking tokens (ant-only) | none |
| `CLAUDE_CODE_DISABLE_FAST_MODE` | disable fast mode | `false` |

---

## 3) Functional mode switches

| Env var | Description |
|---------|-------------|
| `CLAUDE_CODE_PROACTIVE` | enable Proactive mode (`--proactive`) |
| `CLAUDE_CODE_COORDINATOR_MODE` | enable Coordinator mode |
| `CLAUDE_CODE_BRIEF` | enable Brief mode (KAIROS) |
| `CLAUDE_CODE_SIMPLE` | Simple Worker mode (Coordinator) |
| `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES` | emit tool-use summaries |
| `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION` | prompt suggestion toggle (`false` disables) |

---

## 4) Cloud provider integrations

| Env var | Description |
|---------|-------------|
| `CLAUDE_CODE_USE_BEDROCK` | use AWS Bedrock provider |
| `CLAUDE_CODE_SKIP_BEDROCK_AUTH` | skip Bedrock auth checks |
| `CLAUDE_CODE_USE_VERTEX` | use Google Vertex AI |
| `CLAUDE_CODE_SKIP_VERTEX_AUTH` | skip Vertex auth checks |
| `CLAUDE_CODE_USE_FOUNDRY` | use Foundry |
| `CLAUDE_CODE_SKIP_FOUNDRY_AUTH` | skip Foundry auth checks |
| `ANTHROPIC_FOUNDRY_API_KEY` | Foundry API key |

---

## 5) Context compaction controls

| Env var | Description | Default |
|---------|-------------|---------|
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | AutoCompact threshold override (%) | auto (~85%) |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | AutoCompact token window limit | model limit |
| `CLAUDE_NO_SESSION_PERSISTENCE` | disable session persistence | `false` |

---

## 6) API extension and metadata

| Env var | Description | Example |
|---------|-------------|---------|
| `CLAUDE_CODE_EXTRA_BODY` | append JSON fields to request body | `{"betas":["..."]}` |
| `CLAUDE_CODE_EXTRA_METADATA` | append request metadata JSON | `{"session_type":"dev"}` |
| `CLAUDE_CODE_ATTRIBUTION_HEADER` | attribution header content | arbitrary string |
| `CLAUDE_CODE_ADDITIONAL_PROTECTION` | enable additional safety headers | `true` |
| `CLAUDE_CODE_TAGS` | telemetry tags | `project=foo,env=dev` |
| `CLAUDE_AGENT_SDK_CLIENT_APP` | SDK client app identifier | arbitrary string |

---

## 7) Identity and authentication

| Env var | Description |
|---------|-------------|
| `CLAUDE_CODE_OAUTH_TOKEN` | provide OAuth access token directly |
| `CLAUDE_CODE_OAUTH_REFRESH_TOKEN` | OAuth refresh token |
| `CLAUDE_CODE_ACCOUNT_UUID` | force account UUID |
| `CLAUDE_CODE_ORGANIZATION_UUID` | force organization UUID |
| `CLAUDE_CODE_CUSTOM_OAUTH_URL` | custom OAuth server URL |

---

## 8) Performance and limits

| Env var | Description | Default |
|---------|-------------|---------|
| `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` | max concurrent tool executions | `10` |
| `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES` | idle timeout threshold | `75` |
| `CLAUDE_CODE_UNATTENDED_RETRY` | unattended auto-retry (`UNATTENDED_RETRY` gated) | `false` |

---

## 9) Memory and data

| Env var | Description |
|---------|-------------|
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | disable `EXTRACT_MEMORIES` auto memory extraction |
| `CLAUDE_CODE_CLIENT_CERT` | client TLS cert path (enterprise mTLS) |

---

## 10) UI and display

| Env var | Description | Example |
|---------|-------------|---------|
| `CLAUDE_CODE_SYNTAX_HIGHLIGHT` | terminal syntax theme | `Dracula` |
| `BAT_THEME` | fallback highlight theme (`bat`) | `Monokai Extended` |
| `CLAUDE_CODE_USE_POWERSHELL_TOOL` | use PowerShell tool (Windows) | `true/false` |

---

## 11) Telemetry and observability

| Env var | Description |
|---------|-------------|
| `CLAUDE_CODE_DATADOG_FLUSH_INTERVAL_MS` | DataDog flush interval (ms) |
| `CLAUDE_CODE_REMOTE` | mark remote runtime (adjust timeout profile) |
| `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE` | remote environment type |
| `CLAUDE_CODE_REMOTE_SESSION_ID` | remote session ID |
| `CLAUDE_CODE_CONTAINER_ID` | container ID |
| `CLAUDE_CODE_HOST_PLATFORM` | override host platform (`darwin`/`linux`/`win32`) |
| `CLAUDE_CODE_COWORKER_TYPE` | coworker type telemetry marker |
| `CLAUDE_CODE_ACTION` | mark as Claude Code Action run |
| `GITHUB_ACTIONS` | standard GitHub Actions marker |
| `CLAUBBIT` | internal Claubbit marker |

---

## 12) Runtime entrypoint and mode

| Env var | Description | Values |
|---------|-------------|--------|
| `CLAUDE_CODE_ENTRYPOINT` | runtime entrypoint marker | `cli` / `local-agent` / `sdk` |
| `CLAUDE_JOB_DIR` | job directory for stop-hook task classifier | path |

---

## 13) Sub-agent and multi-agent

| Env var | Description |
|---------|-------------|
| `CLAUDE_CODE_PARENT_SESSION_ID` | parent session ID for sub-agents |
| `CLAUDE_CODE_MESSAGING_SOCKET_PATH` | Unix Domain Socket path (`UDS_INBOX`) |

---

## 14) Internal-only (`USER_TYPE=ant`)

| Env var | Description |
|---------|-------------|
| `USER_TYPE` | user type (`external` in public build, `ant` internal) |
| `CLAUDE_INTERNAL_FC_OVERRIDES` | GrowthBook override JSON |
| `CLAUDE_CODE_GB_BASE_URL` | override GrowthBook API base URL |
| `ULTRAPLAN_PROMPT_FILE` | override Ultraplan prompt file path |
| `SESSION_INGRESS_URL` | override session ingress URL |
| `IS_DEMO` | demo mode marker |
| `CLAUBBIT` | internal Claubbit marker |

---

## 15) Standard third-party env vars consumed by Claude Code

| Env var | Description |
|---------|-------------|
| `ANTHROPIC_BASE_URL` | Anthropic SDK standard base URL |
| `NODE_ENV` | runtime environment |
| `HOME` / `USERPROFILE` | home directory resolution |
| `SHELL` | shell detection |
| `TERM` | terminal capability detection |

---

## Env vars vs CLI flags

Some env vars correspond to CLI flags:

| Env var | Equivalent CLI |
|---------|----------------|
| `CLAUDE_CODE_PROACTIVE=1` | `--proactive` |
| `CLAUDE_CODE_COORDINATOR_MODE=1` | no direct flag (env-only) |
| `CLAUDE_NO_SESSION_PERSISTENCE=1` | `--no-session-persistence` (where available) |
| `ANTHROPIC_MODEL=xxx` | `--model xxx` |
| `ANTHROPIC_BASE_URL=xxx` | `--base-url xxx` (selected contexts) |

---

## Common debugging combinations

```bash
# switch to Opus and disable thinking
ANTHROPIC_MODEL=claude-opus-4-5 CLAUDE_CODE_DISABLE_THINKING=1 claude

# use proxy + larger output budget
ANTHROPIC_BASE_URL=http://localhost:8080 CLAUDE_CODE_MAX_OUTPUT_TOKENS=8192 claude

# fully disable persistence (headless testing)
CLAUDE_NO_SESSION_PERSISTENCE=1 claude -p "hello"

# internal GB override
CLAUDE_INTERNAL_FC_OVERRIDES='{"tengu_kairos": true}' claude

# use AWS Bedrock
CLAUDE_CODE_USE_BEDROCK=1 ANTHROPIC_MODEL=us.anthropic.claude-opus-4-5-20251101-v1:0 claude
```

---

## Next

- [5.6 Hidden Command Reference](../ch05-advanced/06-hidden-commands.md) - slash command / CLI quick lookup
- [6.1 Three-Layer Gates](./01-three-layer-gates.md) - how `USER_TYPE` and GrowthBook cooperate with env vars
