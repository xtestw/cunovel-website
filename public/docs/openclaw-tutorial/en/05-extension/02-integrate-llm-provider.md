# Integrating an LLM Provider 🔴

> OpenClaw supports any LLM service. This chapter explains how to write a Provider plugin — from quick OpenAI-compatible integration to fully custom implementations.

## I. `openclaw.plugin.json` for Provider

```json
{
  "id": "my-llm",
  "enabledByDefault": false,
  "providers": ["my-llm"],
  "providerAuthEnvVars": {
    "my-llm": ["MY_LLM_API_KEY"]
  },
  "providerAuthChoices": [{
    "provider": "my-llm",
    "method": "api-key",
    "choiceId": "apiKey",
    "choiceLabel": "API Key",
    "groupId": "my-llm",
    "groupLabel": "My LLM",
    "optionKey": "myLlmApiKey"
  }]
}
```

---

## II. Quick Integration: `defineSingleProviderPlugin`

For OpenAI-compatible APIs:

```typescript
import { defineSingleProviderPlugin } from 'openclaw/plugin-sdk/provider-entry';

export default defineSingleProviderPlugin({
  id: 'my-llm',
  name: 'My LLM Provider',
  provider: {
    id: 'my-llm',
    auth: [{ methodId: 'api-key', envVar: 'MY_LLM_API_KEY' }],
    catalog: {
      staticModels: [
        { id: 'my-llm-v1', contextWindow: 128000, maxOutputTokens: 4096 },
      ],
      buildProvider: ({ apiKey }) => new OpenAICompatibleProvider({
        baseURL: 'https://api.myllm.example.com/v1',
        apiKey,
      }),
    },
  },
});
```

Internally handles: auth flow, Wizard onboarding, model catalog, health checks.

---

## III. Fully Custom Provider

```typescript
export const customProvider: ProviderPlugin = {
  id: 'custom-llm',
  
  async listModels(): Promise<ModelEntry[]> {
    const response = await fetch('https://api.customllm.com/models', {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    });
    const data = await response.json();
    return data.models.map((m: any) => ({
      id: m.model_id, label: m.display_name, contextWindow: m.max_context_length,
    }));
  },

  async stream(params: ProviderCallParams): Promise<void> {
    const { messages, model, signal, onTextDelta, onComplete } = params;
    const response = await fetch('https://api.customllm.com/chat', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getApiKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model.id, messages, stream: true }),
      signal,
    });
    
    const reader = response.body!.getReader();
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      // parse SSE and call onTextDelta for each token
      const delta = parseSSEDelta(chunk);
      if (delta) { onTextDelta(delta); fullText += delta; }
    }
    onComplete({ fullText });
  },
};
```

---

## IV. Local Models: Ollama

```yaml
plugins:
  - id: ollama

agents:
  default:
    model: ollama/llama3.1:8b

# No API key needed — just run: ollama serve
```

Custom Ollama address:
```yaml
plugins:
  - id: ollama
    config:
      baseURL: 'http://192.168.1.100:11434'
```

---

## V. Manual Context Window Config

```yaml
models:
  providers:
    my-llm:
      models:
        - id: my-llm-v1
          contextWindow: 131072  # 128K tokens
```

---

## VI. Multi-Provider Failover

```yaml
agents:
  list:
    - id: main
      model: anthropic/claude-opus-4-5
      modelFallbacks:
        - model: openai/gpt-4o
          triggerOnErrors: [rate_limit_error, overloaded_error]
        - model: ollama/llama3.1:70b
          triggerOnErrors: [all]
```

---

## Summary

1. **`defineSingleProviderPlugin`** is the fast path for OpenAI-compatible APIs — ~10 lines of code.
2. **Full `ProviderPlugin` interface**: `listModels()` + `stream()` for any API format.
3. **Ollama** for local models — no API key, great for development and privacy.
4. **Manual context window config** when provider doesn't auto-report it.
5. **`modelFallbacks`** for multi-layer failover ensuring service availability.

---

*[← Write a Channel Plugin](01-write-channel-plugin.md) | [→ Create a Skill](03-create-skill.md)*
