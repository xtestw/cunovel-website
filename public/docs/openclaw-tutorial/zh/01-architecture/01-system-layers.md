# 系统分层架构 🟡

> OpenClaw 并不是一个"大泥球"——它有明确的七层架构，每层职责单一，通过清晰定义的接口通信。

## 本章目标

读完本章你将能够：
- 画出 OpenClaw 的七层架构图并说明每层职责
- 理解每层之间通过什么接口通信
- 理解"核心精简 + 能力插件化"这个设计原则的具体体现
- 知道 `AGENTS.md` 文件在架构边界守卫中的作用

---

## 一、七层架构全景

```mermaid
flowchart TB
    subgraph L1["第一层：CLI 入口层"]
        CLI["openclaw.mjs\nsrc/entry.ts\nsrc/cli/"]
    end

    subgraph L2["第二层：Gateway 控制平面层"]
        HTTP["HTTP Server\nserver-http.ts"]
        WS["WebSocket Server\nserver-chat.ts"]
        AUTH["Auth 中间件\nauth.ts"]
        CTRL["Control UI\ncontrol-ui.ts"]
    end

    subgraph L3["第三层：消息路由层"]
        ROUTE["路由引擎\nresolve-route.ts"]
        SESSION["会话管理\nsessions/"]
        BINDING["绑定规则\nbindings.ts"]
    end

    subgraph L4["第四层：插件编排层"]
        LOADER["插件加载器\nplugins/loader.ts"]
        REGISTRY["插件注册表\nplugins/registry.ts"]
        SDK["Plugin SDK\nplugin-sdk/"]
    end

    subgraph L5["第五层：渠道适配层"]
        TG["Telegram\nextensions/telegram/"]
        DC["Discord\nextensions/discord/"]
        SL["Slack\nextensions/slack/"]
        MORE["... 90+ 渠道/Provider 插件"]
    end

    subgraph L6["第六层：Agent 推理层"]
        BOOT["Bootstrap Builder\nagents/bootstrap-*.ts"]
        PROV["Provider Runtime\nagents/provider-runtime.ts"]
        TOOL["工具执行\nagents/tools-*.ts"]
        COMPACT["上下文压缩\nagents/compaction.ts"]
    end

    subgraph L7["第七层：基础设施层"]
        LOG["日志\nlogging/"]
        CFG["配置\nconfig/"]
        SEC["安全\nsecurity/"]
        INFRA["环境/TLS/设备\ninfra/"]
    end

    L1 -->|"CLI 命令"| L2
    L2 -->|"标准化消息"| L3
    L3 -->|"路由到 Agent"| L6
    L4 -->|"加载渠道插件"| L5
    L5 -->|"InboundEnvelope"| L2
    L6 -->|"调用 LLM/工具"| L5
    L7 -.->|"基础服务（所有层依赖）"| L1
    L7 -.->|""| L2
    L7 -.->|""| L3
    L7 -.->|""| L6
```

---

## 二、各层详细说明

### 第一层：CLI 入口层

**职责**：解析用户命令，引导程序进入正确的运行模式。

| 文件 | 职责 |
|------|------|
| `openclaw.mjs` | npm bin 包装器，Node 版本检查，加载主程序 |
| `src/entry.ts` | 主入口，环境初始化，Respawn 机制 |
| `src/cli/run-main.ts` | CLI 框架启动（Commander.js）|
| `src/commands/` | 各子命令实现（gateway run、onboard 等）|

**对外接口**：无（用户通过终端直接调用）

**依赖关系**：调用第二层（Gateway）或直接执行某些命令（config get/set、secrets 等）

---

### 第二层：Gateway 控制平面层

**职责**：系统的核心协调器。监听 HTTP/WebSocket 连接，处理渠道插件注册，管理 WebChat 会话，验证 operator 认证。

| 文件 | 职责 |
|------|------|
| `src/gateway/server-http.ts` | HTTP 服务器，API 路由注册 |
| `src/gateway/server-chat.ts` | WebSocket 服务器，聊天消息处理 |
| `src/gateway/server-channels.ts` | 渠道插件事件接收 |
| `src/gateway/auth.ts` | Operator 认证（密码/Token/TLS）|
| `src/gateway/control-ui.ts` | Web 管理界面 |
| `src/gateway/client.ts` | Gateway 客户端（CLI → Gateway 通信）|
| `src/gateway/protocol/` | WebSocket 消息帧类型定义 |

**对外接口**：
- HTTP 端口（默认 4242）：接受渠道插件 webhook、CLI 命令
- WebSocket：接受 Web 客户端的实时聊天连接

**关键设计**：Gateway 是**控制平面（control plane）**，不直接执行 AI 推理。它只负责"将正确的消息交给正确的 Agent"。

---

### 第三层：消息路由层

**职责**：根据消息的来源（渠道、群组、用户等）决定将消息路由到哪个 Agent，并管理 Agent 的会话状态。

