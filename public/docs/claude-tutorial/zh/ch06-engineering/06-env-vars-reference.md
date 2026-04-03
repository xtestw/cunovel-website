# 6.6 完整环境变量参考手册

> 基于源码 `process.env.*` 全量扫描整理。共 70+ 个环境变量，按功能分类。

---

## 使用方式

```bash
# 一次性使用
ANTHROPIC_MODEL=claude-opus-4-5 claude

# 写入 shell 配置（永久生效）
echo 'export CLAUDE_CODE_DISABLE_THINKING=1' >> ~/.zshrc

# .env 文件（项目级别）
echo 'ANTHROPIC_BASE_URL=http://my-proxy.com' > .env
```

---

## 一、核心 API 配置

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `ANTHROPIC_API_KEY` | Anthropic API 密钥（标准变量）| `sk-ant-...` |
| `ANTHROPIC_BASE_URL` | 覆盖 API 基础 URL（代理/私有部署）| `https://my-proxy.com` |
| `ANTHROPIC_MODEL` | 覆盖默认模型 | `claude-opus-4-5` |
| `CLAUDE_CODE_API_BASE_URL` | Files API 基础 URL 覆盖 | `https://api.anthropic.com` |

---

## 二、模型与推理控制

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | 最大输出 token 数 | 模型上限 |
| `CLAUDE_CODE_DISABLE_THINKING` | 禁用 Extended Thinking | `false` |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` | 禁用自适应 thinking budget 调整 | `false` |
| `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK` | 禁用非流式回退（出错时）| `false` |
| `MAX_THINKING_TOKENS` | 最大思考 token 数（仅 ant 用户）| 无 |
| `CLAUDE_CODE_DISABLE_FAST_MODE` | 禁用快速模式 | `false` |

---

## 三、功能模式开关

| 环境变量 | 说明 |
|---------|------|
| `CLAUDE_CODE_PROACTIVE` | 开启 Proactive 主动自主模式（等同 `--proactive`）|
| `CLAUDE_CODE_COORDINATOR_MODE` | 开启 Coordinator 多 Agent 编排模式 |
| `CLAUDE_CODE_BRIEF` | 开启 Brief 简报模式（KAIROS）|
| `CLAUDE_CODE_SIMPLE` | Simple Worker 模式（Coordinator 专用，缩减工具集）|
| `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES` | 触发工具使用摘要生成 |
| `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION` | 控制提示建议功能（`false` 禁用）|

---

## 四、云平台集成（第三方模型）

| 环境变量 | 说明 |
|---------|------|
| `CLAUDE_CODE_USE_BEDROCK` | 使用 AWS Bedrock 作为 API 提供商 |
| `CLAUDE_CODE_SKIP_BEDROCK_AUTH` | 跳过 Bedrock 认证（测试/代理场景）|
| `CLAUDE_CODE_USE_VERTEX` | 使用 Google Vertex AI |
| `CLAUDE_CODE_SKIP_VERTEX_AUTH` | 跳过 Vertex 认证（使用 mock GoogleAuth）|
| `CLAUDE_CODE_USE_FOUNDRY` | 使用 Foundry |
| `CLAUDE_CODE_SKIP_FOUNDRY_AUTH` | 跳过 Foundry 认证 |
| `ANTHROPIC_FOUNDRY_API_KEY` | Foundry API 密钥 |

---

## 五、上下文压缩控制

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | AutoCompact 触发阈值（覆盖自动计算的百分比）| 自动（约 85%）|
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | AutoCompact 上下文窗口大小上限（token 数）| 模型上限 |
| `CLAUDE_NO_SESSION_PERSISTENCE` | 禁用会话历史持久化（CI 环境推荐）| `false` |

---

## 六、API 扩展与元数据

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `CLAUDE_CODE_EXTRA_BODY` | 附加到 API 请求 body 的 JSON | `{"betas": ["..."]}`  |
| `CLAUDE_CODE_EXTRA_METADATA` | 附加到 API 请求的元数据 JSON | `{"session_type": "dev"}` |
| `CLAUDE_CODE_ATTRIBUTION_HEADER` | 归属标识请求头内容 | 任意字符串 |
| `CLAUDE_CODE_ADDITIONAL_PROTECTION` | 启用额外保护头部（防止 SSRF 等）| `true` |
| `CLAUDE_CODE_TAGS` | 会话标签（遥测用，随 API 请求上报）| `project=foo,env=dev` |
| `CLAUDE_AGENT_SDK_CLIENT_APP` | SDK 客户端应用标识（用于 API 请求头）| 任意字符串 |

---

## 七、身份与认证

| 环境变量 | 说明 |
|---------|------|
| `CLAUDE_CODE_OAUTH_TOKEN` | 直接提供 OAuth access token（跳过正常登录流程）|
| `CLAUDE_CODE_OAUTH_REFRESH_TOKEN` | OAuth refresh token |
| `CLAUDE_CODE_ACCOUNT_UUID` | 指定账户 UUID |
| `CLAUDE_CODE_ORGANIZATION_UUID` | 指定组织 UUID |
| `CLAUDE_CODE_CUSTOM_OAUTH_URL` | 自定义 OAuth 服务器 URL |

---

## 八、性能与限制

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` | 最大工具并发执行数 | `10` |
| `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES` | 空闲超时阈值（分钟）| `75` |
| `CLAUDE_CODE_UNATTENDED_RETRY` | 无人值守自动重试（`UNATTENDED_RETRY` feature 下）| `false` |

---

## 九、记忆与数据

| 环境变量 | 说明 |
|---------|------|
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | 禁用 `EXTRACT_MEMORIES` 自动记忆提取 |
| `CLAUDE_CODE_CLIENT_CERT` | 客户端 TLS 证书路径（企业 mTLS 场景）|

