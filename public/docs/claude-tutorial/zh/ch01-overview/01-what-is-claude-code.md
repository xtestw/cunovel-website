# 1.1 表面之下：Claude Code 不只是一个 CLI

> **章节目标**：建立对 Claude Code 的整体认知——它是什么、能做什么、和普通 CLI 工具有什么本质区别。

---

## 你以为的 Claude Code

大多数人第一次见到 Claude Code，认为它就是一个**命令行版的 ChatGPT**：在终端里问问题，得到答案，仅此而已。

```bash
$ claude "帮我写一个 Python 快速排序"
```

这个认知只对了 5%。

---

## 真实的 Claude Code

打开源码，第一件事就会颠覆这个认知。`方案汇总.md` 里有一句精准的总结：

> Claude Code 表面是一个 CLI 工具，实际上是一套完整的 **AI Agent 操作系统**。

让我们把这句话拆开理解。

### 它是一个 Agent，不是一个聊天机器人

普通聊天机器人的工作流程是：**输入 → 输出**

Claude Code 的工作流程是：**输入 → 思考 → 工具调用 → 观察结果 → 再思考 → 再工具调用 → ... → 输出**

这个"思考-行动-观察"的循环，就是 **Agent 循环**（ReAct 模式）。Claude Code 可以：

- 读取你的文件（`FileReadTool`）
- 修改代码（`FileEditTool`）
- 执行 shell 命令（`BashTool`）
- 搜索网页（`WebSearchTool`）
- 打开浏览器（`WebBrowserTool`）
- 递归地启动子 Agent（`AgentTool`）

### 它有 1,987 个源文件

这不是数字游戏。一个"简单的 CLI 工具"不会有将近 2000 个文件。这个规模意味着：

| 子系统 | 规模 |
|--------|------|
| 工具系统 | 53 个工具 |
| 斜杠命令 | 87 个命令 |
| UI 组件 | 148 个终端组件 |
| 自定义 Hooks | 87 个 |
| Bridge 远程控制 | 33 个文件 |

### 它有隐藏的"操作系统层"

Claude Code 还包含大量外部用户看不见的系统（通过编译开关裁剪）：

- **KAIROS**：让 Claude 在你关掉终端后继续运行的持久助手
- **Coordinator**：把一个 Claude 变成指挥官，派遣多个 Worker 并行工作
- **Bridge**：从 claude.ai 网页或手机远程控制你的本地 CLI
- **BUDDY**：终端里的 AI 电子宠物

---

## 一个完整的请求发生了什么

让我们跟踪一个典型请求的完整生命周期，感受一下它的复杂度：

```
你输入: "帮我重构这个文件，让它更简洁"
         │
         ▼
[1] main.tsx 接收输入，创建 React 状态更新
         │
         ▼
[2] QueryEngine 开始新的对话 Turn
    - 构建 System Prompt（注入 git 状态、CLAUDE.md 内容、工具描述）
    - 从 bootstrap/state.ts 读取全局配置
         │
         ▼
[3] query.ts 启动主循环
    - 格式化消息发给 Claude API（Anthropic / Bedrock / Vertex）
    - 流式接收响应
         │
         ▼
[4] Claude 返回：「我需要先读取这个文件」
    → 触发 FileReadTool
    → 权限检查（canUseTool）
    → 执行读取
    → 结果返回给 Claude
         │
         ▼
[5] Claude 返回：「现在我来修改它」
    → 触发 FileEditTool
    → 权限检查（是否在允许路径内？）
    → 执行修改
    → 结果返回给 Claude
         │
         ▼
[6] Claude 返回最终文字响应
    - query.ts 循环结束
    - 会话历史持久化到磁盘
    - 成本追踪更新
         │
         ▼
[7] Ink UI 渲染最终输出到终端
```

这是一次"简单"的文件重构请求背后发生的事情。而如果你启用了 Coordinator 模式，步骤 [4] 和 [5] 可能会并行地分发给多个 Worker。

---

## 三个维度理解 Claude Code

| 维度 | 描述 | 类比 |
|------|------|------|
| **功能维度** | 它能做什么 | 一个非常强大的程序员助手 |
| **架构维度** | 它怎么组织 | 一个分层的 Agent 操作系统 |
| **源码维度** | 它怎么实现 | 精心设计的 TypeScript 工程 |

本教程的六个章节，就是从这三个维度，由浅入深地展开。

---

## 下一步

- 了解技术栈 → [1.2 技术栈与运行环境](./02-tech-stack.md)
- 快速看懂源码结构 → [1.3 源码地图](./03-codebase-map.md)
- 直接看核心原理 → [第三章：核心引擎](../ch03-core-engine/01-conversation-lifecycle.md)
