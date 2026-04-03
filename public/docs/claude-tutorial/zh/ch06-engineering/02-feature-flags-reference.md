# 6.2 完整编译开关速查表（50 个 feature flags）

> 基于源码中所有 `feature('...')` 调用整理，包含功能说明和状态。

---

## 核心功能开关（外部版未启用）

| 开关 | 功能描述 | 相关源码 |
|------|---------|---------|
| `BUDDY` | AI 电子宠物系统（18 种物种）| `src/buddy/` |
| `KAIROS` | 持久助手模式（关掉终端仍运行）| `src/assistant/` |
| `KAIROS_BRIEF` | KAIROS 简报模式 | `src/assistant/` |
| `KAIROS_CHANNELS` | KAIROS 通道通知 | `src/assistant/` |
| `KAIROS_GITHUB_WEBHOOKS` | KAIROS GitHub Webhook 集成 | `src/tools/SubscribePRTool/` |
| `KAIROS_PUSH_NOTIFICATION` | KAIROS 推送通知 | `src/tools/PushNotificationTool/` |
| `ULTRAPLAN` | 云端深度规划（最长 30 分钟）| `src/commands/ultraplan.tsx` |
| `COORDINATOR_MODE` | 多 Agent 编排模式 | `src/coordinator/` |
| `BRIDGE_MODE` | 远程控制桥接（claude.ai → 本地 CLI）| `src/bridge/` |
| `VOICE_MODE` | 语音交互（STT + TTS）| `src/services/voice.ts` |
| `PROACTIVE` | 主动自主模式（无人时自主运行）| `src/proactive/` |
| `FORK_SUBAGENT` | 子代理分叉模式 | `src/tools/AgentTool/` |
| `DAEMON` | 守护进程模式 | `src/bridge/` |

---

## 基础设施开关

| 开关 | 功能描述 |
|------|---------|
| `UDS_INBOX` | Unix Domain Socket 收件箱（进程间通信）|
| `WORKFLOW_SCRIPTS` | 工作流脚本系统 |
| `TORCH` | Torch 功能（实验性）|
| `MONITOR_TOOL` | MonitorTool 工具 |
| `HISTORY_SNIP` | 历史消息截断（SnipCompact）|
| `BG_SESSIONS` | 后台会话管理（独立子进程 AgentTool）|
| `HARD_FAIL` | 硬失败模式（用于测试）|
| `CCR_REMOTE_SETUP` | Web 远程初始化设置 |
| `CHICAGO_MCP` | 内部 MCP 扩展服务器 |
| `AGENT_TRIGGERS` | Cron 触发器工具（CronCreateTool 等）|
| `AGENT_TRIGGERS_REMOTE` | 远程触发器工具 |

---

## 上下文优化开关

| 开关 | 功能描述 |
|------|---------|
| `CACHED_MICROCOMPACT` | 缓存微压缩（利用 Prompt Cache 降低压缩成本）|
| `CONTEXT_COLLAPSE` | 上下文折叠（工具调用结果折叠）|
| `REACTIVE_COMPACT` | 响应式压缩（收到 `prompt_too_long` 时立即压缩）|
| `QUICK_SEARCH` | 快速搜索功能 |
| `TOKEN_BUDGET` | Token 预算跟踪和强制终止 |
| `STREAMLINED_OUTPUT` | 精简输出格式 |
| `CONNECTOR_TEXT` | 连接器文本块 |

---

## 安全与合规开关

| 开关 | 功能描述 |
|------|---------|
| `ANTI_DISTILLATION_CC` | 反蒸馏保护（防止通过 CC 提取模型）|
| `BASH_CLASSIFIER` | Bash 命令安全分类器 |
| `NATIVE_CLIENT_ATTESTATION` | 原生客户端证明（防止伪造 Claude Code 身份）|
| `TRANSCRIPT_CLASSIFIER` | 转录分类器（自动模式的安全检查）|
| `UNATTENDED_RETRY` | 无人值守自动重试 |

---

## 数据与遥测开关

| 开关 | 功能描述 |
|------|---------|
| `EXTRACT_MEMORIES` | 自动从对话中提取长期记忆 |
| `MEMORY_SHAPE_TELEMETRY` | 记忆形状遥测 |
| `COWORKER_TYPE_TELEMETRY` | 协作者类型遥测 |
| `SLOW_OPERATION_LOGGING` | 慢操作性能日志 |
| `PROMPT_CACHE_BREAK_DETECTION` | Prompt Cache 中断检测 |
| `COMMIT_ATTRIBUTION` | Git commit 中的 Claude 行贡献归属标注 |

---

## UI 与交互开关

| 开关 | 功能描述 |
|------|---------|
| `TERMINAL_PANEL` | 终端面板组件 |
| `MESSAGE_ACTIONS` | 消息操作按钮（复制、编辑等）|
| `BREAK_CACHE_COMMAND` | `/break-cache` 命令（注入 System Prompt 随机字符串破坏缓存）|

---

## 实验性功能开关

| 开关 | 功能描述 |
|------|---------|
| `LODESTONE` | Lodestone 功能（实验性）|
| `MCP_SKILLS` | MCP 技能系统 |
| `EXPERIMENTAL_SKILL_SEARCH` | 实验性技能搜索 |
| `TEMPLATES` | 工作模板/任务分类器 |
| `TEAMMEM` | 团队记忆同步 |

---

## 用户设置同步开关

| 开关 | 功能描述 |
|------|---------|
| `FILE_PERSISTENCE` | 文件持久化（远程存储）|
| `DOWNLOAD_USER_SETTINGS` | 从服务器下载用户设置 |
| `UPLOAD_USER_SETTINGS` | 上传用户设置到服务器 |

---

## 平台检测开关（构建时注入）

| 开关 | 功能描述 |
|------|---------|
| `IS_LIBC_GLIBC` | 运行在 glibc Linux 上 |
| `IS_LIBC_MUSL` | 运行在 musl Linux 上（Alpine 等）|

---

## 如何在开发模式中查看所有功能

在开发模式（`bun run dev`）下运行时，所有 `feature()` 调用默认返回 `true`：

```bash
# 开发模式启动，可以看到所有内部功能
bun run dev

# 设置 USER_TYPE=ant 可以激活内部专属功能
USER_TYPE=ant bun run dev
```

> **注意**：某些功能还需要 GrowthBook 开关配合，或需要特定的配置文件设置。仅设置 `USER_TYPE=ant` 不会自动激活所有功能。

---

## 下一步

- [6.3 遥测与可观测性](./03-telemetry.md) — OpenTelemetry 实践
- [6.4 会话持久化](./04-session-persistence.md) — 对话历史如何存储
