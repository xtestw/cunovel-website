# Channel Integration Patterns 🟡

> OpenClaw supports 20+ messaging platforms. Each platform has a different API, but they all follow the same integration pattern. This chapter uses the Telegram channel plugin as an example.

## I. Channel Plugin Structure

Channel plugins implement the `ChannelPlugin` interface with required and optional adapters:

```typescript
type ChannelPlugin = {
  id: ChannelId;                        // required
  messaging: ChannelMessagingAdapter;   // required
  outbound?: ChannelOutboundAdapter;    // recommended
  lifecycle?: ChannelLifecycleAdapter;  // recommended
  auth?: ChannelAuthAdapter;            // recommended
  setup?: ChannelSetupAdapter;          // for onboarding
  status?: ChannelStatusAdapter;        // for health checks
  // ... 10+ more optional adapters
};
```

---

## II. Webhook vs Long Polling

**Webhook (recommended)**: Platform pushes messages to OpenClaw.

```typescript
// Register webhook route in setup()
api.gateway.registerHttpRoute({
  path: '/webhook/my-channel/:accountId',
  auth: 'none',
  handler: async (req, res, params) => {
    const update = JSON.parse(req.body);
    await handleUpdate(params.accountId, update);
    res.status(200).json({ ok: true });
  },
});
```

**Long Polling**: OpenClaw actively polls the platform API (for platforms that don't support webhooks).

### Auto-Restart Policy

`ChannelManager` in `server-channels.ts` automatically restarts crashed channels with exponential backoff:
```typescript
const RESTART_POLICY = {
  initialMs: 5_000,   // 5 second initial wait
  maxMs: 300_000,     // max 5 minutes
  factor: 2,          // exponential
  jitter: 0.1,        // 10% random jitter
};
```

---

## III. Channel Capability Differences

| Capability | Telegram | Discord | Slack | iMessage |
|-----------|---------|---------|-------|---------|
| Markdown | ✅ | ✅ | ✅ | ❌ |
| Images | ✅ | ✅ | ✅ | ✅ |
| Streaming | ❌ | ✅ | ✅ | ❌ |
| Buttons | ✅ | ✅ | ✅ | ❌ |

Channel plugins declare capabilities via the `capabilities` field:

```typescript
type ChannelCapabilities = {
  streaming?: boolean;
  images?: boolean;
  markdown?: boolean;
  voiceMessages?: boolean;
};
```

---

## IV. Multi-Account Support

One channel plugin can manage multiple bot accounts:

```yaml
channels:
  telegram:
    accounts:
      main-bot:
        token: "${env:TELEGRAM_BOT_1_TOKEN}"
      work-bot:
        token: "${env:TELEGRAM_BOT_2_TOKEN}"
```

---

## V. Health Monitoring

`channel-health-monitor.ts` periodically validates Bot Tokens:
- Calls `ChannelAuthAdapter.checkToken()` at configured intervals
- Updates `ChannelAccountSnapshot.status`
- Alerts via configured alert channel if token becomes invalid

---

## Key Source Files

| File | Size | Role |
|------|------|------|
| `extensions/telegram/src/channel.ts` | 37KB | Reference channel plugin implementation |
| `src/gateway/server-channels.ts` | 20KB | Channel lifecycle management |
| `src/gateway/channel-health-monitor.ts` | 6.6KB | Health monitoring |

---

## Summary

1. **Minimum viable channel**: `messaging` adapter + `openclaw.plugin.json`.
2. **Webhook over polling**: less overhead, faster response times.
3. **Auto-restart**: exponential backoff with jitter on crashes.
4. **Multi-account via `accountId`**: same plugin handles multiple bot accounts.

---

*[← Auth System](02-auth-system.md) | [→ Memory & MCP](04-memory-mcp.md)*