| 文件 | 职责 |
|------|------|
| `src/routing/resolve-route.ts` | 核心路由决策（832 行，多层级匹配）|
| `src/routing/session-key.ts` | Session Key 计算（唯一标识一个对话）|
| `src/routing/bindings.ts` | 绑定规则列表（channel/peer/guild 到 agent 的映射）|
| `src/routing/account-id.ts` | 账号 ID 标准化 |
| `src/sessions/` | 会话持久化（历史消息存储）|

**对外接口**：
- 输入：`InboundEnvelope`（标准化的入站消息）
- 输出：`ResolvedAgentRoute`（包含 agentId、sessionKey 等）

---

### 第四层：插件编排层

**职责**：管理插件的整个生命周期——发现、加载、验证、注册、激活、隔离。为插件提供公共 SDK。

| 文件 | 职责 |
|------|------|
| `src/plugins/discovery.ts` | 扫描可用插件（npm 包、本地路径）|
| `src/plugins/loader.ts` | 使用 jiti 动态加载插件模块 |
| `src/plugins/registry.ts` | 插件注册表（已激活插件的数据结构）|
| `src/plugins/manifest.ts` | `openclaw.plugin.json` 解析和验证 |
| `src/plugins/config-state.ts` | 插件激活状态管理 |
| `src/plugin-sdk/core.ts` | Plugin SDK 公开 API（插件开发者使用）|
| `src/plugin-sdk/channel-contract.ts` | 渠道插件接口定义 |
| `src/plugin-sdk/provider-entry.ts` | Provider 插件注册 API |

**对外接口**：
- 向插件暴露 `openclaw/plugin-sdk/*`（只允许通过此路径访问核心功能）
- 向核心层暴露 `PluginRegistry`（已加载插件的查询接口）

---

### 第五层：渠道适配层

**职责**：将各个消息平台的原生协议转换为 OpenClaw 的标准格式，以及反向转换。每个渠道是一个独立的插件包。

渠道插件的两个核心职责：

```
入站（Inbound）：
平台消息（Telegram Update / Discord Event / Slack Event）
  → InboundEnvelope（OpenClaw 标准格式）
  → 发给 Gateway

出站（Outbound）：
AI 回复文本
  → 平台消息格式（sendMessage API 调用）
  → 发到平台
```

| 类型 | 关键文件 |
|------|---------|
| 抽象接口 | `src/channels/plugins/types.plugin.ts` |
| 入站信封 | `src/plugin-sdk/inbound-envelope.ts` |
| 状态回应 | `src/channels/status-reactions.ts` |
| 线程绑定 | `src/channels/thread-bindings-policy.ts` |
| 具体实现 | `extensions/telegram/`, `extensions/discord/`, ... |

---

### 第六层：Agent 推理层

**职责**：这是 AI 真正"思考"的地方。Agent 负责构建上下文（Bootstrap）、调用 LLM、处理工具调用循环、管理上下文压缩。

| 文件 | 职责 |
|------|------|
| `src/agents/bootstrap-budget.ts` | 上下文预算（Token 分配）|
| `src/agents/bootstrap-files.ts` | 加载上下文文件（CLAUDE.md 等）|
| `src/agents/bootstrap-memory.ts` | 记忆注入 |
| `src/agents/provider-runtime.ts` | LLM Provider 运行时（选模型、发请求）|
| `src/agents/compaction.ts` | 上下文压缩（超出 token limit 时）|
| `src/agents/acp-spawn.ts` | 多 Agent 协作（派发子 Agent）|
| `src/agents/tool-executor.ts` | 工具执行（bash、文件读写等）|

**对外接口**：
- 输入：路由结果（agentId、sessionKey）+ 入站消息
- 输出：AI 回复文本（流式），通过 Gateway 发回渠道

---

### 第七层：基础设施层

**职责**：为所有其他层提供基础能力——日志、配置、安全检查、环境变量、TLS、设备身份等。

| 模块 | 关键文件 |
|------|---------|
| 日志 | `src/logging/subsystem.ts`, `src/logger.ts` |
| 配置 | `src/config/config.ts`, `src/config/io.ts` |
| 安全 | `src/security/`, `src/gateway/input-allowlist.ts` |
| 环境 | `src/infra/env.ts` |
| TLS | `src/infra/tls/` |
| 设备身份 | `src/infra/device-identity.ts` |
| Secret 解析 | `src/secrets/` |

---

## 三、层间通信方式

不同层之间的通信不是随意的直接调用，而是通过明确定义的接口：

