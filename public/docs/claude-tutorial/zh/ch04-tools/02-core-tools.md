# 4.2 核心工具详解：Bash / FileEdit / AgentTool

> **章节目标**：深入分析三个最核心工具的实现逻辑，理解工具设计的最佳实践。

---

## BashTool — 危险能力的安全封装

**位置**：`src/tools/BashTool/BashTool.ts`

BashTool 是 Claude Code 中最强大也最危险的工具，允许执行任意 shell 命令。

### 关键设计决策：无持久 shell

每次 BashTool 调用都是独立的 shell 进程。这意味着 `cd /tmp` 只影响当次调用的进程，下次调用时仍在原始目录。

Claude Code 用 `src/utils/cwd.ts` 的 `setCwd()`/`getCwd()` 全局函数追踪一个"虚拟工作目录"：

```typescript
// 执行 cd 命令时更新虚拟 cwd
if (command.match(/^cd\s+(.+)/)) {
  const newDir = resolveDir(match[1], getCwd())
  setCwd(newDir)  // 更新全局虚拟 cwd
}
```

后续工具调用（包括 FileReadTool 等）都从 `getCwd()` 读取当前目录，保持一致性。

### 超时与输出控制

```typescript
const DEFAULT_TIMEOUT_MS = 120_000  // 2 分钟默认
const MAX_TIMEOUT_MS = 600_000      // 10 分钟上限
const MAX_OUTPUT_BYTES = 1_000_000  // 1MB 输出上限
const CONTENT_SNIP_THRESHOLD = 500_000

// 超过 500KB 时：保留前 250KB + "...(truncated)..." + 后 250KB
```

**为什么保留两端而不是只保留开头？**

因为命令执行结果通常有两个关键信息点：
- **开头**：命令是否启动、有无报错
- **结尾**：执行是否成功、最终状态是什么

截断中间部分损失最小。

### 输出清洗

```typescript
// 去掉 ANSI 颜色/控制码，避免 Claude 处理非预期字符
const cleaned = stripAnsi(rawOutput)

// 检测并拒绝二进制输出
if (isBinary(rawOutput)) {
  return '(This command produced binary output which cannot be displayed.)'
}
```

---

## FileEditTool — 精确编辑的哲学

**位置**：`src/tools/FileEditTool/FileEditTool.ts`（工具名：`str_replace_based_edit`）

### 为什么不用"写整个文件"？

| 对比 | FileWriteTool（全量写入）| FileEditTool（str-replace）|
|------|---------------------|---------------------|
| 输出大小 | 输出整个文件 | 只输出修改片段 |
| token 消耗 | 高 | 低 |
| 丢失内容风险 | 有（Claude 没看到的部分可能丢） | 无（精确替换） |
| 适用场景 | 创建新文件 | 修改已有文件 |

### str-replace 机制

```typescript
// Claude 的调用格式
{
  "tool_use": {
    "name": "str_replace_based_edit",
    "input": {
      "path": "src/auth/login.ts",
      "old_string": "function login(user, pass) {\n  return check(user, pass)\n}",
      "new_string": "function login(user: string, pass: string): Promise<boolean> {\n  return checkAsync(user, pass)\n}"
    }
  }
}
```

实现时的关键细节：

```typescript
// 精确替换，不模糊匹配
const newContent = content.replace(old_string, new_string)

// 如果找不到 old_string，返回错误让 Claude 重新尝试
if (newContent === content) {
  throw new Error(`The provided old_string was not found in the file. 
  Check for whitespace, indentation, or line ending differences.`)
}
```

### FileEdit 的 diff 追踪

每次 FileEdit 成功后，系统会更新 `readFileState`（文件状态缓存）：

```typescript
// 追踪文件修改历史，用于：
// 1. 检测并发修改冲突
// 2. COMMIT_ATTRIBUTION 功能：记录每个 git commit 中 Claude 修改了哪些行
toolUseContext.readFileState.set(path, { content: newContent, hash })
```

---

## AgentTool — 递归 Claude

**位置**：`src/tools/AgentTool/AgentTool.ts`

AgentTool 允许 Claude 启动另一个 Claude 实例来执行子任务，是整个 Coordinator 模式的基础。

### 关键参数

```typescript
// Claude 调用 AgentTool 的格式
{
  "name": "Task",
  "input": {
    "description": "实现用户认证模块",
    "prompt": "请实现一个 JWT 认证中间件...",
    "tools": ["Bash", "str_replace_based_edit", "FileRead"],  // 可选，限制子 Agent 的工具
    "model": undefined  // 不设置模型，使用默认
  }
}
```

注意 Coordinator 的系统提示明确写道：

> **Do not set the model parameter.** Workers need the default model for the substantive tasks you delegate.

### 独立子进程 vs 同进程 goroutine

AgentTool 有两种执行模式（基于 GrowthBook 门控）：

```
模式 A（默认）：同进程 async
  子 Agent 在父进程的 async context 中运行
  共享进程内存，通过 abort signal 传递中断
  
模式 B（BG_SESSIONS 开关）：独立子进程
  用 IPC 消息传递通信
  父进程崩溃不影响子进程（持久化后台任务）
```

### 工具白名单：Agent 被允许的工具

```typescript
// src/constants/tools.ts
export const ASYNC_AGENT_ALLOWED_TOOLS = new Set([
  'Bash',
  'str_replace_based_edit',
  'Read',
  'Write',
  'Glob',
  'Grep',
  'WebSearch',
  'WebFetch',
  'Task',       // 子 Agent 可以再生成孙 Agent（但有递归深度限制）
  'TodoWrite',
  'Skill',
  // ...
])
```

**Coordinator 模式的专属工具**（非 Coordinator 下不可用）：

```typescript
const INTERNAL_WORKER_TOOLS = new Set([
  'team_create',      // 创建 Worker 团队
  'team_delete',      // 解散 Worker 团队
  'send_message',     // 向特定 Worker 发消息
  'synthetic_output', // 结构化输出（Agent SDK 专用）
])
```

### 递归深度保护

```typescript
// src/tools/AgentTool/AgentTool.ts
const MAX_AGENT_DEPTH = 5  // 防止无限递归

// 通过 ToolUseContext 传递当前深度
const currentDepth = toolUseContext.queryTracking?.depth ?? 0
if (currentDepth >= MAX_AGENT_DEPTH) {
  throw new Error(`Maximum agent depth (${MAX_AGENT_DEPTH}) exceeded.`)
}
```

---

## 工具结果的大小控制

所有工具的返回结果都受"工具结果预算"（Tool Result Budget）控制：

```typescript
// src/utils/toolResultStorage.ts
// feature('TOKEN_BUDGET') 控制
const MAX_TOOL_RESULT_TOKENS = 25_000  // 单个工具结果最大 token 数

// 超过限制时：
// 1. 把结果存到本地文件系统
// 2. 在响应中用引用替代完整内容
// 3. 后续需要时按需读取
```

这避免了单个大文件读取直接"爆炸"整个上下文窗口。

---

## 下一步

- [4.3 权限系统：canUseTool 决策链](./03-permission-system.md) — 权限判断的完整流程
- [4.4 MCP 协议：工具的扩展边界](./04-mcp-tools.md) — MCP 工具如何工作
