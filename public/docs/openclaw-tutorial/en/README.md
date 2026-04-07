# OpenClaw Source Code Analysis Textbook

> A comprehensive deep-dive into the OpenClaw open-source AI assistant framework — from core concepts to advanced internals, structured for engineers at every level.

---

## Recommended Reading Paths

| Reader Type | Recommended Path |
|-------------|-----------------|
| 🆕 **Complete Beginner** | All of Getting Started → Architecture 01-02 → Application 01 |
| 💻 **Experienced Engineer** | All of Architecture → All of Data Flow → All of Mechanisms |
| 🤖 **AI App Developer** | Getting Started → All of Application → Extension 03 |
| 🔧 **Open Source Contributor** | Getting Started 02-03 → Architecture 04 → All of Extension |

---

## Table of Contents

### 🟢 Getting Started — Understanding OpenClaw

| Chapter | Title | Difficulty |
|---------|-------|------------|
| [00-01](00-intro/01-what-is-openclaw.md) | What Is OpenClaw? | 🟢 Beginner |
| [00-02](00-intro/02-codebase-tour.md) | Codebase Tour | 🟢 Beginner |
| [00-03](00-intro/03-running-locally.md) | Running Locally: Startup Flow & Entry Tracing | 🟡 Intermediate |

### 🏗️ Architecture — System Design Overview

| Chapter | Title | Difficulty |
|---------|-------|------------|
| [01-01](01-architecture/01-system-layers.md) | System Architecture Layers | 🟡 Intermediate |
| [01-02](01-architecture/02-gateway-core.md) | Gateway Core | 🟡 Intermediate |
| [01-03](01-architecture/03-plugin-system.md) | Plugin System | 🟡 Intermediate |
| [01-04](01-architecture/04-module-boundaries.md) | Module Boundaries & SDK Contract | 🔴 Advanced |

### 🔄 Data Flow — Tracing the Message Path

| Chapter | Title | Difficulty |
|---------|-------|------------|
| [02-01](02-flow/01-message-lifecycle.md) | Message Lifecycle | 🟡 Intermediate |
| [02-02](02-flow/02-routing-engine.md) | Routing Engine | 🟡 Intermediate |
| [02-03](02-flow/03-agent-call-loop.md) | Agent Call Loop | 🔴 Advanced |

### ⚙️ Mechanisms — Deep Dives

| Chapter | Title | Difficulty |
|---------|-------|------------|
| [03-01](03-mechanisms/01-plugin-sdk-design.md) | Plugin SDK Design | 🔴 Advanced |
| [03-02](03-mechanisms/02-auth-system.md) | Authentication System | 🔴 Advanced |
| [03-03](03-mechanisms/03-channel-integration.md) | Channel Integration Patterns | 🟡 Intermediate |
| [03-04](03-mechanisms/04-memory-mcp.md) | Memory & MCP | 🔴 Advanced |
| [03-05](03-mechanisms/05-security-model.md) | Security Model | 🔴 Advanced |

### 🚀 Application — Skills & Multi-Agent Collaboration

| Chapter | Title | Difficulty |
|---------|-------|------------|
| [04-01](04-application/01-skill-system.md) | Skill System | 🟢 Beginner |
| [04-02](04-application/02-skill-deep-dive.md) | Writing High-Quality Skills | 🟡 Intermediate |
| [04-03](04-application/03-multi-agent.md) | Multi-Agent Collaboration (ACP) | 🔴 Advanced |
| [04-04](04-application/04-agent-scope-context.md) | Agent Scope & Context Management | 🔴 Advanced |
| [04-05](04-application/05-automation-cron.md) | Automation & Scheduled Tasks | 🟡 Intermediate |

### 🛠️ Extension — Building on OpenClaw

| Chapter | Title | Difficulty |
|---------|-------|------------|
| [05-01](05-extension/01-write-channel-plugin.md) | Tutorial: Write a Channel Plugin | 🟡 Intermediate |
| [05-02](05-extension/02-integrate-llm-provider.md) | Tutorial: Integrate a New LLM Provider | 🔴 Advanced |
| [05-03](05-extension/03-create-skill.md) | Tutorial: Create a Skill | 🟢 Beginner |

---

## Key Concepts Glossary

| Term | One-line Definition |
|------|---------------------|
| **Gateway** | The control plane — receives channel messages, routes to agents, manages auth and config |
| **Channel** | A messaging platform adapter (Telegram/Discord/Slack etc.) for inbound/outbound message conversion |
| **Agent** | The AI reasoning engine — calls LLMs, uses tools, memory, and skills to complete tasks |
| **Plugin** | A code-based extension: Channel Plugin, Provider Plugin, or Capability Plugin |
| **Skill** | A Markdown instruction file — not code; tells the Agent how to perform specific workflows |
| **Provider** | An LLM service adapter (OpenAI/Anthropic/Ollama etc.) handling model calls and auth |

---

## Difficulty Legend

- 🟢 **Beginner**: Accessible to all readers, no prior programming experience needed
- 🟡 **Intermediate**: Requires familiarity with TypeScript and Node.js
- 🔴 **Advanced**: Requires experience with systems design and software architecture

---

*[← Back to bilingual index](../README.md) | [中文版 →](../zh/README.md)*
