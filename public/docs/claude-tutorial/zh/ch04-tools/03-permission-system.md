# 4.3 权限系统：canUseTool 决策链

> **章节目标**：理解 Claude Code 如何决定"Claude 是否被允许执行某个工具"，掌握整个权限决策流程。

---

## 权限系统的设计目标

Claude Code 需要在两个极端之间找到平衡：

- **太严格**：每次操作都需要用户确认 → 效率极低，影响使用体验
- **太宽松**：Claude 可以随意执行任何命令 → 安全风险极高

权限系统的设计目标是：**让安全的操作自动进行，让危险的操作必须经过确认**。

---

## PermissionMode：权限模式

整个系统的顶层控制是 `PermissionMode`：

```typescript
type PermissionMode =
  | 'default'            // 标准模式（读操作自动批准，写操作需确认）
  | 'acceptEdits'        // 接受所有编辑（写文件自动批准，但 Bash 仍需确认）
  | 'bypassPermissions'  // 绕过所有权限（--dangerously-skip-permissions）
  | 'plan'               // 计划模式（Claude 只能分析，不能执行）
```

存储在 React AppState 的 `toolPermissionContext.mode` 中。

---

## 权限规则：三类规则

```typescript
type ToolPermissionRulesBySource = {
  [source: string]: ToolPermissionRule[]  // source = 'settings' | 'cli' | 'user'
}

type ToolPermissionRule =
  | { type: 'bash_command_prefix'; value: string }  // 允许/拒绝特定 Bash 前缀
  | { type: 'mcp_tool'; serverName: string; toolName: string }
  | { type: 'tool'; toolName: string }
  | { type: 'file_path'; value: string }            // 允许/拒绝特定文件路径
```

三类规则（存储在 `toolPermissionContext`）：

- **alwaysAllowRules**：匹配则直接允许，不需要用户确认
- **alwaysDenyRules**：匹配则直接拒绝（永久黑名单）
- **alwaysAskRules**：匹配则每次都问用户

---

## CanUseToolFn：权限函数签名

```typescript
type CanUseToolFn = (
  tool: Tool,
  input: unknown,
  toolUseContext: ToolUseContext,
  assistantMessage: AssistantMessage,
  toolUseID: string,
  forceDecision?: 'allow' | 'reject',
) => Promise<PermissionResult>

type PermissionResult = {
  behavior: 'allow' | 'ask' | 'reject'
  decisionReason?: string
  updater?: (prev: AppState) => AppState  // 如果用户选择"总是允许"，更新规则的函数
}
```

---

## 决策链（7 步）

```
canUseTool(tool, input) 被调用
        │
        ▼
1. forceDecision 覆盖？
   → 如果传入 'allow'/'reject'，直接返回
        │
        ▼
2. 是否 bypassPermissions 模式？
   → 是：直接 allow（--dangerously-skip-permissions）
        │
        ▼
3. 是否计划模式（plan mode）？
   → 是：工具必须是 readonly → allow，否则 → ask
        │
        ▼
4. 工具本身是否 isReadOnly() = true？
   → 是：大部分情况直接 allow
   → 例外：如果用户设置了 alwaysDenyRules 匹配，仍然 reject
        │
        ▼
5. 检查 alwaysDenyRules
   → 匹配：reject，不允许执行
        │
        ▼
6. 检查 alwaysAllowRules
   → 匹配：allow，跳过用户确认
        │
        ▼
7. 工具特定的 checkPermissions()
   → BashTool：检查命令是否匹配已批准的前缀
   → FileEditTool：检查路径是否在允许的工作目录内
   → AgentTool：检查是否超过最大嵌套深度
        │
        ▼
   行为 = 'ask' → 触发 UI 权限弹窗 → 等待用户响应
```

---

## 路径权限：additionalWorkingDirectories

Claude Code 默认只允许在当前工作目录（`cwd`）内操作文件。通过 `additionalWorkingDirectories` 可以扩展允许的路径范围：

```typescript
// 在 toolPermissionContext 中
additionalWorkingDirectories: Map<string, AdditionalWorkingDirectory>
```

每个 `AdditionalWorkingDirectory` 记录：
- 路径
- 是否自动批准（`autoApproved: true`）— 添加时不需要确认，重启会消失
- 是否需要确认（`requiresConfirmation: true`）— 首次使用时需要确认

**实际检查**（`src/utils/permissions/filesystem.ts`）：

```typescript
export function isPathAllowed(
  filePath: string,
  cwd: string,
  additionalDirs: Map<string, AdditionalWorkingDirectory>,
): boolean {
  // 1. 检查是否在当前 cwd 下
  if (isSubPath(filePath, cwd)) return true
  
  // 2. 检查是否在 additionalDirs 下
  for (const [dir] of additionalDirs) {
    if (isSubPath(filePath, dir)) return true
  }
  
  return false
}
```

---

## 权限弹窗：用户看到什么

当 `behavior = 'ask'` 时，`PermissionRequest` 组件显示：

```
╔═ 权限请求 ════════════════════════╗
║                                  ║
║  Claude 想要执行以下命令：          ║
║                                  ║
║  rm -rf dist/                    ║
║                                  ║
║  ❯ 允许本次                       ║
║    允许整个会话                    ║
║    总是允许 (永久保存)              ║
║    拒绝                           ║
║    拒绝并发送原因                   ║
╚══════════════════════════════════╝
```

选择结果：
- **允许本次**：这次执行，下次再问
- **允许整个会话**：添加到 session-level `alwaysAllowRules`（不持久化）
- **总是允许**：写入 `~/.claude/settings.json` 的 `alwaysAllowRules`（永久）
- **拒绝**：返回 `behavior: 'reject'`，Claude 收到拒绝原因
- **拒绝并发送原因**：显示文本框，让用户说明为什么拒绝

---

## 权限拒绝计数（denial tracking）

```typescript
// src/utils/permissions/denialTracking.ts
type DenialTrackingState = {
  denialCount: number
  lastDeniedAt: number | null
}
```

系统追踪拒绝次数。当 Claude 连续被拒绝多次时，系统会触发"降级模式"——自动显示 UI 权限弹窗而不是通过 hooks 自动处理，防止 Claude 在无监督情况下反复尝试被拒绝的操作。

---

## 下一步

- [4.4 MCP 协议：工具的扩展边界](./04-mcp-tools.md) — 了解外部工具如何接入
- [4.5 工具并发与编排](./05-tool-orchestration.md) — 多工具并行执行
