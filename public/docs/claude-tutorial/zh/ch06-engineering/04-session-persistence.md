# 6.4 会话持久化与历史记录

> **章节目标**：理解 Claude Code 如何在磁盘上持久化对话历史，以及 Resume 功能的实现原理。

---

## 对话历史的重要性

Claude Code 的一个核心优势是**会话可以恢复**：

```bash
# 开始一个会话
claude

# 做了大量工作后，按 Ctrl+C 退出
# 或者系统崩溃...

# 第二天
claude --resume  # 从上次中断的地方继续
```

这需要把整个对话历史（包括所有工具调用和结果）完整地持久化到磁盘。

---

## 存储位置

```
~/.claude/projects/
    └── <project-id>/          ← 项目 ID（基于项目路径的哈希）
          └── sessions/
                └── <session-uuid>.jsonl  ← 对话历史文件
                
~/.claude/projects/
    └── <project-id>/
          └── sessions/
                ├── 01JXXXXX.jsonl    ← 最新会话
                ├── 01JXXXXY.jsonl    ← 次新会话
                └── ...
```

每个会话一个 `.jsonl` 文件（JSON Lines 格式——每行一个 JSON 对象）。

---

## flushSessionStorage()

`src/utils/sessionStorage.ts` 是持久化的核心入口：

```typescript
// src/utils/sessionStorage.ts
export async function flushSessionStorage(
  messages: Message[],
  sessionId: SessionId,
  cwd: string,
  options?: {
    compactBoundaryMessage?: CompactBoundaryMessage
  },
): Promise<void>
```

**调用时机**：
- 每次 Turn 结束后（`submitMessage` 的末尾）
- 用户中断时（Ctrl+C 信号处理）
- 应用正常退出时

**为什么是 JSONL 而不是 JSON？**

JSONL 的优势在于**追加写入**：

```javascript
// JSON：必须读取整个文件、解析、追加、重写整个文件
const data = JSON.parse(readFileSync('session.json'))
data.messages.push(newMessage)
writeFileSync('session.json', JSON.stringify(data))

// JSONL：直接在文件末尾追加一行
appendFileSync('session.jsonl', JSON.stringify(newMessage) + '\n')
```

JSONL 的追加操作是原子的（文件系统层面），即使写入过程中进程崩溃，已有的消息也不会损坏。

---

## 消息序列化格式

每行存储一个 `Message`，但在写入前会进行**清理**：

```typescript
// 写入时清理
function serializeMessageForStorage(msg: Message): StoredMessage {
  // 1. 移除 toolUseResult（大型工具结果，按需重建）
  // 2. 保留所有其他字段（type, uuid, content, timestamp...）
  return { ...msg, toolUseResult: undefined }
}
```

`toolUseResult` 是工具结果的原始形式，可以从 `tool_result` 内容块重建，所以不必持久化（减小文件大小）。

---

## recordTranscript()

```typescript
export function recordTranscript(
  message: Message,
  sessionId: SessionId,
  cwd: string,
): void
```

`recordTranscript` 是即时的（同步或快速异步）写入，在每条消息产生时立即记录，而不等到 Turn 结束。

区别：
- `recordTranscript`：实时记录，用于崩溃恢复（即使 Turn 没完成，已有消息也已写入）
- `flushSessionStorage`：Turn 结束后的完整持久化，写入整洁的最终状态

---

## contentReplacement：工具结果预算

大型工具结果（如读取大文件）不直接存入对话历史，而是通过 `contentReplacementState` 机制：

```typescript
// src/utils/toolResultStorage.ts
type ContentReplacementState = {
  replacements: Map<string, ContentReplacement>  // toolUseId → 替代文本
  totalTokens: number
}
```

当工具结果超过 token 预算时：
1. 完整结果存储到 `~/.claude/tool-results/<uuid>` 文件
2. 对话历史中只存储引用：`[Tool result stored externally: tool-results/<uuid>]`
3. 需要时可以按需读取完整内容

```typescript
// 记录替换关系
export async function recordContentReplacement(
  toolUseId: string,
  replacement: ContentReplacement,
  state: ContentReplacementState,
): Promise<void>
```

---

## 会话 Resume：恢复对话

```bash
# 交互式选择恢复
claude --resume

# 直接指定 session ID
claude --resume --session-id 01JXXXXX
```

恢复流程：

```
1. 读取项目目录下所有 .jsonl 文件
2. 按修改时间排序（最近优先）
3. 用户选择 session（或自动选最近一个）
4. 反序列化全部消息 → mutableMessages
5. 如果检测到"未完成的 Turn"（有 tool_use 但没有 tool_result）
   → 自动处理：yieldMissingToolResultBlocks() 生成错误 tool_result
6. 正常启动会话，历史消息已加载
```

### 未完成 Turn 的处理

```typescript
// src/query.ts
function* yieldMissingToolResultBlocks(
  assistantMessages: AssistantMessage[],
  errorMessage: string,
) {
  for (const assistantMessage of assistantMessages) {
    const toolUseBlocks = assistantMessage.message.content.filter(
      content => content.type === 'tool_use',
    )
    for (const toolUse of toolUseBlocks) {
      yield createUserMessage({
        content: [{
          type: 'tool_result',
          content: errorMessage,   // "会话中断，工具未完成"
          is_error: true,
          tool_use_id: toolUse.id,
        }],
      })
    }
  }
}
```

这保证了恢复后的消息历史符合 Anthropic API 的规范（每个 tool_use 必须有对应的 tool_result）。

---

## 会话持久化开关

```typescript
// 可以禁用持久化（CLI 参数 --no-session-persistence）
export function isSessionPersistenceDisabled(): boolean {
  return isEnvTruthy(process.env.CLAUDE_NO_SESSION_PERSISTENCE)
}
```

某些场景下不需要持久化（如 CI 环境的一次性 headless 调用），通过环境变量关闭。

---

## 文件清理策略

`src/utils/sessionStorage.ts` 中的会话文件清理逻辑：

```typescript
// 每个项目最多保留 N 个会话文件
// 超出时按修改时间删除最旧的文件
const MAX_SESSIONS_PER_PROJECT = 100  // 大约值

// 每个文件大小上限
// 超出时开始清理最旧的消息（trim from beginning）
const MAX_SESSION_FILE_SIZE_BYTES = 50 * 1024 * 1024  // 50MB
```

---

## 总结：完整的持久化数据流

```
用户输入
    ↓
recordTranscript(userMessage)     ← 立即写入磁盘（崩溃保护）
    ↓
工具调用 → recordTranscript(toolResult)  ← 每个工具结果也立即写入
    ↓
Claude 响应 → recordTranscript(assistantMessage)
    ↓
Turn 结束
    ↓
flushSessionStorage(allMessages)  ← Turn 级别的完整同步
    ↓
更新遥测（cost, tokens）
```

这种"双写"（即时 + 批量）策略平衡了**崩溃安全性**（即时写入）和**性能**（批量 flush 避免频繁 I/O）。
