# 1.1 Beneath the Surface: Claude Code Is More Than a CLI

> **Chapter goal**: Build an overall understanding of Claude Code—what it is, what it can do, and how it is fundamentally different from a typical CLI tool.

---

## What You Think Claude Code Is

Most people, when they first see Claude Code, assume it is just a **command-line version of ChatGPT**: ask a question in the terminal, get an answer, and that is all.

```bash
$ claude "Help me write a Python quicksort"
```

That understanding is only 5% correct.

---

## What Claude Code Actually Is

The first thing you notice when opening the source code is that this assumption breaks down. `方案汇总.md` has a precise summary:

> On the surface, Claude Code is a CLI tool; in reality, it is a complete **AI Agent operating system**.

Let us unpack that sentence.

### It Is an Agent, Not a Chatbot

A normal chatbot workflow is: **input → output**

Claude Code's workflow is: **input → think → call tools → observe results → think again → call tools again → ... → output**

This "think-act-observe" loop is the **Agent loop** (the ReAct pattern). Claude Code can:

- Read your files (`FileReadTool`)
- Modify code (`FileEditTool`)
- Run shell commands (`BashTool`)
- Search the web (`WebSearchTool`)
- Open a browser (`WebBrowserTool`)
- Recursively launch sub-agents (`AgentTool`)

### It Has 1,987 Source Files

This is not just a number game. A "simple CLI tool" does not have nearly 2,000 files. This scale implies:

| Subsystem | Scale |
|--------|------|
| Tool system | 53 tools |
| Slash commands | 87 commands |
| UI components | 148 terminal components |
| Custom Hooks | 87 |
| Bridge remote control | 33 files |

### It Has a Hidden "Operating System Layer"

Claude Code also includes many systems that external users cannot see (trimmed by compile switches):

- **KAIROS**: a persistent assistant that keeps Claude running after you close the terminal
- **Coordinator**: turns one Claude into a commander that dispatches multiple Workers in parallel
- **Bridge**: remotely control your local CLI from claude.ai or mobile
- **BUDDY**: an AI virtual pet in the terminal

---

## What Happens in a Complete Request

Let us follow the full lifecycle of a typical request to feel the complexity:

```
You type: "Help me refactor this file to make it cleaner"
         │
         ▼
[1] main.tsx receives input and creates React state updates
         │
         ▼
[2] QueryEngine starts a new conversation turn
    - Builds the System Prompt (injects git status, CLAUDE.md content, tool descriptions)
    - Reads global config from bootstrap/state.ts
         │
         ▼
[3] query.ts starts the main loop
    - Formats messages and sends to Claude API (Anthropic / Bedrock / Vertex)
    - Receives streamed response
         │
         ▼
[4] Claude returns: "I need to read this file first"
    → Triggers FileReadTool
    → Permission check (canUseTool)
    → Executes read
    → Returns result to Claude
         │
         ▼
[5] Claude returns: "Now I'll modify it"
    → Triggers FileEditTool
    → Permission check (is it within allowed paths?)
    → Executes edit
    → Returns result to Claude
         │
         ▼
[6] Claude returns final text response
    - query.ts loop ends
    - Session history is persisted to disk
    - Cost tracking is updated
         │
         ▼
[7] Ink UI renders final output to terminal
```

This is what happens behind a "simple" file refactor request. If Coordinator mode is enabled, steps [4] and [5] may be distributed in parallel to multiple Workers.

---

## Understanding Claude Code in Three Dimensions

| Dimension | Description | Analogy |
|------|------|------|
| **Functional dimension** | What it can do | A very powerful programmer assistant |
| **Architectural dimension** | How it is organized | A layered Agent operating system |
| **Source-code dimension** | How it is implemented | A carefully engineered TypeScript project |

The six chapters of this tutorial expand these three dimensions from shallow to deep.

---

## Next

- Learn the tech stack → [1.2 Tech Stack and Runtime Environment](./02-tech-stack.md)
- Quickly understand source structure → [1.3 Codebase Map](./03-codebase-map.md)
- Jump straight to core principles → [Chapter 3: Core Engine](../ch03-core-engine/01-conversation-lifecycle.md)
