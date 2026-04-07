# 编写渠道插件 🔴

> 本章通过完整的渠道插件实战，展示如何从零开始为一个新的消息平台添加 OpenClaw 支持。

## 本章目标

读完本章你将能够：
- 创建完整的渠道插件项目结构
- 实现渠道插件的核心适配器（消息收发、认证、健康检查）
- 配置 `openclaw.plugin.json` 插件清单
- 理解渠道插件的测试策略

---

## 一、准备工作：了解目标平台

在开始编码前，你需要了解目标消息平台的：

1. **消息接入方式**：Webhook（推送）还是 Long Polling（轮询）？
2. **消息格式**：平台使用什么 JSON 格式？
3. **认证方式**：Bot Token？OAuth2？
4. **API 端点**：发送消息、获取消息的 API URL

以 Telegram 为参考：
- 接入：Webhook 或 Long Polling（两者都支持）
- 格式：`{ update_id, message: { chat, from, text } }`
- 认证：Bot Token（`https://api.telegram.org/bot<TOKEN>/...`）

---

## 二、插件目录结构

```
extensions/my-channel/
├── openclaw.plugin.json    ← 插件清单（必须）
├── package.json            ← npm 包配置
├── tsconfig.json           ← TypeScript 配置
└── src/
    ├── index.ts            ← 插件入口（导出 definePlugin 结果）
    ├── channel.ts          ← ChannelPlugin 实现（核心）
    ├── client.ts           ← 与平台 API 的 HTTP 客户端
    ├── format.ts           ← 消息格式转换
    └── config.ts           ← 配置类型定义
```

---

## 三、Step 1：创建 `openclaw.plugin.json`

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

## 四、Step 2：实现插件入口（`src/index.ts`）

```typescript
// src/index.ts
import { definePlugin } from 'openclaw/plugin-sdk/plugin-entry';
import { createMyChannelPlugin } from './channel.js';

export default definePlugin({
  id: 'my-channel',
  setup(api) {
    // 注册渠道插件
    api.channel.register(createMyChannelPlugin(api));
  }
});
```

---

## 五、Step 3：实现 `ChannelPlugin`（`src/channel.ts`）

这是渠道插件的核心文件，需要实现多个适配器：

```typescript
// src/channel.ts
import type { ChannelPlugin } from 'openclaw/plugin-sdk/core';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk/core';
import { MyPlatformClient } from './client.js';

export function createMyChannelPlugin(api: OpenClawPluginApi): ChannelPlugin {
  return {
    id: 'my-channel',

    // ─── 必须实现：消息适配器 ────────────────────────────────────
    messaging: {
      // 将平台消息格式化为 AI 可读的文本
      async formatInboundMessage(rawMessage: unknown): Promise<string> {
        const msg = rawMessage as { sender: string; body: string };
        return `[来自 ${msg.sender}]\n${msg.body}`;
      },
    },

    // ─── 出站发送 ────────────────────────────────────────────────
    outbound: {
      async send(params) {
        const client = new MyPlatformClient(params.accountConfig.token);
        await client.sendMessage({
          chatId: params.peer.id,
          text: params.text,
        });
        return { ok: true };
      },
    },

    // ─── 生命周期（启动/停止）────────────────────────────────────
    lifecycle: {
      async start(params) {
        const { accountId, accountConfig } = params;
        const client = new MyPlatformClient(accountConfig.token);
        
        // 启动 Long Polling
        this._pollSession = startPollingSession({
          client,
          onMessage: async (rawMsg) => {
            // 转换为 InboundEnvelope 并提交给 Gateway
            await params.ingest({
              accountId,
              peer: {
                kind: rawMsg.isPrivate ? 'dm' : 'group',
                id: String(rawMsg.chatId),
              },
              rawMessage: rawMsg,
            });
          },
        });
      },
      async stop() {
        this._pollSession?.stop();
      },
    },

    // ─── 认证检查（健康检查）─────────────────────────────────────
    auth: {
      async checkToken(params) {
        try {
          const client = new MyPlatformClient(params.token);
          const me = await client.getMe();
          return { ok: true, botId: me.id, botName: me.name };
        } catch {
          return { ok: false, error: 'Invalid token' };
        }
      },
    },

    // ─── 配置 Schema（用于 Onboarding Wizard）──────────────────
    setup: {
      configSchema: {
        schema: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'Bot Token' }
          },
          required: ['token'],
        },
        uiHints: {
          token: {
            label: 'Bot Token',
            help: 'Get your token from the platform developer portal',
            sensitive: true,  // 显示为密码输入框
          }
        }
      }
    },
  };
}
```

---

## 六、Step 4：实现 Webhook 接入（可选）

如果平台支持 Webhook（推荐优于 Long Polling）：

```typescript
// 在 setup(api) 中注册 Webhook 路由
api.gateway.registerHttpRoute({
  path: '/webhook/my-channel/:accountId',
  auth: 'none',  // Webhook 由平台调用，不走 Gateway 认证
  handler: async (req, res, params) => {
    const { accountId } = params;
    
    // 验证 Webhook 签名（平台特定）
    const signature = req.headers['x-signature'];
    if (!verifyWebhookSignature(req.body, signature, getSecretForAccount(accountId))) {
      res.status(403).end();
      return;
    }
    
    // 处理 Webhook 事件
    const update = JSON.parse(req.body);
    await handleUpdate(accountId, update);
    res.status(200).json({ ok: true });
  },
});
```

---

## 七、Step 5：添加到配置

```yaml
# config.yaml
plugins:
  - path: ./extensions/my-channel  # 本地开发插件

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

## 八、测试策略

Telegram 插件的测试结构可以作为参考（`bot.test.ts` 79KB，近 2000 个测试用例）：

```typescript
// 创建测试 Harness
const harness = createTestHarness({
  channel: 'my-channel',
  token: 'test-token',
});

// 模拟收到消息
await harness.injectMessage({
  sender: 'user-123',
  body: 'Hello!',
});

// 断言 AI 回复
const reply = await harness.getLastReply();
expect(reply.text).toContain('Hello');
```

---

## 关键参考源码

| 文件 | 大小 | 参考价值 |
|------|------|---------|
| `extensions/telegram/src/channel.ts` | 37KB | 最完整的渠道插件参考实现 |
| `extensions/telegram/src/bot.ts` | 20KB | Telegram Bot 核心逻辑 |
| `extensions/discord/src/channel.ts` | - | 另一个参考实现 |
| `src/channels/plugins/types.plugin.ts` | 125行 | `ChannelPlugin` 接口定义 |
| `src/channels/plugins/types.adapters.ts` | - | 所有适配器接口 |
| `extensions/telegram/openclaw.plugin.json` | - | 插件清单参考 |

---

## 小结

1. **最小渠道插件 = `messaging` 适配器 + `openclaw.plugin.json`**：其他适配器都是可选的。
2. **Webhook 优于 Long Polling**：可以减少轮询开销，响应更及时。
3. **`checkToken()` 是健康检查的基础**：让 OpenClaw 定期验证 Bot Token 有效性。
4. **参考 Telegram 插件**：它是最完整的官方参考实现（37KB channel.ts，79KB 测试文件）。
5. **本地开发直接用 `path: ./extensions/my-channel`**：无需发布到 npm 即可测试。

---

*[← 自动化与定时任务](../04-application/05-automation-cron.md) | [→ 集成 LLM Provider](02-integrate-llm-provider.md)*
