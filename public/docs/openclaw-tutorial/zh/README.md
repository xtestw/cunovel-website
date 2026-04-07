# OpenClaw 源码分析教材

> 一套系统解析 OpenClaw 开源 AI 助手框架源码的深度教材，面向初学者到进阶工程师。

---

## 阅读路径推荐

不同背景的读者可以从不同入口开始：

| 读者类型 | 推荐路径 |
|---------|---------|
| 🆕 **完全新手** | 入门篇全部 → 架构篇 01-02 → 应用篇 01 |
| 💻 **有经验工程师** | 架构篇全部 → 流程篇全部 → 机制篇全部 |
| 🤖 **AI 应用开发者** | 入门篇 → 应用篇全部 → 拓展篇 03 |
| 🔧 **开源贡献者** | 入门篇 02-03 → 架构篇 04 → 拓展篇全部 |

---

## 目录

### 🟢 入门篇 — 认识 OpenClaw

| 章节 | 标题 | 难度 |
|------|------|------|
| [00-01](00-intro/01-what-is-openclaw.md) | OpenClaw 是什么 | 🟢 入门 |
| [00-02](00-intro/02-codebase-tour.md) | 代码库导航 | 🟢 入门 |
| [00-03](00-intro/03-running-locally.md) | 跑起来：启动流程与入口追踪 | 🟡 中级 |

### 🏗️ 架构篇 — 系统设计全景

| 章节 | 标题 | 难度 |
|------|------|------|
| [01-01](01-architecture/01-system-layers.md) | 系统分层架构 | 🟡 中级 |
| [01-02](01-architecture/02-gateway-core.md) | Gateway 核心 | 🟡 中级 |
| [01-03](01-architecture/03-plugin-system.md) | 插件体系 | 🟡 中级 |
| [01-04](01-architecture/04-module-boundaries.md) | 模块边界与 SDK 契约 | 🔴 进阶 |

### 🔄 流程篇 — 数据流追踪

| 章节 | 标题 | 难度 |
|------|------|------|
| [02-01](02-flow/01-message-lifecycle.md) | 消息生命周期全链路 | 🟡 中级 |
| [02-02](02-flow/02-routing-engine.md) | 路由引擎 | 🟡 中级 |
| [02-03](02-flow/03-agent-call-loop.md) | Agent 调用循环 | 🔴 进阶 |

### ⚙️ 机制篇 — 核心机制深度解析

| 章节 | 标题 | 难度 |
|------|------|------|
| [03-01](03-mechanisms/01-plugin-sdk-design.md) | Plugin SDK 设计 | 🔴 进阶 |
| [03-02](03-mechanisms/02-auth-system.md) | 认证体系 | 🔴 进阶 |
| [03-03](03-mechanisms/03-channel-integration.md) | 渠道集成模式 | 🟡 中级 |
| [03-04](03-mechanisms/04-memory-mcp.md) | 记忆与 MCP | 🔴 进阶 |
| [03-05](03-mechanisms/05-security-model.md) | 安全模型 | 🔴 进阶 |

### 🚀 应用篇 — Skill 与多 Agent 协作

| 章节 | 标题 | 难度 |
|------|------|------|
| [04-01](04-application/01-skill-system.md) | Skill 系统 | 🟢 入门 |
| [04-02](04-application/02-skill-deep-dive.md) | Skill 深度解析与编写实践 | 🟡 中级 |
| [04-03](04-application/03-multi-agent.md) | 多 Agent 协作：ACP 协议 | 🔴 进阶 |
| [04-04](04-application/04-agent-scope-context.md) | Agent 作用域与上下文管理 | 🔴 进阶 |
| [04-05](04-application/05-automation-cron.md) | 自动化与定时任务 | 🟡 中级 |

### 🛠️ 拓展篇 — 动手扩展 OpenClaw

| 章节 | 标题 | 难度 |
|------|------|------|
| [05-01](05-extension/01-write-channel-plugin.md) | 实战：写一个渠道插件 | 🟡 中级 |
| [05-02](05-extension/02-integrate-llm-provider.md) | 实战：接入新 LLM Provider | 🔴 进阶 |
| [05-03](05-extension/03-create-skill.md) | 实战：创建 Skill | 🟢 入门 |

---

## 核心概念速查

| 术语 | 一句话定义 |
|------|----------|
| **Gateway** | 系统控制平面，负责接收渠道消息、路由到 Agent、管理认证和配置 |
| **Channel** | 消息渠道适配器（Telegram/Discord/Slack 等），负责入站/出站消息的格式转换 |
| **Agent** | AI 推理引擎，调用 LLM 完成任务，可使用工具、记忆和 Skill |
| **Plugin** | 代码形式的功能扩展，包含 Channel Plugin、Provider Plugin、Capability Plugin 三类 |
| **Skill** | 指令文档形式的能力扩展（Markdown），不是代码，告诉 Agent 如何执行特定任务 |
| **Provider** | LLM 服务提供商适配器（OpenAI/Anthropic/Ollama 等），负责模型路由和认证 |

---

## 难度说明

- 🟢 **入门**：适合所有读者，无需编程基础
- 🟡 **中级**：需要 TypeScript 和 Node.js 基础知识
- 🔴 **进阶**：需要系统设计和软件工程经验

---

*[← 返回双语导航](../README.md) | [English Version →](../en/README.md)*