---

## 十、UI 与显示

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `CLAUDE_CODE_SYNTAX_HIGHLIGHT` | 语法高亮主题（终端代码块）| `Dracula` / `base16` |
| `BAT_THEME` | 备用语法高亮主题（与 `bat` 工具共用）| `Monokai Extended` |
| `CLAUDE_CODE_USE_POWERSHELL_TOOL` | 是否使用 PowerShell 工具（Windows）| `true`/`false` |

---

## 十一、遥测与可观测性

| 环境变量 | 说明 |
|---------|------|
| `CLAUDE_CODE_DATADOG_FLUSH_INTERVAL_MS` | DataDog 指标 flush 间隔（毫秒）|
| `CLAUDE_CODE_REMOTE` | 标记为远程运行（影响超时设置：300s→120s）|
| `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE` | 远程环境类型（遥测上报）|
| `CLAUDE_CODE_REMOTE_SESSION_ID` | 远程会话 ID（遥测关联）|
| `CLAUDE_CODE_CONTAINER_ID` | 容器 ID（遥测关联）|
| `CLAUDE_CODE_HOST_PLATFORM` | 覆盖平台检测（`darwin`/`linux`/`win32`）|
| `CLAUDE_CODE_COWORKER_TYPE` | 协作者类型标记（`COWORKER_TYPE_TELEMETRY` feature）|
| `CLAUDE_CODE_ACTION` | 标记为 Claude Code Action 运行（GitHub Actions 集成）|
| `GITHUB_ACTIONS` | 标准 GitHub Actions 检测变量 |
| `CLAUBBIT` | 标记为 Claubbit 运行（内部工具）|

---

## 十二、运行模式与入口

| 环境变量 | 说明 | 可选值 |
|---------|------|--------|
| `CLAUDE_CODE_ENTRYPOINT` | 运行入口标识 | `cli` / `local-agent` / `sdk` |
| `CLAUDE_JOB_DIR` | 任务目录（Stop Hook 的任务分类器使用）| 目录路径 |

---

## 十三、子代理与多代理

| 环境变量 | 说明 |
|---------|------|
| `CLAUDE_CODE_PARENT_SESSION_ID` | 父会话 ID（子代理使用）|
| `CLAUDE_CODE_MESSAGING_SOCKET_PATH` | Unix Domain Socket 路径（`UDS_INBOX` feature）|

---

## 十四、仅内部用户（`USER_TYPE=ant`）

| 环境变量 | 说明 |
|---------|------|
| `USER_TYPE` | 用户类型（外部版硬编码为 `external`，内部版可设为 `ant`）|
| `CLAUDE_INTERNAL_FC_OVERRIDES` | GrowthBook 功能覆盖 JSON（例：`{"tengu_kairos": true}`）|
| `CLAUDE_CODE_GB_BASE_URL` | GrowthBook API 地址覆盖 |
| `ULTRAPLAN_PROMPT_FILE` | Ultraplan 提示文件路径覆盖 |
| `SESSION_INGRESS_URL` | 会话入口 URL 覆盖（Bridge 使用）|
| `IS_DEMO` | 演示模式标记 |
| `CLAUBBIT` | Claubbit 内部工具标记 |

---

## 十五、第三方标准变量（Claude Code 读取）

| 环境变量 | 说明 |
|---------|------|
| `ANTHROPIC_BASE_URL` | API Base URL（Anthropic SDK 标准变量）|
| `NODE_ENV` | 运行环境（`test` 时部分功能禁用）|
| `HOME` / `USERPROFILE` | 家目录（配置文件路径计算）|
| `SHELL` | 当前 Shell（Bash/Zsh/Fish 检测）|
| `TERM` | 终端类型（颜色支持检测）|

---

## 环境变量 vs CLI 参数的关系

部分环境变量与 CLI 参数等价：

| 环境变量 | 等价 CLI 参数 |
|---------|-------------|
| `CLAUDE_CODE_PROACTIVE=1` | `--proactive` |
| `CLAUDE_CODE_COORDINATOR_MODE=1` | （无对应 flag，需用环境变量）|
| `CLAUDE_NO_SESSION_PERSISTENCE=1` | `--no-session-persistence`（如果有）|
| `ANTHROPIC_MODEL=xxx` | `--model xxx` |
| `ANTHROPIC_BASE_URL=xxx` | `--base-url xxx`（部分场景）|

---

## 常用调试组合

```bash
# 切换到 Opus 模型 + 禁用思考（加速测试）
ANTHROPIC_MODEL=claude-opus-4-5 CLAUDE_CODE_DISABLE_THINKING=1 claude

# 使用代理 + 多输出 token
ANTHROPIC_BASE_URL=http://localhost:8080 CLAUDE_CODE_MAX_OUTPUT_TOKENS=8192 claude

# 完全禁用持久化（纯 headless 测试）
CLAUDE_NO_SESSION_PERSISTENCE=1 claude -p "你好"

# 内部用户：覆盖 GrowthBook 开关
CLAUDE_INTERNAL_FC_OVERRIDES='{"tengu_kairos": true}' claude

# 使用 AWS Bedrock
CLAUDE_CODE_USE_BEDROCK=1 ANTHROPIC_MODEL=us.anthropic.claude-opus-4-5-20251101-v1:0 claude
```

---

## 下一步

- [5.6 隐藏命令速查](../ch05-advanced/06-hidden-commands.md) — 斜杠命令/CLI 参数的完整速查
- [6.1 三层门控](./01-three-layer-gates.md) — `USER_TYPE` 和 GrowthBook 如何与环境变量协作
