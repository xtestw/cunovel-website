# 2.3 全局状态管理：bootstrap/state.ts 解析

> **章节目标**：理解 Claude Code 如何用一个中心化的 State 对象管理全局状态，以及为什么这样设计。

---

## 文件概览

`src/bootstrap/state.ts` 是整个应用的"中枢神经系统"，1759 行代码，管理着运行时所有需要跨模块共享的状态。

文件顶部有一条非常有意思的注释：

```typescript
// DO NOT ADD MORE STATE HERE - BE JUDICIOUS WITH GLOBAL STATE
```

这说明即使在 Anthropic 内部，全局状态的膨胀也是一个需要持续警惕的问题。

---

## State 类型结构

```typescript
type State = {
  // ── 运行环境 ──
  originalCwd: string          // 启动时的工作目录（不变）
  projectRoot: string          // 项目根目录
  cwd: string                  // 当前工作目录（可能变化）
  isInteractive: boolean       // 是否交互模式（REPL vs headless）

  // ── AI 模型 ──
  mainLoopModelOverride: ModelSetting | undefined  // 用户手动切换的模型
  initialMainLoopModel: ModelSetting              // 启动时的模型

  // ── 成本与用量 ──
  totalCostUSD: number          // 本次会话总费用
  totalAPIDuration: number      // 累计 API 耗时（含重试）
  modelUsage: { [modelName: string]: ModelUsage }  // 按模型统计 token 用量

  // ── 遥测 ──
  meter: Meter | null           // OpenTelemetry 指标 Meter
  sessionId: SessionId          // 当前会话唯一 ID
  sessionCounter: AttributedCounter | null
  costCounter: AttributedCounter | null
  tokenCounter: AttributedCounter | null
  // ...更多 OTel 计数器

  // ── 功能开关状态 ──
  kairosActive: boolean         // KAIROS 是否激活

  // ── 安全与权限 ──
  strictToolResultPairing: boolean  // 严格工具结果配对（HFI 模式）

  // ...共约 60+ 个字段
}
```

---

## 单例模式实现

State 是一个模块级变量，通过 getter/setter 函数对外暴露：

```typescript
// 模块内私有状态
let state: State = {
  originalCwd: realpathSync(cwd()),
  // ...初始值
}

// 公开的读取函数
export function getOriginalCwd(): string {
  return state.originalCwd
}

export function getTotalCost(): number {
  return state.totalCostUSD
}

// 公开的修改函数
export function setKairosActive(active: boolean): void {
  state = { ...state, kairosActive: active }
}

export function incrementTotalCost(delta: number): void {
  state = { ...state, totalCostUSD: state.totalCostUSD + delta }
}
```

**为什么用函数封装而不是直接导出对象？**

1. **不可变更新**：每次修改都返回新对象（`state = { ...state, ... }`），便于追踪状态变化
2. **访问控制**：可以在 getter/setter 中添加日志、验证等逻辑
3. **类型安全**：TypeScript 可以对每个字段独立进行类型检查

---

## 关键状态详解

### 会话 ID（SessionId）

```typescript
export function getSessionId(): SessionId {
  return state.sessionId
}
```

SessionId 贯穿整个系统：
- 用于遥测事件关联（所有 OTel span 都带 sessionId）
- 用于会话历史文件的命名
- 用于跨进程的 Bridge 通信标识

### 模型用量追踪（modelUsage）

```typescript
type ModelUsage = {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
}
```

系统对每个模型（如 `claude-opus-4-5`, `claude-sonnet-4-5`）分别统计，支持多模型混合使用场景（如 Coordinator 中 Coordinator 用 Opus，Worker 用 Sonnet）。

### KAIROS 激活状态

```typescript
kairosActive: boolean  // 默认 false
```

这个字段控制持久助手模式的行为分支。当 `kairosActive = true` 时：
- 主循环不退出，等待下一个用户输入
- 开启 Dream 记忆整合调度
- 启用 Proactive tick 机制

---

## 初始化流程

State 在模块加载时初始化（ESM 模块顶层代码）：

```typescript
let state: State = {
  originalCwd: realpathSync(cwd()),  // 真实路径（解析符号链接）
  projectRoot: realpathSync(cwd()),
  startTime: Date.now(),
  lastInteractionTime: Date.now(),
  sessionId: randomUUID() as SessionId,
  kairosActive: false,
  isInteractive: false,
  // ...其他默认值
}
```

注意 `realpathSync(cwd())`——这里刻意解析符号链接，确保路径的稳定性（避免符号链接路径和真实路径判断不一致的权限 bug）。

---

## 与 React AppState 的关系

```
bootstrap/state.ts (全局单例)    ←→    AppState (React 状态)
     │                                       │
     │ 通过 getXxx()/setXxx() 访问            │ 通过 useState/useContext 访问
     │                                       │
     │ 适合：跨模块共享、不需要触发 UI 刷新      │ 适合：UI 状态、需要触发重渲染
     │ 例如：sessionId、totalCost             │ 例如：消息列表、模态框状态
```

设计原则：**需要触发 UI 重渲染的状态在 React AppState，不需要的在 bootstrap/state**。

---

## 下一步

- [2.4 UI 层：React + Ink 终端渲染](./04-ink-tui.md)
- [第三章：核心引擎](../ch03-core-engine/01-conversation-lifecycle.md) — 深入主循环
