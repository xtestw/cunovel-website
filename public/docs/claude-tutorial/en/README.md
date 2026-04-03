# Claude Code Source Deep-Dive Tutorial

> A structured learning path from zero to advanced, based on a source-map reconstruction of 1,987 TypeScript files from the `@anthropic-ai/claude-code` npm package.

---

## 📚 Tutorial Table of Contents

This tutorial has six main chapters, progressing along three dimensions:

```
Functionality dimension (what it can do)
    ↓
Architecture dimension (why it is designed this way)
    ↓
Source-code dimension (how it is implemented)
```

---

### 📖 Chapter 1: Global Overview — What is Claude Code?

**Best for**: beginners who want a complete mental model first

- [1.1 Beneath the Surface: It's More Than a CLI](./ch01-overview/01-what-is-claude-code.md)
- [1.2 Tech Stack and Runtime Environment](./ch01-overview/02-tech-stack.md)
- [1.3 Source Map: How to Navigate 1,987 Files](./ch01-overview/03-codebase-map.md)
- [1.4 Vim Mode: A Full Editor Inside the Terminal](./ch01-overview/04-vim-mode.md)

---

### 🏗️ Chapter 2: Architecture Design — System Structure and Layering

**Best for**: readers who understand usage and want system-level design insight

- [2.1 Six-Layer Architecture: From Terminal to AI](./ch02-architecture/01-six-layer-architecture.md)
- [2.2 The Three-Layer Feature Gate System](./ch02-architecture/02-feature-gates.md)
- [2.3 Global State Management: `bootstrap/state.ts` Deep Dive](./ch02-architecture/03-global-state.md)
- [2.4 UI Layer: How React + Ink Render in Terminal](./ch02-architecture/04-ink-tui.md)

---

### ⚙️ Chapter 3: Core Engine — The Agent Conversation Loop

**Best for**: readers who want to understand how AI agents "think and act"

- [3.1 Full Lifecycle of a Single Conversation](./ch03-core-engine/01-conversation-lifecycle.md)
- [3.2 `query.ts`: Main Loop Source Deep Read](./ch03-core-engine/02-query-loop.md)
- [3.3 QueryEngine: Session State Manager](./ch03-core-engine/03-query-engine.md)
- [3.4 How System Prompt Construction Works](./ch03-core-engine/04-system-prompt.md)
- [3.5 Context Compaction: How History Avoids Exploding](./ch03-core-engine/05-context-compact.md)
- [3.6 Hooks System: User Scripts in the AI Decision Flow](./ch03-core-engine/06-hooks-system.md)

---

### 🔧 Chapter 4: Tool System — Design Philosophy Behind 53 Tools

**Best for**: readers who want to understand how AI interacts with the real world

- [4.1 Tool Abstraction: What Is a Tool?](./ch04-tools/01-tool-abstraction.md)
- [4.2 Core Tool Deep Dive: Bash / FileEdit / Agent](./ch04-tools/02-core-tools.md)
- [4.3 Permission System: `canUseTool` Decision Chain](./ch04-tools/03-permission-system.md)
- [4.4 MCP Protocol: The Extensibility Boundary of Tools](./ch04-tools/04-mcp-tools.md)
- [4.5 Tool Concurrency and Orchestration](./ch04-tools/05-tool-orchestration.md)

---

### 🚀 Chapter 5: Advanced Topics — Hidden Features Deep Dive

**Best for**: readers curious about what Anthropic is building internally

- [5.1 KAIROS: The Never-Off Persistent AI Assistant](./ch05-advanced/01-kairos.md)
- [5.2 Coordinator: Multi-Agent Orchestration Mode](./ch05-advanced/02-coordinator.md)
- [5.3 Bridge: Remote Control of Local CLI from claude.ai](./ch05-advanced/03-bridge.md)
- [5.4 BUDDY: Deterministic Generation for an AI Desktop Pet](./ch05-advanced/04-buddy.md)
- [5.5 Voice & Proactive: Voice and Initiative Modes](./ch05-advanced/05-voice-proactive.md)
- [5.6 Hidden Command Reference: Slash Commands / CLI Flags / Env Vars](./ch05-advanced/06-hidden-commands.md)

---

### 🔒 Chapter 6: Engineering Practices — Release and Quality Control

**Best for**: readers focused on engineering management and production rollout

- [6.1 Three-Layer Gates: `feature()` / `USER_TYPE` / GrowthBook](./ch06-engineering/01-three-layer-gates.md)
- [6.2 Full Compile Flag Reference (50 Flags)](./ch06-engineering/02-feature-flags-reference.md)
- [6.3 Telemetry & Observability: OpenTelemetry in Practice](./ch06-engineering/03-telemetry.md)
- [6.4 Session Persistence and History](./ch06-engineering/04-session-persistence.md)
- [6.5 Services Layer Panorama: Responsibility Map of 26 Subservices](./ch06-engineering/05-services-overview.md)
- [6.6 Complete Environment Variable Reference (70+)](./ch06-engineering/06-env-vars-reference.md)

---

### 🎓 Chapter 7: Summary

- [Tutorial Summary: From User to Source-Level Researcher](./ch07-summary.md)

### 🧠 ClaudeCode Walkthrough (Added)

- [ClaudeCode Walkthrough: From Request to Tool Execution](./claude-code-walkthrough.md)

---

## 🗺️ Quick Navigation

| I want to understand... | Jump to |
|-------------------------|---------|
| What Claude Code is and what it can do | [Chapter 1](./ch01-overview/01-what-is-claude-code.md) |
| How to read the overall code structure | [1.3 Source Map](./ch01-overview/03-codebase-map.md) |
| Vim mode keybindings | [1.4 Vim Mode](./ch01-overview/04-vim-mode.md) |
| How the AI agent main loop works | [3.2 `query.ts` Deep Read](./ch03-core-engine/02-query-loop.md) |
| How to inject scripts into Claude's decisions | [3.6 Hooks System](./ch03-core-engine/06-hooks-system.md) |
| How tool permissions are decided | [4.3 Permission System](./ch04-tools/03-permission-system.md) |
| How KAIROS persistent assistant is implemented | [5.1 KAIROS](./ch05-advanced/01-kairos.md) |
| How multi-agent orchestration works | [5.2 Coordinator](./ch05-advanced/02-coordinator.md) |
| Hidden commands/flags/env vars quick lookup | [5.6 Hidden Command Reference](./ch05-advanced/06-hidden-commands.md) |
| How feature switches are controlled | [6.1 Three-Layer Gates](./ch06-engineering/01-three-layer-gates.md) |
| What services exist in services layer | [6.5 Services Overview](./ch06-engineering/05-services-overview.md) |
| What you can do after finishing this tutorial | [Tutorial Summary](./ch07-summary.md) |

---

## 📌 Notes

- This tutorial is based on reconstructed TypeScript source and is **for research/learning only**
- Source code copyright belongs to [Anthropic](https://www.anthropic.com)
- All quoted code references include file paths for side-by-side reading

---

> 💡 **Suggested reading order**: beginners should read chapter by chapter; experienced developers can jump directly to Chapter 3 (`query.ts`) or Chapter 5 (advanced topics); for quick lookup, use the Quick Navigation table.
