# 7. Services 层全景：26 个子服务的职责地图

> **源码位置**：`src/services/`（26 个子目录 + 15 个直属文件）

---

## 一句话理解

`src/services/` 是 Claude Code 的"中间件层"：连接核心引擎（`src/query.ts`）、工具系统（`src/tools/`）、外部 API（Anthropic/GrowthBook/OAuth）的所有服务。

---

## 服务全景地图

```
src/services/
  ├── api/               ← 与 Anthropic API 通信的所有逻辑
  ├── compact/           ← 上下文压缩（autoCompact/microCompact/snip）
  ├── analytics/         ← 遥测（GrowthBook/OTel/DataDog/1P事件）
  ├── autoDream/         ← KAIROS Dream 记忆整合
  ├── mcp/               ← MCP 协议客户端管理
  ├── oauth/             ← OAuth 认证流程
  ├── SessionMemory/     ← 会话记忆（压缩集成）
  ├── AgentSummary/      ← 子代理对话摘要
  ├── extractMemories/   ← 自动记忆提取（EXTRACT_MEMORIES）
  ├── lsp/               ← Language Server Protocol（代码诊断）
  ├── MagicDocs/         ← 文档魔法工具
  ├── PromptSuggestion/  ← 输入框提示词建议
  ├── skillSearch/       ← 技能搜索（MCP_SKILLS）
  ├── teamMemorySync/    ← 团队记忆同步（TEAMMEM）
  ├── settingsSync/      ← 设置同步（远程）
  ├── remoteManagedSettings/ ← 企业策略设置
  ├── plugins/           ← 插件注册系统
  ├── policyLimits/      ← 速率限制策略
  ├── tools/             ← 工具调度层（StreamingToolExecutor）
  ├── contextCollapse/   ← 上下文折叠（CONTEXT_COLLAPSE）
  ├── toolUseSummary/    ← 工具使用摘要
  ├── tips/              ← 使用提示系统
  └── voice.ts 等直属文件  ← 语音/通知/诊断等
```

---

## 一：api/ — Anthropic API 通信核心

### claude.ts（122 KB！）

整个项目最大的单文件，是所有 API 调用的总入口：

```typescript
// 核心函数（简化）
export async function* claudeAPIRequest(
  messages: Message[],
  systemPrompt: string,
  tools: Tool[],
  options: APIRequestOptions,
): AsyncGenerator<StreamEvent>
```

**关键职责**：
- 将内部 `Message[]` 转换为 Anthropic API 的 `BetaMessageParam[]` 格式
- 管理 Prompt Cache 的 `cache_control` 标记（四段缓存策略）
- 处理流式响应（`BetaRawMessageStreamEvent`）
- 集成 Extended Thinking（`thinking` 内容块）
- 处理 Connector Text Block（`CONNECTOR_TEXT` feature）
- 支持三种云平台：Anthropic 直连 / AWS Bedrock / Google Vertex AI

### withRetry.ts（27 KB）

所有 API 调用必须经过的重试层：

```typescript
// 三层退避策略
// 1. 429（速率限制）：指数退避 + jitter，最多 10 次
// 2. 529（过载）：只有前台查询重试，最多 3 次
// 3. 5xx（服务器错误）：ant 用户额外重试逻辑

// 重试不适用于：
// - 4xx 客户端错误（不能重试没意义）
// - 后台任务（摘要、标题、分类器）的 529
```

设计亮点：`FOREGROUND_529_RETRY_SOURCES`——明确列出哪些 `QuerySource` 在 API 过载时应该重试。防止后台任务在过载时形成"重试雪崩"。

### errors.ts（40 KB）

专门处理 API 错误的模块，将原始 Anthropic 错误转换为用户友好的消息：

```typescript
// 错误类型层次
APIError
  ├── 429 RateLimitError → "Rate limited, waiting..."
  ├── 529 OverloadedError → "Claude is busy..." 
  ├── 401 AuthenticationError → "Invalid API key"
  ├── 402 PaymentRequired → "Credit balance..."
  └── prompt_too_long → 触发 REACTIVE_COMPACT
```

### filesApi.ts（21 KB）

Files API 客户端，支持上传文件给 Claude 处理（代替 base64 内联）：

```typescript
// 上传文件到 Anthropic Files API
// Claude 通过 file_id 引用文件（减少 token 消耗）
// 支持缓存：相同内容的文件只上传一次
```

---

## 二：compact/ — 上下文压缩引擎

### 四种压缩策略（详见第三章）

