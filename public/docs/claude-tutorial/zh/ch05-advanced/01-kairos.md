# 5.1 KAIROS：永不关机的持久 AI 助手

> **源码位置**：`src/assistant/`、`src/proactive/`、`src/services/autoDream/`
> **编译开关**：`feature('KAIROS')`
> **远程开关**：GrowthBook `tengu_kairos`

---

## 一句话理解 KAIROS

KAIROS 把 Claude Code 从一个"对话工具"变成了一个"长期驻留的 AI 同事"：

- 关掉终端，Claude 依然在后台运行
- 自动写每日工作日志
- 每 24 小时自动"做梦"整合记忆
- 没有人说话时，主动找活干

名字来自希腊语中"恰当时机"的含义。

---

## 激活方式

KAIROS 通过严格的五层检查才会激活：

```
1. feature('KAIROS') = true           ← 编译时 flag（外部版永远 false）
        ↓
2. settings.json: assistant: true     ← 用户在配置中显式开启
        ↓
3. 目录信任检查                         ← 防止恶意仓库劫持持久助手
        ↓
4. GrowthBook: tengu_kairos = true    ← Anthropic 远程开关
        ↓
5. setKairosActive(true)              ← 写入全局状态，激活
```

`--assistant` CLI 参数可跳过第 4 步（供 Agent SDK daemon 模式使用）。

---

## 持久运行的实现机制

### 正常 Claude Code：一次性会话

```
启动 → 等待输入 → 处理 → 输出 → 退出
```

### KAIROS Claude：持久循环

```
启动 → KAIROS 激活
    → 主循环不退出，转为监听模式
    → 后台持久进程（通过 cron scheduler）
    → 定期 tick 检查（Proactive 模式）
    → 每天写日志
    → 自动触发 Dream 记忆整合
```

关键状态：`src/bootstrap/state.ts` 里的 `kairosActive: boolean`。当这个值为 `true` 时，主循环行为改变。

---

## 每日日志系统

KAIROS 会自动在以下路径写每日日志：

```
<autoMemPath>/logs/YYYY/MM/YYYY-MM-DD.md
```

例如：
```
~/.claude/memory/logs/2026/04/2026-04-02.md
```

日志内容由 KAIROS 自动生成，记录当天的工作摘要、重要发现等。

---

## 做梦（Dream）机制

Dream 是 KAIROS 最精巧的子系统——后台运行的子 Agent，把散乱的会话记录整合成结构化的长期记忆。

### 触发条件（三层递进检查）

```typescript
// src/services/autoDream/autoDream.ts
function shouldDream(state: DreamState): boolean {
  // 第一层：时间门控（最便宜，先检查）
  if (hoursSinceLastDream(state) < minHours) return false
  
  // 第二层：会话数门控
  if (newSessionCount(state) < minSessions) return false
  
  // 第三层：锁门控（防止多进程同时做梦）
  if (!acquireDreamLock()) return false
  
  return true
}
```

`minHours`（默认 24）和 `minSessions`（默认 5）通过 GrowthBook `tengu_onyx_plover` 远程调整。

### 四阶段整合流程

```
┌──────────────────────────────────────┐
│ 阶段 1: Orient（定向）               │
│   · 列出记忆目录                      │
│   · 读取 MEMORY.md 索引              │
│   · 浏览已有主题文件列表              │
├──────────────────────────────────────┤
│ 阶段 2: Gather（收集）               │
│   · 读取每日日志（新的部分）           │
│   · 读取已有记忆主题文件              │
│   · 读取 JSONL 对话记录（新的 turns） │
├──────────────────────────────────────┤
│ 阶段 3: Consolidate（整合）          │
│   · 合并新信号到主题文件              │
│   · 转换相对日期为绝对日期            │
│   · 删除过时或不再准确的事实          │
├──────────────────────────────────────┤
│ 阶段 4: Prune（修剪）               │
│   · 更新 MEMORY.md 索引             │
│   · 保持文件大小在限制内              │
└──────────────────────────────────────┘
```

### 锁机制（防止并发）

`src/services/autoDream/consolidationLock.ts` 用文件锁防止多个进程同时做梦：

```
.consolidate-lock 文件：
  - 文件存在 = 有进程在做梦
  - 文件内容 = 持有者 PID
  - 文件 mtime = lastConsolidatedAt 时间戳
  - double-write + re-read 验证防竞争条件
  - PID 存活检查（1 小时超时后可抢锁）
```

---

## 主动模式（Proactive Mode）

没人说话时，Claude 自己找活干。

```typescript
// src/proactive/index.ts
// 三个状态
type ProactiveState = {
  active: boolean         // 是否启动
  paused: boolean         // 用户按 Esc 暂停（下次输入恢复）
  contextBlocked: boolean // API 错误时阻塞（防止 tick-error 死循环）
}
```

激活方式：
- `--proactive` CLI 参数
- `CLAUDE_CODE_PROACTIVE` 环境变量

激活后的 System Prompt 追加：
```
# Proactive Mode
You are in proactive mode. Take initiative -- explore, act, and make progress
without waiting for instructions.
You will receive periodic <tick> prompts. Do whatever seems most useful,
or call Sleep if there's nothing to do.
```

### SleepTool：主动模式的"打盹"工具

```typescript
// feature('PROACTIVE') || feature('KAIROS') 才有 SleepTool
const SleepTool = feature('PROACTIVE') || feature('KAIROS')
  ? require('./tools/SleepTool/SleepTool.js').SleepTool
  : null
```

当没有事情可做时，Claude 调用 `SleepTool` 进入等待状态，避免不必要的 tick 消耗。

---

## 后台任务（Cron 调度）

`src/utils/cronScheduler.ts` 实现了完整的任务调度系统：

```
调度器每 1 秒 tick 一次
   ↓
检查 .claude/scheduled_tasks.json
   ↓
触发到期任务 → 执行 → 更新下次触发时间
```

任务类型：

| 类型 | 说明 |
|------|------|
| 一次性 | 执行后自动删除 |
| 循环 | 执行后重新调度，默认 7 天过期 |
| **永久**（`permanent: true`） | 不受 7 天过期限制，KAIROS 专用 |
| 会话级（`durable: false`） | 只在内存中，进程退出即消失 |

KAIROS 的三个核心永久任务：
- `catch-up`：恢复被中断的工作
- `morning-checkin`：每日早间签到
- `dream`：自动记忆整合

---

## UI 体现

KAIROS 激活时在终端 UI 上有特殊表现：
- Footer 显示 **"dreaming"** pill 标签
- `Shift+Down` 打开后台任务详情对话框（`DreamDetailDialog.tsx`）
- 查看实时进度和手动中止 Dream

---

## 下一步

- [5.2 Coordinator：多 Agent 编排模式](./02-coordinator.md)
- [5.3 Bridge：远程控制](./03-bridge.md)
