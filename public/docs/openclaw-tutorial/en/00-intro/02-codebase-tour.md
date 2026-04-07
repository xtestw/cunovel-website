# Codebase Navigation 🟢

> Before diving into source code, you need a map. This chapter gives you a complete overview of OpenClaw's directory structure so you can quickly find any piece of code.

## Learning Objectives

After reading this chapter, you'll be able to:
- Understand the purpose of each top-level directory
- Navigate the `src/` subdirectory structure (~30 modules)
- Find plugin code in `extensions/` (~90 plugins)
- Understand what's in `skills/` (~60 Skills)

---

## I. Top-Level Directory Structure

```
openclaw/
├── src/              ← Core runtime source code (~40K lines TypeScript)
├── extensions/       ← Official plugins (channel/provider/capability)
├── skills/           ← Built-in Skills (~60 directories)
├── packages/         ← Shared utility packages
├── ui/               ← Web UI (React)
├── scripts/          ← Build and maintenance scripts
├── docs/             ← Documentation
└── openclaw.mjs      ← CLI entry point
```

---

## II. `src/` Subdirectory Breakdown

This is the heart of OpenClaw:

### Core Control
| Directory | Role |
|-----------|------|
| `src/gateway/` | HTTP/WebSocket server, authentication, routing |
| `src/routing/` | Message-to-agent routing engine |
| `src/agents/` | Agent reasoning, Bootstrap, compaction |
| `src/plugins/` | Plugin discovery, loading, registry |

### Infrastructure
| Directory | Role |
|-----------|------|
| `src/config/` | Configuration loading, parsing, validation |
| `src/sessions/` | Session storage (SQLite-based) |
| `src/infra/` | Utilities (backoff, heartbeat, outbound) |
| `src/logging/` | Structured logging system |
| `src/security/` | Prompt injection protection, secret handling |

### Channels
| Directory | Role |
|-----------|------|
| `src/channels/` | Channel types, adapters, plugin interfaces |
| `src/auto-reply/` | Reply strategies (heartbeat, thinking, streaming) |

### Integration
| Directory | Role |
|-----------|------|
| `src/acp/` | Agent Coordination Protocol (multi-agent) |
| `src/tasks/` | Task registry and executor |
| `src/cron/` | Cron job types and normalization |
| `src/secrets/` | Secret reference resolution |

### SDK
| Directory | Role |
|-----------|------|
| `src/plugin-sdk/` | Public Plugin SDK (channel, provider, capability contracts) |
| `src/cli/` | CLI commands and argument parsing |

---

## III. `extensions/` Plugin Directory

90+ official plugins, organized by type:

### Channel Plugins (Platform Adapters)
```
extensions/telegram/          ← Telegram Bot
extensions/discord/           ← Discord Bot
extensions/slack/             ← Slack Bot
extensions/bluebubbles/       ← iMessage (via BlueBubbles)
extensions/signal/            ← Signal Messenger
extensions/matrix/            ← Matrix Protocol
extensions/msteams/           ← Microsoft Teams
extensions/email/             ← Email (SMTP/IMAP)
extensions/sms-twilio/        ← SMS (via Twilio)
extensions/line/              ← LINE
extensions/wechat/            ← WeChat
...
```

### LLM Provider Plugins
```
extensions/anthropic/         ← Anthropic Claude (default)
extensions/openai/            ← OpenAI GPT-4, o1
extensions/ollama/            ← Local Ollama models
extensions/google-gemini/     ← Google Gemini
extensions/mistral/           ← Mistral AI
extensions/groq/              ← Groq (fast inference)
extensions/amazon-bedrock/    ← AWS Bedrock
extensions/anthropic-vertex/  ← Claude on Google Vertex
...
```

### Capability Plugins
```
extensions/memory-core/       ← Local vector memory
extensions/mcporter/          ← MCP Server launcher
extensions/acpx/              ← ACP extensions
...
```

---

## IV. `skills/` Directory

~60 built-in Skills grouped by category:

```
skills/
├── coding-agent/             ← Programming assistant
├── github/                   ← Git/GitHub workflow
├── taskflow/                 ← Task flow management
├── summarize/                ← Summary generation
├── notion/                   ← Notion integration
├── obsidian/                 ← Obsidian notes
├── discord/                  ← Discord workflow
├── slack/                    ← Slack workflow
├── spotify-player/           ← Music playback control
├── weather/                  ← Weather queries
├── sag/                      ← Skill-as-Agent (create new Skills)
├── skill-creator/            ← Skill creation assistant
...
```

---

## V. Key Files Reference

| File | Size | Role |
|------|------|------|
| `openclaw.mjs` | Entry | CLI wrapper, version check, launch core |
| `src/entry.ts` | 11KB | Main entry point, `runCli()` |
| `VISION.md` | - | Design philosophy document |
| `CLAUDE.md` | - | Architecture boundary constraints |
| `src/plugin-sdk/core.ts` | 21KB | Plugin SDK public API entry |
| `src/plugin-sdk/entrypoints.ts` | - | All SDK entry points |
| `package.json` | - | Exports map (SDK entry point definitions) |

---

## Summary

1. **`src/` = Core runtime**: gateway, routing, agents, plugins — all key logic is here.
2. **`extensions/` = Capability library**: 90+ official plugins, organized by type.
3. **`skills/` = Instruction library**: 60 built-in Markdown Skills.
4. **Plugin SDK entry is `src/plugin-sdk/core.ts`**: all public APIs re-exported from here.

---

*[← What Is OpenClaw](01-what-is-openclaw.md) | [→ Running Locally: Startup Flow](03-running-locally.md)*
