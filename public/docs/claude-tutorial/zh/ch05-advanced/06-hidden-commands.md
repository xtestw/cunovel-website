# 5.6 隐藏命令速查：斜杠命令 / CLI 参数 / 环境变量

> **源码位置**：`src/commands.ts`、`src/commands/`、`src/main.tsx`
> Claude Code 中大量命令和参数并未公开文档，本文整理全部已知的隐藏能力。

---

## 一、Feature-Gated 斜杠命令（外部版不可见）

只有启用对应编译开关时才会出现：

| 命令 | 编译开关 | 功能说明 |
|------|---------|---------|
| `/buddy` | `BUDDY` | 电子宠物系统（孵化/抚摸/查看属性）|
| `/buddy hatch` | `BUDDY` | 孵化宠物（AI 生成名字和性格）|
| `/buddy card` | `BUDDY` | 查看宠物卡片和属性 |
| `/buddy pet` | `BUDDY` | 抚摸宠物（2.5s 爱心动画）|
| `/buddy mute` | `BUDDY` | 静音宠物 |
| `/proactive` | `PROACTIVE` / `KAIROS` | 开关主动自主模式 |
| `/assistant` | `KAIROS` | 持久助手模式控制 |
| `/brief` | `KAIROS` / `KAIROS_BRIEF` | 简报模式 |
| `/bridge` | `BRIDGE_MODE` | 远程控制桥接 |
| `/remote-control` | `BRIDGE_MODE` | 启动 REPL 内嵌 Bridge |
| `/voice` | `VOICE_MODE` | 语音交互控制 |
| `/ultraplan` | `ULTRAPLAN` | 云端深度规划（最长 30 分钟）|
| `/fork` | `FORK_SUBAGENT` | 子代理分叉 |
| `/peers` | `UDS_INBOX` | 对等通信（Unix Domain Socket）|
| `/workflows` | `WORKFLOW_SCRIPTS` | 工作流脚本 |
| `/torch` | `TORCH` | Torch 实验功能 |
| `/force-snip` | `HISTORY_SNIP` | 强制历史截断 |
| `/remoteControlServer` | `DAEMON` + `BRIDGE_MODE` | 远程控制服务器 |
| `/web` | `CCR_REMOTE_SETUP` | Claude Code on Web 设置 |
| `/remote-setup` | `CCR_REMOTE_SETUP` | 远程初始化设置 |

---

## 二、仅内部用户命令（`USER_TYPE === 'ant'`）

外部版源码中存在但永远不会显示：

| 命令 | 功能 |
|------|------|
| `/teleport` | 传送会话到远程/本地 |
| `/bughunter` | 内部 Bug 猎人工具 |
| `/mock-limits` | 模拟速率限制（测试用）|
| `/ctx_viz` | 上下文可视化（显示 Token 分布）|
| `/break-cache` | 注入随机字符串强制破坏 Prompt Cache |
| `/ant-trace` | 内部 API 追踪 |
| `/good-claude` | 正向反馈工具（内部评估）|
| `/agents-platform` | 多代理平台管理 |
| `/autofix-pr` | 自动修复 PR |
| `/debug-tool-call` | 调试工具调用细节 |
| `/reset-limits` | 重置速率限制 |
| `/backfill-sessions` | 回填历史会话数据 |
| `/commit-push-pr` | 内部提交/推送/PR 一键工作流 |
| `/perf-issue` | 性能问题诊断 |
| `/share` | 分享会话链接 |
| `/summary` | 会话内容总结 |
| `/bridge-kick` | 踢出当前 Bridge 连接 |
| `/subscribe-pr` | 订阅 PR（需 `KAIROS_GITHUB_WEBHOOKS`）|
| `/tags` | 标签管理 |
| `/files` | 项目文件列表 |
| `/env` | 运行时环境变量管理 |
| `/oauth-refresh` | 手动触发 OAuth 刷新 |
| `/onboarding` | 引导流程（测试用）|
| `/init-verifiers` | 初始化验证器 |

---

## 三、外部可见但鲜为人知的命令

| 命令 | 功能 |
|------|------|
| `/stickers` | 贴纸（彩蛋）|
| `/thinkback` | 思维回放 |
| `/thinkback-play` | 播放思维回放 |
| `/rewind` | 历史倒退（恢复到之前的状态）|
| `/heapdump` | 进程堆转储（内存调试）|
| `/sandbox-toggle` | 沙箱模式开关 |
| `/chrome` | Chrome 浏览器集成 |
| `/advisor` | 服务端顾问工具 |
| `/btw` | 快速备注（"by the way"，不触发 AI 响应）|

---

## 四、隐藏 CLI 参数

通过 `hideHelp()` 标记，不出现在 `--help` 输出中：

### 会话与连接

| 参数 | 功能 |
|------|------|
| `--teleport [session]` | 恢复传送会话 |
| `--remote [description]` | 创建远程会话 |
| `--sdk-url <url>` | WebSocket 端点（仅 `-p` 模式使用）|
| `--parent-session-id <id>` | 父会话 ID（子代理使用）|

### 多代理团队

| 参数 | 功能 |
|------|------|
| `--agent-id <id>` | 队友代理 ID |
| `--agent-name <name>` | 队友显示名称 |
| `--team-name <name>` | 团队名称 |
| `--agent-color <color>` | 队友 UI 颜色 |
| `--agent-type <type>` | 自定义代理类型 |
| `--teammate-mode <mode>` | 队友生成方式 |

