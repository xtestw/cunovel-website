# Claude Code 源码深度解读教程

> 基于 `@anthropic-ai/claude-code` npm 包 source map 还原的 1,987 个 TypeScript 源文件，从零到精通的结构化学习路径。

---

## 📚 教程目录

本教程共分六个章节，由浅入深，三个维度递进：

```
功能维度（它能做什么）
    ↓
架构维度（它为什么这样设计）
    ↓
源码维度（它是怎么实现的）
```

---

### 📖 第一章：全局概览 — Claude Code 是什么？

**适合人群**：零基础，想先建立整体认知

- [1.1 表面之下：它不只是一个 CLI](./ch01-overview/01-what-is-claude-code.md)
- [1.2 技术栈与运行环境](./ch01-overview/02-tech-stack.md)
- [1.3 源码地图：1,987 个文件怎么看](./ch01-overview/03-codebase-map.md)
- [1.4 Vim 模式：终端里的完整编辑器](./ch01-overview/04-vim-mode.md)

---

### 🏗️ 第二章：架构设计 — 整体架构与分层

**适合人群**：理解了用途，想看懂全局设计

- [2.1 六层架构：从终端到 AI](./ch02-architecture/01-six-layer-architecture.md)
- [2.2 三层功能门控系统](./ch02-architecture/02-feature-gates.md)
- [2.3 全局状态管理：bootstrap/state.ts 解析](./ch02-architecture/03-global-state.md)
- [2.4 UI 层：React + Ink 的终端渲染原理](./ch02-architecture/04-ink-tui.md)

---

### ⚙️ 第三章：核心引擎 — Agent 对话循环

**适合人群**：想理解 AI Agent 是怎么"思考和行动"的

- [3.1 一次对话的完整生命周期](./ch03-core-engine/01-conversation-lifecycle.md)
- [3.2 query.ts：主循环的源码精读](./ch03-core-engine/02-query-loop.md)
- [3.3 QueryEngine：会话状态管理器](./ch03-core-engine/03-query-engine.md)
- [3.4 System Prompt 的构建机制](./ch03-core-engine/04-system-prompt.md)
- [3.5 Context 压缩：对话历史如何不爆炸](./ch03-core-engine/05-context-compact.md)
- [3.6 Hooks 系统：用户脚本介入 AI 决策流](./ch03-core-engine/06-hooks-system.md)

---

### 🔧 第四章：工具系统 — 53 个工具的设计哲学

**适合人群**：想理解 AI 如何与真实世界交互

- [4.1 Tool 抽象：一个工具是什么](./ch04-tools/01-tool-abstraction.md)
- [4.2 核心工具详解：Bash / FileEdit / Agent](./ch04-tools/02-core-tools.md)
- [4.3 权限系统：canUseTool 决策链](./ch04-tools/03-permission-system.md)
- [4.4 MCP 协议：工具的扩展边界](./ch04-tools/04-mcp-tools.md)
- [4.5 工具并发与编排](./ch04-tools/05-tool-orchestration.md)

---

### 🚀 第五章：高级专题 — 隐藏功能深度解读

**适合人群**：想了解 Anthropic 内部正在做什么

- [5.1 KAIROS：永不关机的持久 AI 助手](./ch05-advanced/01-kairos.md)
- [5.2 Coordinator：多 Agent 编排模式](./ch05-advanced/02-coordinator.md)
- [5.3 Bridge：从 claude.ai 远程控制本地 CLI](./ch05-advanced/03-bridge.md)
- [5.4 BUDDY：AI 电子宠物的确定性生成算法](./ch05-advanced/04-buddy.md)
- [5.5 Voice & Proactive：语音与主动模式](./ch05-advanced/05-voice-proactive.md)
- [5.6 隐藏命令速查：斜杠命令 / CLI 参数 / 环境变量](./ch05-advanced/06-hidden-commands.md)

---

### 🔒 第六章：工程实践 — 功能发布与质量管控

**适合人群**：对工程管理、产品发布感兴趣

- [6.1 三层门控：feature() / USER_TYPE / GrowthBook](./ch06-engineering/01-three-layer-gates.md)
- [6.2 完整编译开关速查表（50 个）](./ch06-engineering/02-feature-flags-reference.md)
- [6.3 遥测与可观测性：OpenTelemetry 实践](./ch06-engineering/03-telemetry.md)
- [6.4 会话持久化与历史记录](./ch06-engineering/04-session-persistence.md)
- [6.5 Services 层全景：26 个子服务的职责地图](./ch06-engineering/05-services-overview.md)
- [6.6 完整环境变量参考手册（70+ 个）](./ch06-engineering/06-env-vars-reference.md)

---

### 🎓 第七章：总结

- [教程总结：从用户到源码研究者的完整路径](./ch07-summary.md)

### 🧠 ClaudeCode 代码解读（新增）

- [ClaudeCode代码解读：从请求到工具执行](./claude-code-walkthrough.md)

---

## 🗺️ 快速导航

| 我想了解... | 跳转章节 |
|------------|---------|
| Claude Code 是什么，能做什么 | [第一章](./ch01-overview/01-what-is-claude-code.md) |
| 整体代码结构怎么看 | [1.3 源码地图](./ch01-overview/03-codebase-map.md) |
| Vim 模式键位 | [1.4 Vim 模式](./ch01-overview/04-vim-mode.md) |
| AI Agent 主循环怎么工作 | [3.2 query.ts 精读](./ch03-core-engine/02-query-loop.md) |
| 如何用脚本介入 Claude 决策 | [3.6 Hooks 系统](./ch03-core-engine/06-hooks-system.md) |
| 工具权限是怎么判断的 | [4.3 权限系统](./ch04-tools/03-permission-system.md) |
| KAIROS 持久助手怎么实现 | [5.1 KAIROS](./ch05-advanced/01-kairos.md) |
| 多 Agent 编排怎么做到的 | [5.2 Coordinator](./ch05-advanced/02-coordinator.md) |
| 隐藏命令/参数/环境变量速查 | [5.6 隐藏命令速查](./ch05-advanced/06-hidden-commands.md) |
| 功能开关是怎么控制的 | [6.1 三层门控](./ch06-engineering/01-three-layer-gates.md) |
| services 层有哪些子服务 | [6.5 Services 全景](./ch06-engineering/05-services-overview.md) |
| 读完这套教程能做什么 | [教程总结](./ch07-summary.md) |

---

## 📌 说明

- 本教程基于还原的 TypeScript 源码，**仅供研究学习**
- 源码版权归 [Anthropic](https://www.anthropic.com) 所有
- 所有源码引用标注了文件路径，可对照源码阅读

---

> 💡 **建议阅读顺序**：初学者按章节顺序读；有经验的开发者可直接跳到第三章的 query.ts 精读或第五章的高级专题；只想速查的直接看快速导航表。