| 文件 | 策略 | 触发方式 |
|------|------|---------|
| `autoCompact.ts` | AutoCompact | 超过阈值（上下文 85%+）|
| `reactiveCompact.ts` | ReactiveCompact | API 返回 `prompt_too_long` |
| `snipCompact.ts` | SnipCompact | `HISTORY_SNIP` feature |
| `microCompact.ts` | MicroCompact | 精确压缩单个工具输出 |

### compact.ts（59 KB）

核心压缩实现：

```typescript
// 压缩流程
// 1. 找到最优分割点（messageGroupBoundary）
// 2. 用 Claude 生成上半段摘要
// 3. 摘要 + 完整后半段 = 新对话历史
// 4. 触发 PostCompact hook
// 5. 更新 sessionStorage
```

### sessionMemoryCompact.ts（20 KB）

与 KAIROS 会话记忆集成的特殊压缩：在压缩时顺带提取长期记忆，写入记忆文件。

---

## 三：analytics/ — 遥测与 A/B 测试

### growthbook.ts（39 KB）

GrowthBook SDK 封装：
- 远程评估模式（`remoteEval: true`）
- 用户属性上报（id/deviceID/platform/subscriptionType 等）
- 磁盘缓存跨进程持久化
- ant 用户 20 分钟刷新 / 外部用户 6 小时刷新
- 实验曝光自动记录到一方事件

### firstPartyEventLogger.ts + firstPartyEventLoggingExporter.ts（共 40 KB）

一方（1P）事件日志——Anthropic 自己的遥测管道：

```typescript
// 事件生命周期
logEvent(name, metadata)
  → firstPartyEventLogger 批处理 (每 10s 或 100 条 flush)
  → firstPartyEventLoggingExporter 发送 POST /v1/events
  → 服务器聚合分析
```

类型安全保证：`AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`

### datadog.ts（8 KB）

DataDog 集成——监控指标推送：
- API 延迟直方图
- Token 消耗计数
- ant 用户的模型名不匿名化（便于内部调试）

---

## 四：mcp/ — MCP 服务器管理

### 子目录结构

```
src/services/mcp/
  ├── MCPClientManager.ts   ← 连接池管理
  ├── MCPServerManager.tsx  ← React 组件（权限确认 UI）
  ├── types.ts              ← MCPServerConnection 类型
  └── ...
```

`MCPClientManager` 管理所有活跃的 MCP 服务器连接：
- 启动 / 停止 MCP 服务器进程（stdio）
- 维护 SSE / HTTP 连接（远程）
- 工具列表缓存（连接建立后不再重复查询）
- 断线重连

---

## 五：lsp/ — 语言服务器集成

Language Server Protocol 集成，为文件编辑提供代码诊断（错误提示、类型检查等）：

```typescript
// 工作原理
// 1. Claude 编辑文件后，LSP 客户端触发诊断
// 2. 获取 TypeScript/ESLint/... 的实时错误
// 3. 将诊断信息传给 Claude（作为工具结果的附加信息）
// 4. Claude 可以立即看到自己写的代码有没有类型错误
```

这是 Claude Code 区别于普通 AI 编程助手的重要能力——能实时感知代码质量。

---

## 六：SessionMemory/ — 会话记忆

`KAIROS` 的短期记忆层——比日志更结构化，比 Dream 整合更快：

```
会话过程中
  → 关键信息 → SessionMemory 文件（项目目录下）
  → 压缩时 → sessionMemoryCompact 提取到长期记忆
```

---

## 七：其他重要直属文件

| 文件 | 功能 |
|------|------|
| `voice.ts` | 语音交互核心（见 5.5）|
| `diagnosticTracking.ts` | 诊断事件追踪（网络/API 健康）|
| `claudeAiLimits.ts` | claude.ai 订阅限制管理 |
| `mockRateLimits.ts` | 速率限制模拟（内部测试用）|
| `tokenEstimation.ts` | Token 数量快速估算（不调用 API）|
| `vcr.ts` | VCR（录制回放）—— API 调用录制用于测试 |
| `notifier.ts` | 系统通知（macOS/Linux/Windows）|
| `preventSleep.ts` | 防止系统休眠（长时间 Agent 任务时）|
| `awaySummary.ts` | 离开摘要（KAIROS 空闲时间摘要）|

---

## 下一步

- [6.1 三层门控](../ch06-engineering/01-three-layer-gates.md) — services 层如何被门控系统保护
- [3.6 Hooks 系统](../ch03-core-engine/06-hooks-system.md) — services 层中 hooks 的执行