### 规划与权限

| 参数 | 功能 |
|------|------|
| `--plan-mode-required` | 强制先进入计划模式 |
| `--advisor <model>` | 服务端顾问工具 |

### Feature-Gated CLI 参数

| 参数 | 编译开关 |
|------|---------|
| `--proactive` | `PROACTIVE` / `KAIROS` |
| `--brief` | `KAIROS` / `KAIROS_BRIEF` |
| `--assistant` | `KAIROS` |
| `--channels <servers...>` | `KAIROS_CHANNELS` |
| `--remote-control [name]` / `--rc` | `BRIDGE_MODE` |
| `--hard-fail` | `HARD_FAIL` |
| `--enable-auto-mode` | `TRANSCRIPT_CLASSIFIER` |
| `--messaging-socket-path <path>` | `UDS_INBOX` |

### 仅 ant 构建的 CLI 参数

| 参数 | 功能 |
|------|------|
| `--delegate-permissions` | `--permission-mode auto` 的别名 |
| `--afk` | 已弃用的 auto 模式别名 |
| `--tasks [id]` | 任务模式 |
| `--agent-teams` | 多代理团队模式 |

---

## 五、隐藏环境变量完整列表

### 模型与输出控制

| 环境变量 | 功能 | 默认值 |
|---------|------|--------|
| `ANTHROPIC_MODEL` | 覆盖默认模型 | claude-sonnet-... |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | 最大输出 token 数 | 模型上限 |
| `CLAUDE_CODE_DISABLE_THINKING` | 禁用思考（Extended Thinking）| false |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` | 禁用自适应思考 budget | false |
| `MAX_THINKING_TOKENS` | 最大思考 token 数（仅 ant）| 无 |
| `CLAUDE_CODE_SYNTAX_HIGHLIGHT` | 语法高亮主题 | 跟随终端 |

### 功能模式控制

| 环境变量 | 功能 |
|---------|------|
| `CLAUDE_CODE_PROACTIVE` | 开启主动模式（= `--proactive`）|
| `CLAUDE_CODE_COORDINATOR_MODE` | 开启 Coordinator 模式 |
| `CLAUDE_CODE_BRIEF` | 开启简报模式 |
| `CLAUDE_CODE_SIMPLE` | Simple 工作器模式（Coordinator 专用）|

### 性能与限制

| 环境变量 | 功能 | 默认值 |
|---------|------|--------|
| `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` | 最大工具并发数 | 10 |
| `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES` | 空闲超时阈值 | 75 分钟 |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | AutoCompact 触发阈值（百分比）| 自动计算 |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | AutoCompact 窗口大小（token 数）| 模型上限 |

### 记忆与数据

| 环境变量 | 功能 |
|---------|------|
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | 禁用自动记忆提取 |
| `CLAUDE_NO_SESSION_PERSISTENCE` | 禁用会话持久化 |

### 第三方云平台集成

| 环境变量 | 功能 |
|---------|------|
| `CLAUDE_CODE_USE_BEDROCK` | 使用 AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | 使用 Google Vertex AI |
| `CLAUDE_CODE_USE_FOUNDRY` | 使用 Foundry |
| `CLAUDE_CODE_SKIP_BEDROCK_AUTH` | 跳过 Bedrock 认证检查 |
| `CLAUDE_CODE_SKIP_VERTEX_AUTH` | 跳过 Vertex 认证检查 |

### API 扩展

| 环境变量 | 功能 |
|---------|------|
| `CLAUDE_CODE_EXTRA_BODY` | API 请求附加 JSON body（任意字段）|
| `CLAUDE_CODE_EXTRA_METADATA` | API 请求附加元数据 |
| `CLAUDE_CODE_CLIENT_CERT` | 客户端证书路径 |
| `CLAUDE_CODE_ATTRIBUTION_HEADER` | 归属标识头部 |

### 身份与认证

| 环境变量 | 功能 |
|---------|------|
| `CLAUDE_CODE_OAUTH_TOKEN` | 直接提供 OAuth access token |
| `CLAUDE_CODE_OAUTH_REFRESH_TOKEN` | OAuth refresh token |
| `CLAUDE_CODE_ACCOUNT_UUID` | 指定账户 UUID |
| `CLAUDE_CODE_ORGANIZATION_UUID` | 指定组织 UUID |
| `CLAUDE_CODE_CUSTOM_OAUTH_URL` | 自定义 OAuth 服务器 URL |

### 仅内部用户

| 环境变量 | 功能 |
|---------|------|
| `CLAUDE_INTERNAL_FC_OVERRIDES` | GrowthBook 功能覆盖（JSON 字符串）|
| `CLAUDE_CODE_GB_BASE_URL` | GrowthBook API 地址覆盖 |
| `ULTRAPLAN_PROMPT_FILE` | Ultraplan 提示文件路径覆盖 |
| `SESSION_INGRESS_URL` | 会话入口 URL 覆盖 |
| `IS_DEMO` | 演示模式 |

---

## 下一步

- [第六章：工程实践](../ch06-engineering/01-three-layer-gates.md) — 门控系统如何管理这些开关
