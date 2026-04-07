# Module Boundaries & SDK Contract 🔴

> OpenClaw uses explicit module boundaries to prevent architectural decay. This chapter explains the SDK contract, API baseline mechanism, and how boundaries are enforced.

## Learning Objectives

After reading this chapter, you'll be able to:
- List all Plugin SDK entry points (20+)
- Understand the API Baseline mechanism (snapshot + CI diff)
- Explain why `core.ts` is a 21KB re-export file
- Understand the `sdk-alias` as a technical enforcement mechanism

---

## I. Why Module Boundaries Matter

In large codebases, without explicit boundaries, "architectural decay" happens: plugins start importing internal core modules directly, creating tight coupling. This makes refactoring core nearly impossible.

OpenClaw's solution: **The Plugin SDK is the only public interface**. Plugins must only import from `openclaw/plugin-sdk/*` — never from `src/` directly.

---

## II. Plugin SDK Entry Points

`src/plugin-sdk/entrypoints.ts` lists all 20+ public entry points:

```typescript
// Key entry points (simplified)
export const SDK_ENTRYPOINTS = [
  'openclaw/plugin-sdk/core',              // Main entry (re-exports everything)
  'openclaw/plugin-sdk/channel-contract',  // Channel adapter types
  'openclaw/plugin-sdk/provider-entry',    // defineSingleProviderPlugin factory
  'openclaw/plugin-sdk/plugin-entry',      // definePlugin factory
  'openclaw/plugin-sdk/inbound-envelope',  // InboundEnvelope builder
  'openclaw/plugin-sdk/runtime',           // PluginRuntime types
  'openclaw/plugin-sdk/tool-contract',     // Tool definition types
  // ... 15+ more
];
```

### `core.ts` is a 21KB Re-Export File

`src/plugin-sdk/core.ts` doesn't contain logic — it's a single file that re-exports everything from all other entry points:

```typescript
// src/plugin-sdk/core.ts (simplified)
export * from './channel-contract.js';
export * from './provider-entry.js';
export * from './plugin-entry.js';
export * from './inbound-envelope.js';
// ... 20+ more exports
```

Why? Convenience. Plugin developers can import everything from one place:
```typescript
import { definePlugin, ChannelPlugin, InboundEnvelope } from 'openclaw/plugin-sdk/core';
```

---

## III. API Baseline: Preventing Breaking Changes

`src/plugin-sdk/api-baseline.ts` (495 lines) implements a snapshot-and-diff CI mechanism:

```
Dev makes changes to SDK
  → npm run check:api-baseline
  → Snapshot current public API surface
  → Diff against committed baseline.json
  → If any PUBLIC signatures changed → CI FAILS
  → Developer must explicitly update baseline (with reason)
```

This forces breaking changes to be intentional and documented — preventing accidental API breakage that would break plugins.

---

## IV. `sdk-alias` as Technical Enforcement

The `sdk-alias` mechanism (used in `jiti` plugin loading) is the **technical enforcement** of module boundaries:

When a plugin code does:
```typescript
import { definePlugin } from 'openclaw/plugin-sdk/core';
```

`jiti` intercepts this and resolves it to the actual core runtime file. If a plugin tries to do:
```typescript
import { something } from '../../src/gateway/internals';  // WRONG
```

This would fail at runtime (path doesn't exist from plugin's perspective) and fail in TypeScript compilation (not in types).

---

## V. Boundary Rules Summary

| Layer | Can Import From | Cannot Import From |
|-------|----------------|-------------------|
| Plugin | `openclaw/plugin-sdk/*` | `src/*` directly |
| `src/plugin-sdk/` | `src/` internal modules | External plugins |
| `src/gateway/` | `src/routing/`, `src/plugins/`, `src/agents/` | `extensions/*` |
| `src/agents/` | `src/infra/`, `src/config/`, `src/routing/` | `src/gateway/` |

These rules are documented in `AGENTS.md` / `CLAUDE.md` files in each directory.

---

## Key Source Files

| File | Size | Role |
|------|------|------|
| `src/plugin-sdk/core.ts` | 21KB | SDK main entry (re-exports all public APIs) |
| `src/plugin-sdk/entrypoints.ts` | - | All SDK entry point definitions |
| `src/plugin-sdk/api-baseline.ts` | 495 lines | API baseline check (CI) |
| `src/plugin-sdk/channel-contract.ts` | - | Channel adapter type contracts |
| `src/plugin-sdk/AGENTS.md` | - | SDK boundary rules for AI coding assistants |

---

## Summary

1. **Plugins can only import from `openclaw/plugin-sdk/*`** — never from `src/` internals.
2. **20+ SDK entry points** — all re-exported from `core.ts` for convenience.
3. **API Baseline CI check** — ensures breaking changes are intentional and documented.
4. **`sdk-alias` is technical enforcement** — `jiti` intercepts imports and routes them correctly.
5. **`AGENTS.md` files document boundary rules** for AI coding assistants.

---

*[← Plugin System](03-plugin-system.md) | [→ Message Lifecycle](../02-flow/01-message-lifecycle.md)*
