# 1.3 源码地图：1,987 个文件怎么看

> **章节目标**：建立源码目录结构的心理地图，知道"找什么功能去哪个目录"。

---

## 全局结构

```
ClaudeCode/
├── src/           ← 核心源码（1,987 个 .ts/.tsx 文件）
├── docs/          ← 分析文档（你正在看的这套教程）
├── shims/         ← 原生模块的 JS 替代
├── vendor/        ← C++/Rust 原生绑定源码
├── package.json   ← 依赖声明
└── tsconfig.json  ← TypeScript 配置
```

---

## src/ 目录详解

### 🚪 入口文件（从这里开始读）

```
src/
├── dev-entry.ts      ← 开发模式入口，初始化 MACRO 常量
├── main.tsx          ← 主入口（785 KB！）React 根组件 + 全部 REPL 逻辑
└── query.ts          ← 主循环（67 KB），Agent 核心
```

> **提示**：`main.tsx` 有 785 KB，不要试图通读它。先看 `query.ts` 理解核心逻辑。

---

### 🔧 工具系统

```
src/tools/           ← 每个工具一个子目录
├── BashTool/        ← 执行 shell 命令
├── FileReadTool/    ← 读文件
├── FileEditTool/    ← 编辑文件（str-replace 方式）
├── FileWriteTool/   ← 写文件（全量覆盖）
├── GlobTool/        ← 文件路径匹配
├── GrepTool/        ← 文件内容搜索
├── AgentTool/       ← 递归启动子 Agent
├── WebSearchTool/   ← 网页搜索
├── WebFetchTool/    ← 抓取网页内容
├── MCPTool/         ← MCP 协议动态工具
├── TodoWriteTool/   ← 任务清单管理
└── ...（共 53 个）

src/Tool.ts          ← Tool 抽象基类型定义（28 KB）
src/tools.ts         ← 工具注册表，把所有工具组装在一起
```

---

### 💬 命令系统

```
src/commands/        ← 87 个斜杠命令，每个一个子目录
├── help/            ← /help
├── clear/           ← /clear
├── compact/         ← /compact（手动压缩上下文）
├── memory/          ← /memory
├── model/           ← /model（切换模型）
├── mcp/             ← /mcp（MCP 服务管理）
├── config/          ← /config
├── plan/            ← /plan（计划模式）
└── ...

src/commands.ts      ← 命令注册中心（24 KB）
```

---

### 🏗️ 状态管理

```
src/bootstrap/
└── state.ts         ← 全局单例状态（54 KB）
                       包含：模型、成本、会话 ID、遥测 Meter...

src/state/
└── AppState.ts      ← React 应用状态类型定义

src/context/         ← React Context 定义
src/hooks/           ← 87 个自定义 Hooks（状态、权限、UI 等）
```

---

### 🎨 UI 组件

```
src/components/      ← 148 个 Ink/React 终端组件
├── REPL.tsx         ← 主对话界面
├── Spinner.tsx      ← 加载动画
├── PermissionRequest.tsx ← 权限确认弹窗
├── MessageSelector.tsx   ← 消息选择器
└── ...

src/ink.ts           ← Ink 渲染引擎封装
src/outputStyles/    ← 输出样式系统
```

---

### 🤖 高级功能模块

```
src/assistant/       ← KAIROS 持久助手模式
├── index.ts
└── sessionHistory.ts

src/coordinator/     ← 多 Agent 编排
└── coordinatorMode.ts

src/bridge/          ← 远程控制（33 个文件）
├── replBridge.ts    ← REPL 端桥接主文件（98 KB）
├── remoteBridgeCore.ts ← 远程端核心
└── ...

src/proactive/       ← 主动模式（无人时自主运行）
src/buddy/           ← AI 电子宠物
src/voice/           ← 语音交互
src/vim/             ← Vim 键位模式
```

---

### 🔌 服务层

```
src/services/
├── api/             ← Claude API 客户端封装
│   ├── claude.ts    ← API 调用核心
│   └── errors.ts    ← 错误类型
├── mcp/             ← MCP 协议客户端
├── analytics/       ← 事件追踪（GrowthBook + 自定义）
├── compact/         ← 上下文压缩算法
├── oauth/           ← OAuth 认证
├── autoDream/       ← KAIROS 记忆整合
└── tools/           ← 工具执行基础设施
    └── toolOrchestration.ts ← 工具并发调度
```

---

### 🛠️ 工具函数

```
src/utils/           ← 大量工具函数
├── config.ts        ← 配置文件读写
├── git.ts           ← Git 操作封装
├── permissions/     ← 权限判断逻辑
├── messages.ts      ← 消息格式化
├── model/           ← 模型选择逻辑
├── claudemd.ts      ← CLAUDE.md 文件处理
├── cwd.ts           ← 工作目录管理
└── ...（数十个文件）
```

---

## 如何高效阅读这份源码

### 方法一：按功能找入口

| 我想研究... | 从哪里看 |
|------------|---------|
| 完整对话流程 | `src/query.ts` 的 `queryLoop` 函数 |
| 如何执行工具 | `src/services/tools/toolOrchestration.ts` |
| 权限判断逻辑 | `src/hooks/useCanUseTool.ts` |
| 系统提示内容 | `src/utils/queryContext.ts` 的 `fetchSystemPromptParts` |
| 上下文压缩 | `src/services/compact/compact.ts` |
| 多 Agent 编排 | `src/coordinator/coordinatorMode.ts` |

### 方法二：跟踪数据流

从 `main.tsx` 接收用户输入 → `QueryEngine.submitMessage()` → `query()` → `queryLoop()` → 工具执行 → 响应流式返回

### 方法三：看类型定义

`src/Tool.ts` 和 `src/types/` 目录定义了核心数据结构，先读懂类型，再看实现。

---

## 下一步

- [第二章：六层架构](../ch02-architecture/01-six-layer-architecture.md) — 理解整体设计
- [第三章：query.ts 精读](../ch03-core-engine/02-query-loop.md) — 直接深入核心
