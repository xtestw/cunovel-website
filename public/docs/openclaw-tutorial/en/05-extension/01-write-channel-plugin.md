# Writing a Channel Plugin 🔴

> This chapter walks through a complete channel plugin from scratch, showing how to add OpenClaw support for a new messaging platform.

## I. Plugin Directory Structure

```
extensions/my-channel/
├── openclaw.plugin.json    ← plugin manifest (required)
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts            ← plugin entry (exports definePlugin result)
    ├── channel.ts          ← ChannelPlugin implementation (core)
    ├── client.ts           ← HTTP client for platform API
    └── config.ts           ← config type definitions
```

---

## II. `openclaw.plugin.json`

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "enabledByDefault": false,
  "configSchema": {
    "type": "object",
    "properties": {
      "accounts": {
        "type": "object",
        "additionalProperties": {
          "type": "object",
          "properties": {
            "token": { "type": "string" }
          },
          "required": ["token"]
        }
      }
    }
  }
}
```

---

## III. Plugin Entry (`src/index.ts`)

```typescript
import { definePlugin } from 'openclaw/plugin-sdk/plugin-entry';
import { createMyChannelPlugin } from './channel.js';

export default definePlugin({
  id: 'my-channel',
  setup(api) {
    api.channel.register(createMyChannelPlugin(api));
  }
});
```

---

## IV. Channel Plugin Implementation

```typescript
// src/channel.ts
export function createMyChannelPlugin(api): ChannelPlugin {
  return {
    id: 'my-channel',

    // Required: messaging adapter
    messaging: {
      async formatInboundMessage(raw) {
        const msg = raw as { sender: string; body: string };
        return `[${msg.sender}]\n${msg.body}`;
      },
    },

    // Outbound sending
    outbound: {
      async send(params) {
        const client = new MyPlatformClient(params.accountConfig.token);
        await client.sendMessage({ chatId: params.peer.id, text: params.text });
        return { ok: true };
      },
    },

    // Lifecycle (start/stop)
    lifecycle: {
      async start(params) {
        this._pollSession = startPollingSession({
          client: new MyPlatformClient(params.accountConfig.token),
          onMessage: async (rawMsg) => {
            await params.ingest({
              accountId: params.accountId,
              peer: { kind: rawMsg.isPrivate ? 'dm' : 'group', id: String(rawMsg.chatId) },
              rawMessage: rawMsg,
            });
          },
        });
      },
      async stop() { this._pollSession?.stop(); },
    },

    // Auth check (for health monitoring)
    auth: {
      async checkToken(params) {
        try {
          const me = await new MyPlatformClient(params.token).getMe();
          return { ok: true, botId: me.id, botName: me.name };
        } catch {
          return { ok: false, error: 'Invalid token' };
        }
      },
    },
  };
}
```

---

## V. Enable in Config

```yaml
plugins:
  - path: ./extensions/my-channel  # local dev plugin

channels:
  my-channel:
    accounts:
      main-account:
        token: "${env:MY_PLATFORM_BOT_TOKEN}"

bindings:
  - agentId: main
    match:
      channel: my-channel
```

---

## VI. Reference Implementation

The Telegram plugin is the most complete official reference:

| File | Size | Reference Value |
|------|------|----------------|
| `extensions/telegram/src/channel.ts` | 37KB | Complete channel plugin |
| `extensions/telegram/src/bot.test.ts` | 79KB | Comprehensive test suite |
| `extensions/discord/src/channel.ts` | - | Another reference |

---

## Summary

1. **Minimum channel plugin**: `messaging` adapter + `openclaw.plugin.json`.
2. **Webhook over polling**: less overhead, faster response.
3. **Reference Telegram plugin**: most complete official implementation (37KB channel.ts).
4. **Local dev**: use `path: ./extensions/my-channel` without publishing to npm.

---

*[← Automation & Cron](../04-application/05-automation-cron.md) | [→ Integrate LLM Provider](02-integrate-llm-provider.md)*
