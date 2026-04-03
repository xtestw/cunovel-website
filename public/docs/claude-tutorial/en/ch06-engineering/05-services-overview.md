# 6.5 Services Layer Panorama: Responsibility Map of 26 Subservices

> **Source location**: `src/services/` (26 subdirectories + 15 top-level files)

---

## One-line understanding

`src/services/` is Claude Code's middleware layer: it connects the core engine (`src/query.ts`), tool system (`src/tools/`), and external APIs (Anthropic/GrowthBook/OAuth).

---

## Service map

```
src/services/
  ├── api/               <- Anthropic API communication
  ├── compact/           <- context compression (auto/micro/snip)
  ├── analytics/         <- telemetry (GrowthBook/OTel/DataDog/1P events)
  ├── autoDream/         <- KAIROS Dream consolidation
  ├── mcp/               <- MCP client/server management
  ├── oauth/             <- OAuth authentication flow
  ├── SessionMemory/     <- session memory integration
  ├── AgentSummary/      <- sub-agent conversation summarization
  ├── extractMemories/   <- automatic memory extraction
  ├── lsp/               <- language server diagnostics
  ├── MagicDocs/         <- documentation helper tooling
  ├── PromptSuggestion/  <- input prompt suggestion
  ├── skillSearch/       <- skill search
  ├── teamMemorySync/    <- team memory synchronization
  ├── settingsSync/      <- remote settings sync
  ├── remoteManagedSettings/ <- policy-managed settings
  ├── plugins/           <- plugin registration system
  ├── policyLimits/      <- policy rate-limit controls
  ├── tools/             <- tool execution layer (StreamingToolExecutor)
  ├── contextCollapse/   <- context collapse
  ├── toolUseSummary/    <- tool use summaries
  ├── tips/              <- usage tips
  └── voice.ts, etc.     <- voice/notifications/diagnostics
```

---

## 1) `api/`: core Anthropic API communication

### `claude.ts` (122KB)

Largest project file; central API request entrypoint:

```typescript
export async function* claudeAPIRequest(
  messages: Message[],
  systemPrompt: string,
  tools: Tool[],
  options: APIRequestOptions,
): AsyncGenerator<StreamEvent>
```

Responsibilities:

- convert internal `Message[]` to Anthropic API `BetaMessageParam[]`
- maintain Prompt Cache `cache_control` markers (4-part strategy)
- handle streaming `BetaRawMessageStreamEvent`
- integrate Extended Thinking blocks
- support connector text blocks
- support Anthropic direct / AWS Bedrock / Google Vertex

### `withRetry.ts` (27KB)

Universal retry layer:

```typescript
// retry policy
// 1) 429 rate-limit: exponential backoff + jitter (up to 10)
// 2) 529 overload: foreground queries only (up to 3)
// 3) 5xx server errors: extra retries for ant users
```

No retries for non-retriable classes (most 4xx, selected background tasks).

### `errors.ts` (40KB)

Maps raw API failures to user-facing diagnostics:

```typescript
APIError
  ├── 429 RateLimitError -> "Rate limited, waiting..."
  ├── 529 OverloadedError -> "Claude is busy..."
  ├── 401 AuthenticationError -> "Invalid API key"
  ├── 402 PaymentRequired -> "Credit balance..."
  └── prompt_too_long -> triggers REACTIVE_COMPACT
```

### `filesApi.ts` (21KB)

Files API client:

- upload files for Claude processing
- replace base64-inline payloads with `file_id` references
- content-based dedupe uploads

---

## 2) `compact/`: context compression engine

### Four strategies

| File | Strategy | Trigger |
|------|----------|---------|
| `autoCompact.ts` | AutoCompact | context exceeds threshold (~85%+) |
| `reactiveCompact.ts` | ReactiveCompact | API returns `prompt_too_long` |
| `snipCompact.ts` | SnipCompact | `HISTORY_SNIP` feature |
| `microCompact.ts` | MicroCompact | precise compression for single outputs |

### `compact.ts` (59KB)

Core flow:

```typescript
// 1. find best boundary
// 2. summarize upper half with Claude
// 3. new history = summary + full recent half
// 4. run PostCompact hook
// 5. update sessionStorage
```

### `sessionMemoryCompact.ts` (20KB)

Special compact path integrated with long-term memory extraction.

---

## 3) `analytics/`: telemetry and A/B experimentation

### `growthbook.ts` (39KB)

GrowthBook SDK wrapper:

- remote eval mode
- user attributes (id/device/platform/subscription)
- disk cache persistence across processes
- refresh cadence: 20min (ant) / 6h (external)
- automatic experiment exposure logging

### `firstPartyEventLogger.ts` + `firstPartyEventLoggingExporter.ts`

First-party telemetry pipeline:

```typescript
logEvent(name, metadata)
  -> batch logger (flush every 10s or 100 events)
  -> exporter POST /v1/events
  -> server-side aggregation
```

Type-safety contract:
`AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`

### `datadog.ts` (8KB)

DataDog metrics integration:

- API latency histograms
- token usage counters
- model-name anonymization policy differs by user type

---

## 4) `mcp/`: MCP server/client management

```
src/services/mcp/
  ├── MCPClientManager.ts
  ├── MCPServerManager.tsx
  ├── types.ts
  └── ...
```

`MCPClientManager` responsibilities:

- start/stop stdio MCP server processes
- maintain SSE/HTTP remote connections
- cache tool lists
- reconnect on disconnection

---

## 5) `lsp/`: language server integration

LSP integration powers post-edit diagnostics:

```typescript
// after Claude edits code:
// 1. trigger diagnostics from TS/ESLint/... servers
// 2. attach errors to tool results
// 3. Claude immediately sees type/lint regressions
```

This real-time feedback loop is a key differentiator versus basic AI coding assistants.

---

## 6) `SessionMemory/`: session memory layer

Short-term memory layer under KAIROS:

```
during session
  -> key info saved to SessionMemory artifacts
  -> during compact, extracted into longer-term memory
```

---

## 7) Other important top-level service files

| File | Purpose |
|------|---------|
| `voice.ts` | voice interaction core |
| `diagnosticTracking.ts` | diagnostic event tracking |
| `claudeAiLimits.ts` | claude.ai subscription limits |
| `mockRateLimits.ts` | simulated rate limits for testing |
| `tokenEstimation.ts` | token estimation without API call |
| `vcr.ts` | API record/replay testing utility |
| `notifier.ts` | OS notifications |
| `preventSleep.ts` | prevent system sleep on long-running tasks |
| `awaySummary.ts` | away-time summary in KAIROS |

---

## Next

- [6.1 Three-Layer Gates](../ch06-engineering/01-three-layer-gates.md) - how services are protected by gate architecture
- [3.6 Hooks System](../ch03-core-engine/06-hooks-system.md) - hooks executed through services layer
