# 4.1 Tool 抽象：一个工具是什么

> **章节目标**：理解 Claude Code 的工具抽象设计，掌握 `Tool` 类型的核心字段和工作机制。

---

## 工具的本质

在 Claude Code 里，工具（Tool）是 Claude 与外部世界交互的**唯一接口**。

当 Claude 想做任何"真实的事"——读文件、写代码、执行命令——都必须通过工具。这个设计来自 Anthropic 的 Tool Use API。

---

## Tool 类型定义

`src/Tool.ts` 定义了工具的核心类型（793 行）：

```typescript
// 一个工具的完整类型定义
export type Tool<
  TInput extends object = object,
  TOutput = unknown,
  TProgress = unknown,
> = {
  // ── 基本信息 ──
  name: string                // 工具名（如 'Bash', 'str_replace_based_edit'）
  description: () => string   // 工具描述（返回函数，支持动态内容）
  inputSchema: JSONSchema     // 输入参数的 JSON Schema（发给 API 描述工具用途）
  
  // ── 执行 ──
  call: (
    input: TInput,
    context: ToolUseContext,
  ) => Promise<TOutput>       // 工具的实际执行逻辑
  
  // ── 权限 ──
  checkPermissions?: (
    input: TInput,
    context: ToolPermissionContext,
  ) => PermissionResult       // 同步权限预检查（快速判断）
  
  isReadOnly?: () => boolean  // 是否只读（只读工具默认允许）
  isSensitive?: () => boolean // 是否敏感（需要更严格权限）
  
  // ── UI 渲染 ──
  renderToolUse?: (           // 工具执行中的进度显示
    input: TInput,
    progress: TProgress,
  ) => React.ReactNode
  
  renderToolResult?: (        // 工具完成后的结果显示
    input: TInput,
    output: TOutput,
  ) => React.ReactNode
  
  // ── 提示注入 ──
  prompt?: () => string       // 额外注入到 System Prompt 的工具说明
  
  // ── 元数据 ──
  isEnabled?: () => boolean   // 工具是否启用（动态判断）
  isHidden?: () => boolean    // 是否在 /help 中隐藏
  type?: 'prompt'             // 特殊类型标记
  
  // 更多字段...
}
```

---

## 关键设计：函数而非值

注意到很多字段是**函数**而不是直接的值：

```typescript
description: () => string    // 函数，不是 string
isEnabled: () => boolean     // 函数，不是 boolean
prompt: () => string         // 函数，不是 string
```

为什么？因为这些值可能**在运行时动态变化**：

```typescript
// 示例：BashTool 的 description 可能根据 powerShell 配置变化
const BashTool: Tool = {
  name: 'Bash',
  description: () => {
    const isWindows = process.platform === 'win32'
    return isWindows 
      ? 'Run PowerShell commands...' 
      : 'Run bash commands...'
  },
  // ...
}
```

函数形式确保每次调用时获取最新状态。

---

## ToolUseContext：工具的"执行环境"

每个工具的 `call` 方法都接收一个 `ToolUseContext`，它包含了工具执行所需的一切：

```typescript
export type ToolUseContext = {
  // 配置
  options: {
    commands: Command[]
    tools: Tools
    mcpClients: MCPServerConnection[]
    debug: boolean
    verbose: boolean
    mainLoopModel: string
    // ...
  }
  
  // 状态管理
  abortController: AbortController  // 中断信号
  readFileState: FileStateCache      // 文件状态缓存（用于 diff）
  getAppState(): AppState            // 读取 React 状态
  setAppState(f: ...): void          // 更新 React 状态
  
  // UI 回调
  setToolJSX?: SetToolJSXFn          // 设置工具的 UI 渲染
  addNotification?: (n: Notification) => void
  appendSystemMessage?: (msg: ...) => void
  
  // 权限
  messages: Message[]                // 当前对话历史（权限判断用）
  
  // 子 Agent 特定
  agentId?: AgentId                  // 子 Agent 的 ID
  agentType?: string                 // 子 Agent 类型
}
```

ToolUseContext 是一个**依赖注入容器**——工具不直接访问全局状态，而是通过注入的 Context 访问所需资源。这让工具在测试中很容易 mock。

---

## 工具注册：tools.ts

`src/tools.ts` 是所有工具的注册中心，构建工具列表：

```typescript
// src/tools.ts（精简版）
import { AgentTool } from './tools/AgentTool/AgentTool.js'
import { BashTool } from './tools/BashTool/BashTool.js'
import { FileEditTool } from './tools/FileEditTool/FileEditTool.js'
// ... 更多 import

// 有条件的工具（基于 feature 开关 / USER_TYPE）
const REPLTool = process.env.USER_TYPE === 'ant'
  ? require('./tools/REPLTool/REPLTool.js').REPLTool
  : null

const SleepTool = feature('PROACTIVE') || feature('KAIROS')
  ? require('./tools/SleepTool/SleepTool.js').SleepTool
  : null

// 最终导出的工具列表
export function getAllTools(): Tool[] {
  return [
    AgentTool, BashTool, FileEditTool, FileReadTool, FileWriteTool,
    GlobTool, GrepTool, WebSearchTool, TodoWriteTool,
    ...(REPLTool ? [REPLTool] : []),
    ...(SleepTool ? [SleepTool] : []),
    // ...
  ].filter(Boolean)
}
```

---

## 工具的分类

Claude Code 的工具按功能分为五类：

### 1. 文件系统工具（只读）
```
FileReadTool   - 读取文件内容
GlobTool       - 文件路径匹配
GrepTool       - 文件内容搜索
```

### 2. 文件系统工具（写入）
```
FileEditTool   - str-replace 方式精确编辑（推荐）
FileWriteTool  - 全量写入（覆盖整个文件）
NotebookEditTool - Jupyter Notebook 编辑
```

### 3. 执行工具
```
BashTool        - 执行 shell 命令
PowerShellTool  - Windows PowerShell（Windows 专用）
```

### 4. Agent/Task 工具
```
AgentTool       - 启动子 Agent（递归 Claude 实例）
TaskCreateTool  - 创建后台任务
TaskGetTool     - 获取任务状态
TaskUpdateTool  - 更新任务
TaskListTool    - 列出所有任务
TaskStopTool    - 停止任务（Coordinator 专用）
SleepTool       - 等待（KAIROS/Proactive 专用）
```

### 5. 网络/外部工具
```
WebSearchTool   - 搜索网页
WebFetchTool    - 抓取网页内容
WebBrowserTool  - 完整浏览器操作
```

### 6. MCP 协议工具
```
MCPTool         - 动态生成的 MCP 工具代理
ListMcpResourcesTool  - 列出 MCP 资源
ReadMcpResourceTool   - 读取 MCP 资源
```

---

## 下一步

- [4.2 核心工具详解](./02-core-tools.md) — Bash/FileEdit/AgentTool 源码分析
- [4.3 权限系统](./03-permission-system.md) — canUseTool 决策链
