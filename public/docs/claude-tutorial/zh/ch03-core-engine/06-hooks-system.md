# 3.6 Hooks 系统：用户脚本介入 AI 决策流

> **源码位置**：`src/utils/hooks/`（17 个文件）
> **配置方式**：`settings.json` 的 `hooks` 字段，或 `.claude/settings.json`

---

## 一句话理解

Hooks 让你用**自己的脚本**介入 Claude 的工作流——在工具执行前后、Claude 开始回复前、会话开始时……都能插入自定义逻辑。

```
用户脚本 hooks ≈ 操作系统钩子 / 浏览器插件 / 框架中间件
```

---

## Hooks 能做什么

| 场景 | 使用的 Hook 事件 |
|------|----------------|
| 阻止 Claude 执行危险的 bash 命令 | `PreToolUse` → 退出码 2 |
| 记录所有文件修改到审计日志 | `PostToolUse` |
| 用户每次提交 prompt 时先做敏感词过滤 | `UserPromptSubmit` |
| Claude 完成响应时发送系统通知 | `Stop` |
| 会话开始时注入项目上下文 | `SessionStart` |
| 在 `/compact` 前追加自定义摘要指令 | `PreCompact` |
| 自动监控 `.env` 文件变化 | `FileChanged` |

---

## 完整 Hook 事件列表（27 个）

### 工具相关

| 事件 | 触发时机 | 输入 | 退出码 2 的效果 |
|------|---------|------|--------------|
| `PreToolUse` | 工具执行前 | JSON：工具参数 | **阻止工具执行**，错误信息传给 Claude |
| `PostToolUse` | 工具执行后 | JSON：`{inputs, response}` | 错误信息立即传给 Claude |
| `PostToolUseFailure` | 工具执行失败 | JSON：`{tool_name, error, error_type, is_interrupt, is_timeout}` | 错误信息立即传给 Claude |
| `PermissionDenied` | Auto 模式分类器拒绝工具调用 | JSON：`{tool_name, tool_input, reason}` | 返回 `{"hookSpecificOutput":{"retry":true}}` 可让 Claude 重试 |
| `PermissionRequest` | 权限弹窗显示时 | JSON：`{tool_name, tool_input, tool_use_id}` | 可通过 hookSpecificOutput 决定允许/拒绝 |

### 对话相关

| 事件 | 触发时机 | 退出码 2 的效果 |
|------|---------|--------------|
| `UserPromptSubmit` | 用户提交 prompt 时 | **阻止处理**，清除 prompt，错误显示给用户 |
| `Stop` | Claude 完成响应前 | 错误信息传给 Claude，继续对话 |
| `StopFailure` | API 错误导致 Turn 结束 | 忽略（fire-and-forget）|

### 会话生命周期

| 事件 | 触发时机 | 输入中的 `source` |
|------|---------|----------------|
| `SessionStart` | 新会话开始 | `startup` / `resume` / `clear` / `compact` |
| `SessionEnd` | 会话结束 | `clear` / `logout` / `prompt_input_exit` / `other` |

### 压缩相关

| 事件 | 退出码 2 的效果 |
|------|--------------|
| `PreCompact` | **阻止压缩**（stdout 作为自定义压缩指令追加）|
| `PostCompact` | 输出显示给用户 |

### 子代理相关

| 事件 | 说明 |
|------|------|
| `SubagentStart` | AgentTool 子代理启动（stdout 传给子代理）|
| `SubagentStop` | 子代理完成响应前（退出码 2 继续让子代理运行）|

### 工作区和文件

| 事件 | 说明 |
|------|------|
| `CwdChanged` | 工作目录改变（可通过 `CLAUDE_ENV_FILE` 更新环境变量）|
| `FileChanged` | 被监控的文件发生变化（需先通过 `CwdChanged` 返回 `watchPaths`）|
| `WorktreeCreate` | 请求创建 Worktree（stdout 返回 worktree 路径）|
| `WorktreeRemove` | 请求删除 Worktree |

### 多人协作（KAIROS 专属）

