# 6.3 遥测与可观测性：OpenTelemetry 实践

> **章节目标**：了解 Claude Code 如何通过 OpenTelemetry 实现全面的可观测性，以及指标追踪的设计原则。

---

## 为什么需要遥测？

Claude Code 是一个 AI 产品，需要持续回答这些问题：
- 用户每次会话平均花费多少美元？
- 哪些工具最频繁被调用？
- 平均 TTFT（Time To First Token）是多少？
- 某次部署后响应延迟有没有上升？

遥测系统就是收集这些数据的基础设施。

---

## OpenTelemetry 全套接入

Claude Code 使用完整的 OpenTelemetry（OTel）堆栈：

```typescript
// src/bootstrap/state.ts 中初始化
import type { Meter } from '@opentelemetry/api'
import type { MeterProvider } from '@opentelemetry/sdk-metrics'
import type { BasicTracerProvider } from '@opentelemetry/sdk-trace-base'
import type { LoggerProvider } from '@opentelemetry/sdk-logs'
```

三大支柱全部覆盖：
- **Metrics**（指标）— 数值型聚合数据：成本、token 数、响应时长
- **Traces**（链路追踪）— 操作时间线：一次工具调用的完整生命周期
- **Logs**（日志）— 事件记录：API 错误、用户操作、重要状态变化

---

## 核心指标设计

`bootstrap/state.ts` 中定义了全部的 OTel 计数器：

```typescript
type State = {
  // OTel 基础设施
  meter: Meter | null                              // OTel Meter 实例

  // 业务指标计数器
  sessionCounter: AttributedCounter | null         // 会话次数
  locCounter: AttributedCounter | null             // 代码行数（写入/删除）
  prCounter: AttributedCounter | null              // PR 创建次数
  commitCounter: AttributedCounter | null          // Commit 次数
  costCounter: AttributedCounter | null            // API 费用（USD）
  tokenCounter: AttributedCounter | null           // Token 使用量
  codeEditToolDecisionCounter: AttributedCounter | null  // 文件编辑工具决策（允许/拒绝/修改）
  activeTimeCounter: AttributedCounter | null      // 活跃时间
  
  // 性能指标
  totalCostUSD: number                             // 本会话总费用
  totalAPIDuration: number                         // 累计 API 耗时（含重试）
  totalAPIDurationWithoutRetries: number           // 累计 API 耗时（不含重试）
  totalToolDuration: number                        // 累计工具执行耗时
  
  // Turn 粒度指标
  turnToolDurationMs: number                       // 当前 Turn 工具耗时
  turnHookDurationMs: number                       // 当前 Turn Hook 耗时
  turnClassifierDurationMs: number                 // 当前 Turn 分类器耗时
  turnToolCount: number                            // 当前 Turn 工具调用次数
  turnHookCount: number                            // 当前 Turn Hook 调用次数
  
  // 代码变更指标
  totalLinesAdded: number                          // 累计新增行数
  totalLinesRemoved: number                        // 累计删除行数
}
```

**为什么追踪 Turn 粒度指标？**

Turn 级别的 `toolDurationMs`、`hookDurationMs`、`classifierDurationMs` 帮助 Anthropic 工程师了解：
- 工具执行占整个 Turn 时长的比例（发现性能瓶颈）
- Hook 系统的开销是否超出预期
- Bash Classifier 的延迟影响

---

## AttributedCounter：带属性的计数器

```typescript
export type AttributedCounter = {
  add(value: number, additionalAttributes?: Attributes): void
}
```

"带属性"意味着每次计数时可以附带维度信息：

```typescript
// 记录一次 token 消耗，附带模型名称
tokenCounter?.add(usage.inputTokens + usage.outputTokens, {
  model: modelName,
  type: 'input_output',
  querySource: 'repl',
})

// 记录一次代码编辑工具决策，附带决策类型
codeEditToolDecisionCounter?.add(1, {
  decision: 'accepted',  // 'accepted' | 'rejected' | 'modified'
  tool: 'str_replace_based_edit',
})
```

这让数据分析时可以按模型、工具类型等维度进行聚合和对比。

---

## statsStore：性能剖析

```typescript
type State = {
  // ...
  statsStore: { observe(name: string, value: number): void } | null
}
```

`statsStore` 是一个轻量的性能观察接口，用于记录不适合 OTel 指标的临时性性能数据：

```typescript
// 例如记录 GrowthBook 冷启动延迟
statsStore?.observe('growthbook_cold_start_ms', duration)

// 例如记录 System Prompt 构建耗时
statsStore?.observe('system_prompt_build_ms', duration)
```

---

## 遥测保护机制

Claude Code 对遥测数据有严格的保护规则：

### 类型名约定：`_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`

```typescript
// src/services/analytics/index.ts
type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS = {
  [key: string]: string | number | boolean | null
}

export function logEvent(
  name: string,
  metadata: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
): void
```

这个超长的类型名是一个**编码规范的强制执行**：任何要记录的 metadata，开发者必须在类型层面声明"我已验证这不包含代码或文件路径"。这是防止意外将用户源代码发送到 Anthropic 服务器的保护机制。

### `_NO_PII_IN_THESE_PARAMS` 命名约定

```typescript
// 内部诊断日志（类似保护机制）
export function logForDiagnosticsNoPII(
  level: 'info' | 'warn' | 'error',
  event: string,
  params?: Record<string, unknown>,
): void
```

函数名中的 `NoPII`（No Personally Identifiable Information）提醒调用者：这个函数的参数会被记录，不能包含个人身份信息。

---

## DataDog 集成

遥测数据最终发送到 DataDog（Anthropic 的监控平台）：

```typescript
// GrowthBook 控制 DataDog 事件日志
const shouldLogDatadog = getFeatureValue_CACHED_MAY_BE_STALE('tengu_log_datadog_events')

// ant 用户：DataDog 中模型名不匿名化
// external 用户：模型名在 DataDog 中被匿名化
```

---

## headlessProfilerCheckpoint：启动性能剖析

```typescript
// src/utils/headlessProfiler.ts
export function headlessProfilerCheckpoint(name: string): void
```

这个函数在 `QueryEngine.submitMessage()` 等关键路径上记录时间戳：

```typescript
headlessProfilerCheckpoint('before_getSystemPrompt')
// ... fetchSystemPromptParts() ...
headlessProfilerCheckpoint('after_getSystemPrompt')
```

在 headless（非交互）模式下，这些 checkpoint 之间的时间差会被记录，用于分析 SDK 调用的延迟分布。

---

## 下一步

- [6.4 会话持久化与历史记录](./04-session-persistence.md) — 对话历史如何存储
