# 2.1 六层架构：从终端输入到 AI 输出

> **章节目标**：理解 Claude Code 的完整分层架构，建立"每一层做什么、依赖什么"的清晰认知。

---

## 架构全景图

Claude Code 并不是一个扁平的程序，而是一个由六层构成的有机系统：

```
┌─────────────────────────────────────────────────────┐
│  层 6：功能门控层（Feature Gates）                      │
│  feature() / USER_TYPE / GrowthBook                  │
├─────────────────────────────────────────────────────┤
│  层 5：网络层（Network / Bridge）                       │
│  Bridge 远程控制 · MCP 协议 · OAuth                    │
├─────────────────────────────────────────────────────┤
│  层 4：Agent 编排层（Orchestration）                   │
│  Coordinator · 子 Agent · KAIROS 持久助手              │
├─────────────────────────────────────────────────────┤
│  层 3：核心引擎层（Core Engine）                        │
│  query.ts 主循环 · QueryEngine · 工具执行               │
├─────────────────────────────────────────────────────┤
│  层 2：状态与服务层（State & Services）                  │
│  bootstrap/state.ts · services/ · hooks/             │
├─────────────────────────────────────────────────────┤
│  层 1：UI 层（Terminal UI）                             │
│  React + Ink 终端渲染 · 148 个 UI 组件                 │
└─────────────────────────────────────────────────────┘
```

每一层都只依赖下方的层，不会向上依赖（单向依赖原则）。

---

## 层 1：UI 层 — 用 React 渲染终端

**位置**：`src/components/`、`src/hooks/`、`src/ink.ts`

这是用户直接感知到的层。令人惊讶的是，Claude Code 用 **React + Ink** 来渲染终端界面。

```typescript
// src/components/REPL.tsx（简化示意）
function REPL() {
  const [messages, setMessages] = useState<Message[]>([])
  
  return (
    <Box flexDirection="column">
      {messages.map(msg => <MessageView key={msg.uuid} message={msg} />)}
      <PromptInput onSubmit={handleSubmit} />
    </Box>
  )
}
```

**为什么用 React？**

- **状态同步**：流式响应更新、工具进度、权限弹窗——全是状态变化，React 的响应式更新完美契合
- **组件复用**：`Spinner`、`PermissionRequest`、`ToolResult` 等 UI 元素可以独立开发和测试
- **事件驱动**：用户按键、工具完成、API 响应——都是事件，React 事件系统统一处理

---

## 层 2：状态与服务层 — 全局单例 + 功能服务

**位置**：`src/bootstrap/state.ts`、`src/services/`

### bootstrap/state.ts：全局状态中心

这是整个应用的"全局单例"，存储所有跨会话共享的状态：

```typescript
// src/bootstrap/state.ts（精简版，原文件 1759 行）
type State = {
  originalCwd: string           // 启动时的工作目录
  totalCostUSD: number          // 本次会话总费用
  modelUsage: ModelUsage        // 各模型 token 使用量
  kairosActive: boolean         // KAIROS 持久助手是否激活
  meter: Meter | null           // OpenTelemetry 指标 Meter
  sessionId: SessionId          // 当前会话 ID
  // ... 还有 100+ 个字段
}
```

> **注意**：文件注释里写着 `DO NOT ADD MORE STATE HERE - BE JUDICIOUS WITH GLOBAL STATE`，说明 Anthropic 的工程师也在努力控制全局状态的膨胀。

### services/ ：功能服务集合

| 服务 | 位置 | 职责 |
|------|------|------|
| API 服务 | `services/api/` | Claude API 调用、错误处理、重试 |
| MCP 客户端 | `services/mcp/` | MCP 协议通信 |
| 分析遥测 | `services/analytics/` | GrowthBook + OpenTelemetry |
| 上下文压缩 | `services/compact/` | 对话历史压缩算法 |
| OAuth 认证 | `services/oauth/` | 登录/令牌管理 |
| 工具执行 | `services/tools/` | 工具并发调度 |
| AutoDream | `services/autoDream/` | KAIROS 记忆整合 |