| 事件 | 说明 |
|------|------|
| `TeammateIdle` | 队友即将进入空闲（退出码 2 阻止空闲）|
| `TaskCreated` | 任务被创建（退出码 2 阻止创建）|
| `TaskCompleted` | 任务被标记完成（退出码 2 阻止完成）|

### MCP 相关

| 事件 | 说明 |
|------|------|
| `Elicitation` | MCP 服务器请求用户输入（可通过 hookSpecificOutput 自动回复）|
| `ElicitationResult` | 用户回答 MCP 请求后（可覆盖用户回答）|

### 配置与设置

| 事件 | 说明 |
|------|------|
| `Setup` | `init` 或 `maintenance` 触发，用于仓库初始化/维护 |
| `ConfigChange` | 配置文件在运行时变化（退出码 2 阻止配置生效）|
| `InstructionsLoaded` | CLAUDE.md 被加载（仅观测，不支持阻止）|
| `Notification` | 通知发送时（`permission_prompt` / `idle_prompt` 等）|

---

## 三种 Hook 执行方式

### 1. Shell 命令（最常用）

```json
// ~/.claude/settings.json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "jq -e '.command | test(\"^rm\")' && echo '禁止删除文件' >&2 && exit 2 || exit 0"
      }]
    }]
  }
}
```

### 2. HTTP Hook

```json
{
  "hooks": {
    "PostToolUse": [{
      "hooks": [{
        "type": "http",
        "url": "https://my-audit-server.com/hook",
        "method": "POST"
      }]
    }]
  }
}
```

### 3. Agent Hook（调用 Claude 处理）

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "agent",
        "prompt": "请检查刚刚完成的工作是否符合项目规范"
      }]
    }]
  }
}
```

---

## 退出码规则（通用）

| 退出码 | 效果 |
|--------|------|
| 0 | 成功，stdout 按事件规则传递（部分事件传给 Claude，部分传给用户）|
| **2** | **阻断/影响 Claude**：stderr 传给模型（或触发特殊行为）|
| 其他 | stderr 只显示给用户，不影响 Claude |

退出码 2 是"给 Claude 看的"，其他非零退出码是"给用户看的"——这个设计让 hook 既能告诉用户发生了什么，又能控制 Claude 的行为。

---

## Hook 来源（HookSource）

```typescript
type HookSource =
  | 'user_settings'      // ~/.claude/settings.json
  | 'project_settings'   // .claude/settings.json
  | 'local_settings'     // .claude/settings.local.json
  | 'policySettings'     // 企业策略（只读）
  | 'pluginHook'         // MCP 插件注册
  | 'sessionHook'        // 运行时临时注册
  | 'builtinHook'        // Claude Code 内置钩子（压缩相关）
```

优先级：policy > project > local > user > session > builtin

---

## Matcher：精细化匹配

可以用 `matcher` 字段限制 hook 只在特定条件下触发：

```json
// 只拦截 Bash 工具
{"matcher": "Bash", "hooks": [...]}

// 使用正则：只拦截文件写入类工具
{"matcher": "^(str_replace|create_file|write_file)", "hooks": [...]}

// 匹配特定通知类型
{"matcher": "permission_prompt", "hooks": [...]}
```

---

## AsyncHookRegistry：并发管理

`AsyncHookRegistry.ts` 管理同时运行的 hook 进程：

```typescript
// 所有 hook 事件类型都能并发运行多个进程
// 用于追踪进行中的 hook（UI 进度显示）
// 强制中止超时的 hook（防止 hook 卡住整个流程）
```

---

## ssrfGuard：HTTP Hook 安全防护

HTTP 类型的 hook 调用外部 URL 时，`ssrfGuard.ts` 防止 SSRF（服务器端请求伪造）：

```typescript
// 检查 URL 是否指向内网地址
// 拒绝 127.0.0.1、169.254.x.x（云元数据）、10.x.x.x 等
// 防止 Claude 被攻击者利用 hook 访问内网服务
```

---

## 下一步

- [3.7 查询引擎详解（续）](./03-query-engine.md)
- [4.3 权限系统](../ch04-tools/03-permission-system.md) — Hooks 与权限系统的交互
