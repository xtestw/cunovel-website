# 3.4 System Prompt 的构建机制

> **章节目标**：理解每次对话开始前，Claude Code 如何动态构建 System Prompt，包含哪些信息。

---

## System Prompt 不是静态的

许多人以为 System Prompt 是一段固定文字。但在 Claude Code 里，每次对话开始时，System Prompt 都会**实时动态构建**，注入当前环境的真实状态。

---

## fetchSystemPromptParts()

System Prompt 的构建入口在 `src/utils/queryContext.ts` 的 `fetchSystemPromptParts()` 函数：

```typescript
export async function fetchSystemPromptParts({
  tools,
  mainLoopModel,
  additionalWorkingDirectories,
  mcpClients,
  customSystemPrompt,
}: FetchSystemPromptOptions): Promise<{
  defaultSystemPrompt: string[]  // 核心系统提示部分
  userContext: { [k: string]: string }  // 注入 <user-context> 的键值对
  systemContext: { [k: string]: string } // 注入 <system-context> 的键值对
}>
```

---

## 构建的各个部分

### 1. 核心人设提示

这是 Claude 的"基础人格"：
```
你是 Claude Code，一个由 Anthropic 制作的 AI 助手，专注于软件工程任务...
```

包含：
- 角色定义
- 能力说明
- 行为准则（如何处理不确定的情况）
- 安全规则

### 2. Git 状态快照（`getGitStatus()`）

如果当前目录是 git 仓库，自动注入：

```
This is the git status at the start of the conversation.

Current branch: feature/add-auth
Main branch (you will usually use this for PRs): main
Git user: xuwei
Status:
 M src/auth/login.ts
 M src/auth/session.ts
?? src/auth/oauth.ts

Recent commits:
abc1234 Add OAuth provider scaffold
def5678 Fix session expiry bug
```

这让 Claude 在对话一开始就知道你在哪个分支、有哪些未提交的修改。

注意源码注释：`Note that this status is a snapshot in time, and will not update during the conversation.`——这是一个**快照**，不会实时更新。如果需要最新状态，需要用 BashTool 执行 `git status`。

### 3. CLAUDE.md 内容

```typescript
// src/utils/claudemd.ts
export async function getClaudeMds(cwd: string): Promise<ClaudeMdFile[]>
```

Claude Code 递归搜索以下位置的 `CLAUDE.md`：
- `~/.claude/CLAUDE.md`（全局用户配置）
- `<project>/CLAUDE.md`（项目配置）
- `<project>/<subdir>/CLAUDE.md`（子目录配置，按需加载）

CLAUDE.md 的内容直接注入 System Prompt，这是用户/团队自定义 Claude 行为的主要方式。

### 4. 工具描述

每个工具的 JSON Schema 描述都会注入 System Prompt，让 Claude 知道有哪些工具可用，以及每个工具的参数格式。

```typescript
// 工具描述示例（BashTool）
{
  name: 'Bash',
  description: 'Execute shell commands...',
  input_schema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The shell command to execute' },
      timeout: { type: 'number', description: 'Timeout in milliseconds' },
    },
    required: ['command']
  }
}
```

### 5. 记忆文件（MEMORY.md）

如果启用了记忆功能（`EXTRACT_MEMORIES` 编译开关），系统会注入用户的长期记忆：

```typescript
// src/memdir/memdir.ts
export async function loadMemoryPrompt(): Promise<string | null>
```

---

## userContext vs systemContext

这两种 Context 以不同的 XML 标签注入到 System Prompt 末尾：

```
<user-context>
  今天是 2026年04月02日。
  当前工作目录：/Users/xuwei/projects/myapp
  [Coordinator 模式下：Workers 可用的工具列表...]
</user-context>

<system-context>
  [Coordinator 模式下的系统级指令...]
</system-context>
```

`userContext` 包含动态的、每次调用都可能变化的信息（日期、CWD、配置）。

`systemContext` 包含架构级的系统指令（如 Coordinator 模式的调度规则）。

---

## System Prompt 的大小限制

每次构建 System Prompt 时，git status 的长度有上限：

```typescript
const MAX_STATUS_CHARS = 2000

const truncatedStatus =
  status.length > MAX_STATUS_CHARS
    ? status.substring(0, MAX_STATUS_CHARS) +
      '\n... (truncated because it exceeds 2k characters. If you need more information, run "git status" using BashTool)'
    : status
```

当 git status 超过 2000 字符时，自动截断并告知 Claude 如何获取完整信息。

---

## Coordinator 模式的特殊注入

在 Coordinator 模式下，`getCoordinatorUserContext()` 额外注入：

```typescript
// src/coordinator/coordinatorMode.ts
export function getCoordinatorUserContext(
  mcpClients: ReadonlyArray<{ name: string }>,
  scratchpadDir?: string,
): { [k: string]: string } {
  // 注入 Worker 可用的工具列表
  return { workerToolsContext: `Workers spawned via the Agent tool have access to these tools: ...` }
}
```

以及 `getCoordinatorSystemPrompt()` 返回完整的 Coordinator 角色设定（400+ 行），定义了 Coordinator 如何调度 Worker、处理任务、禁止什么行为等。

---

## 下一步

- [3.5 Context 压缩：对话历史如何不爆炸](./05-context-compact.md)
- [第四章：工具系统](../ch04-tools/01-tool-abstraction.md) — 53 个工具的设计
