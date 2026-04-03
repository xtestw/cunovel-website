# 1.2 Tech Stack and Runtime Environment

> **Chapter goal**: Understand Claude Code's technology choices and the reasoning behind each decision.

---

## Runtime: Why Bun?

Claude Code runs on **Bun ≥ 1.3.5** (and is also compatible with Node.js ≥ 24).

```bash
bun install    # install dependencies
bun run dev    # start
```

Why choose Bun over Node.js:

| Feature | Advantage |
|------|------|
| **Native TypeScript execution** | Run `.ts` files directly without a compile step |
| **`bun:bundle` capability** | `feature()` compile-time switches are integrated directly into the bundler |
| **Faster startup** | Lower startup latency for CLI tools |
| **Built-in test runner** | Unified toolchain |

Most importantly, `import { feature } from 'bun:bundle'`—this API enables dead code elimination (DCE) at build time, so feature switches for different builds are fully isolated at the binary level.

---

## UI Layer: React + Ink

This is the most "counter-intuitive" choice in the whole stack: **using React to render UI in the terminal**.

```typescript
// src/components/some-component.tsx
import { Box, Text } from 'ink'
import React from 'react'

function StatusBar({ model, cost }: Props) {
  return (
    <Box borderStyle="round">
      <Text color="green">{model}</Text>
      <Text> ${cost.toFixed(4)}</Text>
    </Box>
  )
}
```

[Ink](https://github.com/vadimdemedes/ink) is a library that renders React in the terminal. Claude Code uses it to implement:

- **Real-time streaming output**: assistant responses are displayed as they are generated
- **Interactive permission dialogs**: keyboard up/down selection
- **Tool execution progress animations**: spinners, etc.
- **Responsive layouts**: automatic adjustment for narrow terminals

The source has 148 terminal UI components (`src/components/`) and 87 custom Hooks (`src/hooks/`), comparable in scale to a medium-sized web frontend project.

---

## AI Communication Layer: Multi-Cloud Support

```typescript
// Three AI backends, one unified interface
import '@anthropic-ai/sdk'              // direct Anthropic API calls
// or
process.env.CLAUDE_CODE_USE_BEDROCK     // AWS Bedrock
// or
process.env.CLAUDE_CODE_USE_VERTEX      // Google Cloud Vertex AI
```

This design allows enterprise users to deploy in their own cloud environments without routing traffic through Anthropic servers.

---

## Full Dependency Stack

### Core AI

| Library | Usage |
|----|------|
| `@anthropic-ai/sdk` | Anthropic API client |
| `@anthropic-ai/claude-agent-sdk` | Agent SDK (headless mode) |
| `@modelcontextprotocol/sdk` | MCP protocol support |

### Network Communication

| Library | Usage |
|----|------|
| `axios` | HTTP requests |
| `undici` | High-performance HTTP (built into Node.js) |
| `ws` | WebSocket (Bridge remote control) |
| Server-Sent Events | Streaming response reception |

### UI & Interaction

| Library | Usage |
|----|------|
| `ink` | Terminal React renderer |
| `react` | UI component framework |
| `fuse.js` | Fuzzy search (command autocomplete) |

### Filesystem & Processes

| Library | Usage |
|----|------|
| `chokidar` | File watching (hot reload) |
| `execa` | Process execution (replacement for child_process) |
| `tree-kill` | Process tree termination |

### Data Parsing

| Library | Usage |
|----|------|
| `yaml` | YAML config parsing |
| `jsonc-parser` | JSON-with-comments parsing |
| `zod` | Runtime type validation |

### Observability

| Library | Usage |
|----|------|
| `@opentelemetry/*` | Full OpenTelemetry instrumentation |

---

## Language: TypeScript + ESM

All source code uses **TypeScript** + **ES Modules (ESM)**:

```typescript
// Typical file header
import { feature } from 'bun:bundle'  // Bun-specific compile feature
import type { Tool } from './Tool.js'  // .js suffix (ESM spec)
import { randomUUID } from 'crypto'    // Node.js built-in
```

Important conventions:
- `.js` suffix in imports—required by the ESM spec even when the actual file is `.ts`
- `type` keyword—explicitly separates type imports from value imports, helping tree shaking
- `bun:bundle` special import—available only during Bun compilation

---

## Native Modules

```
shims/            # JS fallback implementations for native modules
vendor/           # native binding source (C++/Rust)
image-processor.node  # precompiled image-processing module
```

Claude Code includes a small number of native Node.js modules (`.node` files) for performance-sensitive scenarios such as image processing. The `shims/` directory provides cross-platform JavaScript fallback implementations.

---

## Next

- [1.3 Codebase Map: How to Navigate 1,987 Files](./03-codebase-map.md) — quickly build a structural mental model
- [Chapter 2: Architecture Design](../ch02-architecture/01-six-layer-architecture.md) — understand layered design