---

## 层 3：核心引擎层 — Agent 主循环

**位置**：`src/query.ts`、`src/QueryEngine.ts`

这是整个系统的心脏。

```
用户输入
   │
   ▼
QueryEngine.submitMessage()   ← 会话状态管理
   │
   ▼
query() → queryLoop()         ← Agent 主循环
   │
   ├── 构建 System Prompt
   ├── 调用 Claude API（流式）
   ├── 接收 Assistant Message
   │     ├── 纯文本 → 直接返回
   │     └── tool_use → 执行工具 → 把结果追加到消息 → 继续循环
   └── 直到 stop_reason = 'end_turn' 才退出循环
```

**关键设计**：`query.ts` 是一个 **async generator**，它持续 `yield` 消息流：

```typescript
export async function* query(params: QueryParams): AsyncGenerator<...> {
  yield* queryLoop(params, ...)
}
```

这让 UI 层可以实时消费每一个流式 token，而不必等待整个响应完成。

---

## 层 4：Agent 编排层 — 多 Agent 协作

**位置**：`src/coordinator/`、`src/tools/AgentTool/`、`src/assistant/`

当一个 Agent 不够用时，这一层负责协调多个 Agent：

```
KAIROS 模式：
   主 Claude → 后台持久运行 → 定期自动执行任务

Coordinator 模式：
   主 Claude（指挥官）
       ├── Worker Agent 1（并行执行任务 A）
       ├── Worker Agent 2（并行执行任务 B）
       └── Worker Agent 3（并行执行任务 C）

Fork 模式（FORK_SUBAGENT）：
   主 Claude → 分叉出子 Claude → 子 Claude 执行 → 结果汇总
```

---

## 层 5：网络层 — 远程连接

**位置**：`src/bridge/`、`src/services/mcp/`

### Bridge：双向远程控制通道

```
claude.ai 网页 / 手机 App
         │
    WebSocket / SSE
         │
   本地 CLI 进程
```

Bridge 系统让用户可以从任何地方控制本地运行的 Claude Code。

### MCP：工具的扩展协议

```
Claude Code
    │
    ├── 内置工具（BashTool、FileEditTool...）
    └── MCP 服务器（通过 MCP 协议扩展的外部工具）
              ├── 本地 MCP 服务器（stdio）
              └── 远程 MCP 服务器（HTTP/SSE）
```

---

## 层 6：功能门控层 — 代码可见性控制

**位置**：`bun:bundle`（编译时）、`bootstrap/state.ts`（运行时）、`services/analytics/growthbook.ts`（远程）

这是贯穿所有其他层的"横切关注点"：

```typescript
// 编译时门控
const coordinator = feature('COORDINATOR_MODE')
  ? require('./coordinator/coordinatorMode.js')
  : null

// 运行时门控
if (process.env.USER_TYPE === 'ant') {
  // 内部功能
}

// 远程门控
const isEnabled = getFeatureValue_CACHED_MAY_BE_STALE('tengu_kairos')
```

外部用户看到的是经过三层过滤后的精简版本。

---

## 数据流总览

```
[用户键入]
   ↓ Ink 事件
[React 状态更新] → setMessages()
   ↓
[QueryEngine.submitMessage()] → 获取 SystemPrompt、工具列表
   ↓
[query() / queryLoop()] → 构造 API 请求
   ↓
[Claude API] → 流式响应
   ↓
[tool_use 判断] → 工具执行 → 结果追加 → 继续循环
   ↓
[end_turn] → 最终响应
   ↓
[Ink 渲染] → 终端显示
   ↓
[sessionStorage] → 持久化到磁盘
```

---

## 下一步

- [2.2 三层功能门控系统](./02-feature-gates.md) — 深入理解开关机制
- [2.3 全局状态管理](./03-global-state.md) — bootstrap/state.ts 详解
- [第三章：核心引擎](../ch03-core-engine/01-conversation-lifecycle.md) — 深入 query.ts 主循环