| 通信路径 | 方式 | 关键接口 |
|---------|------|---------|
| CLI → Gateway | HTTP/WebSocket | `GatewayClient`（`gateway/client.ts`）|
| 渠道插件 → Gateway | HTTP WebHook / Bot 轮询 | `server-channels.ts` 注册的事件 |
| Gateway → 路由层 | 直接函数调用 | `resolveAgentRoute()` |
| 路由层 → Agent 层 | 直接函数调用 | `runAgentForSession()` |
| 插件 → 核心 | npm 包 + 模块 alias | `openclaw/plugin-sdk/*` 路径 |
| 核心 → 插件 | 事件钩子 | `hook-runner-global.ts` |
| 父 Agent → 子 Agent | ACP 协议 | `acp-spawn.ts` |
| Agent → LLM | HTTP（各 Provider 适配）| `provider-runtime.ts` |

---

## 四、架构边界守卫：`AGENTS.md` 文件

OpenClaw 在多个关键目录下放置了 `AGENTS.md` 文件（与 `CLAUDE.md` 内容相同，是给 AI 助手看的指导文档）。这些文件在该目录下定义了**边界规则**，防止代码越过架构边界：

```
src/
├── plugin-sdk/AGENTS.md      ← "只允许 extension 导入这里的文件"
├── channels/AGENTS.md        ← "渠道内部实现，不向插件暴露"
├── plugins/AGENTS.md         ← "插件框架，不是插件 SDK"
├── gateway/protocol/AGENTS.md ← "协议变更 = 契约变更，需要版本化"
└── extensions/AGENTS.md      ← "插件树边界：只用 plugin-sdk"
```

最核心的边界规则来自 `CLAUDE.md`：

> **Rule**: extensions must cross into core only through `openclaw/plugin-sdk/*`, manifest metadata, and documented runtime helpers. Do not import `src/**` from extension production code.

这个规则意味着：无论是 `extensions/telegram/` 还是 `extensions/openai/`，**不能直接 `import` `src/` 下的任何文件**。所有需要的能力都必须通过 `openclaw/plugin-sdk/*` 暴露。

---

## 五、"核心精简 + 能力插件化"的具体体现

这个原则在代码中有多处具体体现：

### 1. 记忆是插件 slot，不是核心功能

```
// 只能激活一个 memory 插件
Memory Plugin Slot: memory-core / memory-lancedb（二选一）
```

记忆功能不在 `src/` 核心里，而是通过插件 slot 机制实现。核心只知道"有没有激活的 memory 插件"，不关心具体实现。

### 2. 所有 LLM 都是 Provider 插件

核心只有 `provider-runtime.ts`（一个通用的 LLM 调用框架），具体的 OpenAI/Anthropic/Ollama 适配都在 `extensions/` 下。

### 3. 渠道是独立可组合的

`extensions/` 下有 20+ 个渠道插件，核心完全不知道 Telegram、Discord、Slack 的具体协议细节。

### 4. 新的消息平台不需要改核心

新增一个消息平台（比如 LINE 2.0），只需要在 `extensions/` 下写一个新插件，不需要改 `src/` 下的任何文件。

---

## 关键源码索引

| 文件 | 层次 | 作用 |
|------|------|------|
| `src/gateway/server-http.ts` | L2 | HTTP Gateway 服务器 |
| `src/gateway/server-chat.ts` | L2 | WebSocket 聊天服务 |
| `src/routing/resolve-route.ts` | L3 | 核心路由决策 |
| `src/sessions/` | L3 | 会话持久化 |
| `src/plugins/loader.ts` | L4 | 插件加载器 |
| `src/plugin-sdk/core.ts` | L4 | Plugin SDK 公开 API |
| `src/channels/plugins/types.plugin.ts` | L5 | 渠道插件接口 |
| `src/agents/bootstrap-budget.ts` | L6 | Agent Bootstrap |
| `src/agents/provider-runtime.ts` | L6 | LLM 调用运行时 |
| `src/config/config.ts` | L7 | 配置加载 |
| `CLAUDE.md`（Architecture Boundaries 章节）| - | 架构边界规范 |

---

## 小结

1. **七层架构**：CLI 入口 → Gateway 控制平面 → 消息路由 → 插件编排 → 渠道适配 → Agent 推理 → 基础设施。
2. **Gateway 是控制平面**，不做 AI 推理，只做协调——这是核心设计决策，让 Gateway 保持轻量稳定。
3. **边界守卫**：`AGENTS.md` 文件在关键目录定义架构边界，插件只能通过 `openclaw/plugin-sdk/*` 访问核心功能。
4. **插件化是彻底的**：渠道、Provider、记忆、语音都是插件，核心只维护最小骨架。
5. **通信接口明确**：不同层之间通过定义良好的接口通信（`InboundEnvelope`、`ResolvedAgentRoute`、`PluginRegistry` 等）。

---

## 延伸阅读

- [← 上一章：跑起来](../00-intro/03-running-locally.md)
- [→ 下一章：Gateway 核心](02-gateway-core.md)
- [`CLAUDE.md`](../../../../CLAUDE.md) — Architecture Boundaries 章节（官方架构边界规范）
