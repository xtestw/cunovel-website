# 6.3 Telemetry & Observability: OpenTelemetry in Practice

> **Goal**: understand how Claude Code implements full-stack observability via OpenTelemetry, and why metric design matters.

---

## Why telemetry matters

As an AI product, Claude Code constantly needs answers to questions like:

- How much does each session cost on average?
- Which tools are invoked most frequently?
- What is average TTFT (Time To First Token)?
- Did latency regress after a deployment?

Telemetry infrastructure exists to answer these.

---

## Full OpenTelemetry integration

Claude Code uses the complete OTel stack:

```typescript
// initialized in src/bootstrap/state.ts
import type { Meter } from '@opentelemetry/api'
import type { MeterProvider } from '@opentelemetry/sdk-metrics'
import type { BasicTracerProvider } from '@opentelemetry/sdk-trace-base'
import type { LoggerProvider } from '@opentelemetry/sdk-logs'
```

All three observability pillars are covered:

- **Metrics**: aggregated numeric signals (cost, tokens, durations)
- **Traces**: timeline of operations (end-to-end tool call lifecycle)
- **Logs**: event records (API errors, user operations, state transitions)

---

## Core metric design

`bootstrap/state.ts` defines counters and session aggregates:

```typescript
type State = {
  meter: Meter | null

  // business counters
  sessionCounter: AttributedCounter | null
  locCounter: AttributedCounter | null
  prCounter: AttributedCounter | null
  commitCounter: AttributedCounter | null
  costCounter: AttributedCounter | null
  tokenCounter: AttributedCounter | null
  codeEditToolDecisionCounter: AttributedCounter | null
  activeTimeCounter: AttributedCounter | null

  // aggregate performance
  totalCostUSD: number
  totalAPIDuration: number
  totalAPIDurationWithoutRetries: number
  totalToolDuration: number

  // turn-level metrics
  turnToolDurationMs: number
  turnHookDurationMs: number
  turnClassifierDurationMs: number
  turnToolCount: number
  turnHookCount: number

  // code churn
  totalLinesAdded: number
  totalLinesRemoved: number
}
```

Why turn-level metrics matter:

- understand share of turn time spent in tool execution
- quantify hook overhead
- measure latency impact of safety classifiers

---

## `AttributedCounter`: dimensional counters

```typescript
export type AttributedCounter = {
  add(value: number, additionalAttributes?: Attributes): void
}
```

"Attributed" means each increment can carry dimensions:

```typescript
// token usage with model dimension
tokenCounter?.add(usage.inputTokens + usage.outputTokens, {
  model: modelName,
  type: 'input_output',
  querySource: 'repl',
})

// code-edit tool decision breakdown
codeEditToolDecisionCounter?.add(1, {
  decision: 'accepted', // accepted | rejected | modified
  tool: 'str_replace_based_edit',
})
```

This enables grouped analysis by model, tool, decision, and source.

---

## `statsStore`: profiling-oriented observations

```typescript
type State = {
  statsStore: { observe(name: string, value: number): void } | null
}
```

`statsStore` captures lightweight timing points less suited for stable OTel counters:

```typescript
statsStore?.observe('growthbook_cold_start_ms', duration)
statsStore?.observe('system_prompt_build_ms', duration)
```

---

## Telemetry data-protection conventions

Claude Code enforces strict guardrails on telemetry payloads.

### Naming contract: `_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`

```typescript
type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS = {
  [key: string]: string | number | boolean | null
}

export function logEvent(
  name: string,
  metadata: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
): void
```

This deliberately verbose type name acts as a coding-time safety reminder: do not send source code or file paths.

### Naming convention: `_NO_PII_IN_THESE_PARAMS`

```typescript
export function logForDiagnosticsNoPII(
  level: 'info' | 'warn' | 'error',
  event: string,
  params?: Record<string, unknown>,
): void
```

`NoPII` indicates parameters are logged and must not contain personal data.

---

## DataDog integration

Telemetry is eventually exported to DataDog:

```typescript
const shouldLogDatadog = getFeatureValue_CACHED_MAY_BE_STALE('tengu_log_datadog_events')
```

- ant users: model names are not anonymized (for internal debugging)
- external users: model names are anonymized in DataDog

---

## `headlessProfilerCheckpoint`: startup profiling

```typescript
// src/utils/headlessProfiler.ts
export function headlessProfilerCheckpoint(name: string): void
```

Used in critical paths like `QueryEngine.submitMessage()`:

```typescript
headlessProfilerCheckpoint('before_getSystemPrompt')
// ... fetchSystemPromptParts() ...
headlessProfilerCheckpoint('after_getSystemPrompt')
```

In headless mode, checkpoint deltas are recorded to analyze latency distributions.

---

## Next

- [6.4 Session Persistence & History](./04-session-persistence.md) - storage and resume behavior
