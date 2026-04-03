# 5.2 Coordinator：多 Agent 编排模式

> **源码位置**：`src/coordinator/coordinatorMode.ts`（370 行）
> **编译开关**：`feature('COORDINATOR_MODE')`
> **环境变量**：`CLAUDE_CODE_COORDINATOR_MODE`

---

## 一句话理解

Coordinator 模式将一个 Claude 变成"指挥官"，把任务分发给多个 Worker Claude 并行执行。

```
普通模式:
  用户 → Claude → 直接做任务（一个人干所有活）

Coordinator 模式:
  用户 → Coordinator Claude（只规划、只指挥）
               ├── Worker 1（并行：研究代码库）
               ├── Worker 2（并行：实施 A 模块）
               └── Worker 3（并行：实施 B 模块）
```

---

## 角色分工

| 角色 | 职责 | 可用工具 |
|------|------|---------|
| **Coordinator** | 理解目标、拆解任务、综合结果、与用户沟通 | Agent（派任务）、SendMessage（跟进）、TaskStop（终止）|
| **Worker** | 具体代码操作（读文件、写代码、执行命令） | 完整工具集（BashTool、FileEditTool 等）|

**Coordinator 不直接操作代码**——它就是一个纯粹的指挥官。

---

## 激活方式

```typescript
// src/coordinator/coordinatorMode.ts
export function isCoordinatorMode(): boolean {
  if (feature('COORDINATOR_MODE')) {
    return isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE)
  }
  return false
}
```

启动方式：

```bash
CLAUDE_CODE_COORDINATOR_MODE=1 claude
```

---

## Coordinator System Prompt 的核心规则

`getCoordinatorSystemPrompt()` 返回一个约 400 行的系统提示，其中有几条绝对铁律：

### 1. 不允许甩锅式委派

```
DO NOT: delegate research without giving the worker full context
DO NOT: write "based on your findings" — you must synthesize first, THEN instruct
DO: tell workers exactly which files to change, at which lines, doing what
```

这是最重要的规则。Coordinator 必须先综合分析 Worker 的发现，**然后**给出精确的实施指令——不能让 Worker 自己去搞清楚该做什么。

### 2. Worker 不可以知道对方的存在

```
Workers cannot see the Coordinator's conversation.
Each prompt must be fully self-contained.
```

每个 Worker 的 Prompt 必须包含所有必要的上下文，因为 Worker 看不到 Coordinator 和其他 Worker 的对话。

### 3. 不要预测 Worker 的结果

```
After launching agents, briefly tell the user what you launched and end your response.
Never fabricate or predict agent results in any format.
Results arrive as separate messages.
```

---

## Worker 结果的通信机制

Worker 完成任务后，结果以 XML 格式注入回 Coordinator 的对话流：

```xml
<task-notification>
  <task-id>{agentId}</task-id>
  <status>completed</status>
  <summary>Worker 的一句话状态摘要</summary>
  <result>Worker 的完整最终响应文本</result>
  <usage>
    <total_tokens>15420</total_tokens>
  </usage>
</task-notification>
```

这些消息对用户不可见，只传给 Coordinator Claude 用于综合分析。

---

## 标准任务流（四阶段）

```
阶段 1: Research（研究）
  └── 多个 Worker 并行
  └── 调查代码库、查找文件、理解问题

阶段 2: Synthesis（综合）
  └── Coordinator 自己完成
  └── 阅读所有发现，写出精确的实施规格

阶段 3: Implementation（实施）
  └── 多个 Worker（按文件分区）
  └── 按规格做精准代码修改

阶段 4: Verification（验证）
  └── Worker
  └── 运行测试，确认改动正确
```

---

## Continue vs Spawn 决策

Coordinator 需要决定是继续现有 Worker（`SendMessage`）还是创建新 Worker（`Agent`）：

| 场景 | 建议 | 原因 |
|------|------|------|
| 研究的文件就是要修改的文件 | `SendMessage` 继续 | 避免重新加载上下文 |
| 研究范围广，实施范围窄 | `Agent` 新建 | 避免锚定于不相关发现 |
| 修正失败或扩展近期工作 | `SendMessage` 继续 | 利用已有上下文 |
| 验证另一 Worker 刚写的代码 | `Agent` 新建 | 保持独立视角 |
| 第一次方案完全错误 | `Agent` 新建 | 避免锚定效应 |

---

## Scratchpad：跨 Worker 共享知识

当 GrowthBook `tengu_scratch` 开启时，Coordinator 可以告知 Worker 一个共享目录：

```typescript
// src/coordinator/coordinatorMode.ts
if (scratchpadDir && isScratchpadGateEnabled()) {
  content += `\n\nScratchpad directory: ${scratchpadDir}\n` +
    `Workers can read and write here without permission prompts.` +
    `Use this for durable cross-worker knowledge.`
}
```

Worker 可以自由读写这个目录，用于跨 Worker 的持久化知识共享（例如，Research Worker 把发现写到 scratchpad，Implementation Worker 从中读取）。

---

## Simple 模式

```bash
CLAUDE_CODE_SIMPLE=1 CLAUDE_CODE_COORDINATOR_MODE=1 claude
```

简单模式下 Worker 工具集大幅缩减：

```typescript
const workerTools = isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)
  ? [BASH_TOOL_NAME, FILE_READ_TOOL_NAME, FILE_EDIT_TOOL_NAME]  // 3 个工具
  : Array.from(ASYNC_AGENT_ALLOWED_TOOLS)  // 完整工具集
```

---

## 会话恢复的模式对齐

当恢复一个历史 Coordinator 会话时，`matchSessionMode()` 确保模式一致：

```typescript
// 如果历史会话是 coordinator 模式，但当前不是
// 自动将环境变量翻转为 coordinator 模式
if (sessionIsCoordinator && !currentIsCoordinator) {
  process.env.CLAUDE_CODE_COORDINATOR_MODE = '1'
}
```

---

## 下一步

- [5.3 Bridge：远程控制](./03-bridge.md) — 从 claude.ai 远程操控本地 CLI
- [5.4 BUDDY：AI 电子宠物](./04-buddy.md) — 确定性生成算法详解
