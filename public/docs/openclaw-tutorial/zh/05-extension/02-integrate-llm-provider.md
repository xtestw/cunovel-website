# 集成 LLM Provider 🔴

> OpenClaw 支持接入任意 LLM 服务——Anthropic、OpenAI、本地 Ollama 模型、甚至完全自定义的推理服务。本章讲解如何编写 Provider 插件。

## 本章目标

读完本章你将能够：
- 理解 Provider 插件与渠道插件的区别
- 使用 `defineSingleProviderPlugin` 快速接入兼容 OpenAI API 的服务
- 实现完全自定义的 Provider 插件
- 配置模型目录（Model Catalog）和 Context Window

---

## 一、Provider 插件的职责

Provider 插件负责：
1. **认证管理**：API Key 的存储、验证、轮换
2. **模型目录**：提供可用模型列表（model catalog）
3. **推理调用**：将 OpenClaw 的统一消息格式转换为 Provider 的 API 格式并调用
4. **流式响应**：处理 Server-Sent Events 或 WebSocket 流，逐 token 回传

---

## 二、`openclaw.plugin.json` for Provider

```json
{
  "id": "my-llm-provider",
  "enabledByDefault": false,
  "providers": ["my-llm-provider"],
  "providerAuthEnvVars": {
    "my-llm-provider": ["MY_LLM_API_KEY"]
  },
  "providerAuthChoices": [
    {
      "provider": "my-llm-provider",
      "method": "api-key",
      "choiceId": "apiKey",
      "choiceLabel": "API Key",
      "groupId": "my-llm-provider",
      "groupLabel": "My LLM Provider",
      "optionKey": "myLlmApiKey",
      "cliFlag": "--my-llm-api-key",
      "cliOption": "--my-llm-api-key <key>",
      "cliDescription": "My LLM Provider API key"
    }
  ]
}
```

---

## 三、快速接入：`defineSingleProviderPlugin`

对于兼容 OpenAI API 格式的服务，`defineSingleProviderPlugin` 是最省力的方式：

```typescript
// extensions/my-llm/src/index.ts
import { defineSingleProviderPlugin } from 'openclaw/plugin-sdk/provider-entry';

export default defineSingleProviderPlugin({
  id: 'my-llm-provider',
  name: 'My LLM Provider',
  description: 'Connect to My LLM Provider API',
  
  provider: {
    id: 'my-llm-provider',
    label: 'My LLM Provider',
    
    auth: [{
      methodId: 'api-key',
      label: 'My LLM API Key',
      envVar: 'MY_LLM_API_KEY',
      hint: 'Get your API key from https://myllm.example.com/console',
    }],
    
    catalog: {
      // 内置模型列表（也可以通过 API 动态获取）
      staticModels: [
        {
          id: 'my-llm-v1',
          label: 'My LLM v1',
          contextWindow: 128000,
          maxOutputTokens: 4096,
        },
        {
          id: 'my-llm-v2-mini',
          label: 'My LLM v2 Mini',
          contextWindow: 64000,
          maxOutputTokens: 2048,
        },
      ],
      
      // 使用兼容 OpenAI SDK 的客户端
      buildProvider: ({ apiKey, model }) => {
        return new OpenAICompatibleProvider({
          baseURL: 'https://api.myllm.example.com/v1',
          apiKey,
          model,
        });
      },
    },
  },
});
```

---

## 四、完全自定义 Provider

如果 LLM 服务不兼容 OpenAI API，需要实现完整的 `ProviderPlugin`：

