# Plugin SDK Design 🔴

> The Plugin SDK isn't just a set of interfaces — it's OpenClaw's "public commitment" to plugin developers. This chapter digs into the SDK's design philosophy.

## Learning Objectives

After reading this chapter, you'll be able to:
- Understand the Plugin API's 3-layer design (registration → adapters → runtime)
- Explain why the SDK uses `type` exports instead of `class`
- Understand `PluginRuntime`'s design intent
- Know how Wizard flows work in plugins

---

## I. Three Design Goals

The Plugin SDK must simultaneously satisfy three seemingly contradictory goals:

1. **Plugin-developer friendly**: Simple, low barrier, no need to understand core internals
2. **Core-evolution friendly**: Core can refactor internals without breaking existing plugins
3. **Secure and stable**: Prevents plugins from accessing sensitive core data

The solution: **completely separate public API from internal implementation**.

---

## II. 3-Layer Plugin API Model

### Layer 1: Registration API (used in `setup()`)

```typescript
type OpenClawPluginApi = {
  channel: { register: (channel: ChannelPlugin) => void };
  tools: { register: (tool: ToolFactory) => void };
  hooks: { on: <T>(name: T, handler: HookHandler<T>) => void };
  commands: { register: (cmd: CliCommandDef) => void };
  provider: { register: (provider: ProviderPlugin) => void };
  runtime: PluginRuntime;
};
```

### Layer 2: Adapter Interfaces (runtime implementations)

All adapter interfaces are TypeScript `type` (not `class`). Why?

- **Testability**: types are easy to mock, no constructor inheritance dependency
- **Flexibility**: plugins can implement interfaces using function objects, class instances, or factories
- **Version compatibility**: interfaces can be progressively extended without breaking plugins

Key channel adapters:

```typescript
type ChannelPlugin = {
  id: ChannelId;
  messaging: ChannelMessagingAdapter;    // required
  outbound?: ChannelOutboundAdapter;     // optional
  lifecycle?: ChannelLifecycleAdapter;   // optional
  auth?: ChannelAuthAdapter;             // optional
  // ... 10+ more optional adapters
};
```

### Layer 3: `PluginRuntime` (runtime access)

```typescript
type PluginRuntime = {
  config: OpenClawConfig;   // current config (read-only)
  logger: PluginLogger;     // structured logging
  secrets: SecretResolver;  // secret resolution
  gateway: GatewayRuntime;  // gateway runtime APIs
};
```

---

## III. `defineSingleProviderPlugin` Factory

For standard Provider plugins using API key authentication:

```typescript
// extensions/my-llm/src/index.ts
import { defineSingleProviderPlugin } from 'openclaw/plugin-sdk/provider-entry';

export default defineSingleProviderPlugin({
  id: 'my-llm',
  name: 'My LLM Provider',
  provider: {
    id: 'my-llm',
    auth: [{ methodId: 'api-key', envVar: 'MY_LLM_API_KEY' }],
    catalog: {
      buildProvider: ({ apiKey }) => new MyLlmProvider({ apiKey })
    }
  }
});
```

Internally, `defineSingleProviderPlugin()` handles: auth flow, Wizard onboarding, model catalog registration, health checks, error display (Doctor).

---

## Key Source Files

| File | Size | Role |
|------|------|------|
| `src/plugins/types.ts` | 2739 lines | All plugin type definitions |
| `src/channels/plugins/types.plugin.ts` | 125 lines | `ChannelPlugin` interface |
| `src/channels/plugins/types.adapters.ts` | - | Channel adapter interface definitions |
| `src/plugin-sdk/provider-entry.ts` | - | `defineSingleProviderPlugin` factory |

---

## Summary

1. **3-layer model**: registration API (setup) → adapter interfaces (runtime impl) → runtime access (execution).
2. **`type` over `class`**: all adapter interfaces are TypeScript types for testability and flexibility.
3. **Wizard flows standardized**: all plugins share unified onboarding mechanism.
4. **`defineSingleProviderPlugin`** is the most common high-level wrapper — most Provider plugins need ~10 lines.

---

*[← Agent Call Loop](../02-flow/03-agent-call-loop.md) | [→ Auth System](02-auth-system.md)*