```typescript
// extensions/custom-llm/src/provider.ts
import type { ProviderPlugin, ProviderCallParams } from 'openclaw/plugin-sdk/core';

export const customLlmProvider: ProviderPlugin = {
  id: 'custom-llm',
  
  // 获取可用模型列表
  async listModels(): Promise<ModelEntry[]> {
    const response = await fetch('https://api.customllm.com/models', {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    });
    const data = await response.json();
    return data.models.map((m: any) => ({
      id: m.model_id,
      label: m.display_name,
      contextWindow: m.max_context_length,
    }));
  },

  // 执行推理调用（流式）
  async stream(params: ProviderCallParams): Promise<void> {
    const { messages, model, signal, onTextDelta, onComplete } = params;
    
    // 将 OpenClaw 消息格式转换为自定义格式
    const customMessages = messages.map(convertMessage);
    
    const response = await fetch('https://api.customllm.com/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.id,
        messages: customMessages,
        stream: true,
      }),
      signal,  // 支持请求取消
    });
    
    // 处理 SSE 流
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          const delta = data.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            onTextDelta(delta);  // 逐 token 回调
            fullText += delta;
          }
        }
      }
    }
    
    onComplete({ fullText });
  },
};
```

---

## 五、本地模型：Ollama 集成模式

Ollama 是最常用的本地 LLM 运行时，`extensions/ollama/` 提供了官方集成：

```yaml
# config.yaml — 使用 Ollama 本地模型
plugins:
  - id: ollama

agents:
  default:
    model: ollama/llama3.1:8b

# Ollama 不需要 API Key，只需确保 Ollama 服务在运行
# ollama serve  （默认端口 11434）
```

自定义 Ollama 地址（如远程 Ollama 服务器）：

```yaml
plugins:
  - id: ollama
    config:
      baseURL: 'http://192.168.1.100:11434'  # 远程 Ollama
```

---

## 六、模型 Context Window 配置

如果 OpenClaw 不能自动检测模型的 Context Window 大小，可以手动配置：

```yaml
# config.yaml
models:
  providers:
    my-llm-provider:
      models:
        - id: my-llm-v1
          contextWindow: 131072   # 128K tokens
        - id: my-llm-v2-mini
          contextWindow: 65536    # 64K tokens
```

这些配置会被 `context.ts` 中的 `applyConfiguredContextWindows()` 读取，用于：
- 触发 Compaction 的时机
- Bootstrap 预算计算（Skill 文件能注入多少）
- Context Window 使用量的 UI 展示

---

## 七、Provider 故障转移配置

配置多个 Provider 实现自动故障转移：

```yaml
# config.yaml
agents:
  list:
    - id: main
      model: anthropic/claude-opus-4-5       # 主 Provider
      modelFallbacks:
        - model: openai/gpt-4o               # 第一备选
          triggerOnErrors:
            - rate_limit_error
            - overloaded_error
        - model: ollama/llama3.1:70b         # 最终兜底（本地）
          triggerOnErrors:
            - all
```

---

## 关键参考源码

| 文件 | 大小 | 参考价值 |
|------|------|---------|
| `extensions/openai/src/index.ts` | - | 官方 OpenAI Provider 参考 |
| `extensions/anthropic/src/index.ts` | - | 官方 Anthropic Provider 参考 |
| `extensions/ollama/src/index.ts` | - | 本地模型 Provider 参考 |
| `src/plugin-sdk/provider-entry.ts` | - | `defineSingleProviderPlugin` 工厂 |
| `src/agents/context.ts` | 15KB | Context Window 管理（包含 `applyConfiguredContextWindows`）|
| `src/agents/model-fallback.ts` | - | 多 Provider 故障转移逻辑 |
| `extensions/anthropic/openclaw.plugin.json` | 54行 | Provider 插件清单参考 |

---

## 小结

1. **`defineSingleProviderPlugin` 是快速通道**：兼容 OpenAI API 格式时，10 行代码即可完成 Provider 集成。
2. **完整 `ProviderPlugin` 接口**：`listModels()` + `stream()` 是核心，支持任意 API 格式。
3. **Ollama 官方支持**：本地运行无需 API Key，适合开发测试和隐私敏感场景。
4. **手动配置 Context Window**：当 Provider 不能自动报告时，在 `models.providers` 中配置。
5. **故障转移**：`modelFallbacks` 配置多层备选，确保服务可用性。

---

*[← 编写渠道插件](01-write-channel-plugin.md) | [→ 创建 Skill](03-create-skill.md)*
