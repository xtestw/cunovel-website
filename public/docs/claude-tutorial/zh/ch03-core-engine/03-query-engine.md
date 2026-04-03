# 3.3 QueryEngine：会话状态管理器

> **章节目标**：理解 `QueryEngine` 类如何管理多轮对话的状态，以及它与 `query.ts` 的分工。

---

## QueryEngine 的职责

`query.ts` 里的 `queryLoop` 管理的是**单次 Turn 内部**的状态（工具调用循环、上下文压缩）。

`QueryEngine` 管理的是**多个 Turn 之间**的状态（对话历史、用量统计、权限记录）。

```
QueryEngine（会话级别）
    │
    ├── submitMessage() → Turn 1 → queryLoop → 返回
    ├── submitMessage() → Turn 2 → queryLoop → 返回
    └── submitMessage() → Turn 3 → queryLoop → 返回
    
    共享状态：mutableMessages, totalUsage, permissionDenials
```

---

## 类定义与核心字段

```typescript
export class QueryEngine {
  private config: QueryEngineConfig
  
  // 跨 Turn 共享的消息历史
  private mutableMessages: Message[]
  
  // Abort Controller（支持外部中断）
  private abortController: AbortController
  
  // 权限拒绝记录（供 SDK 报告）
  private permissionDenials: SDKPermissionDenial[]
  
  // 累计 token 用量
  private totalUsage: NonNullableUsage
  
  // 已发现的技能名（避免重复上报遥测）
  private discoveredSkillNames = new Set<string>()
  
  // 已加载的嵌套记忆文件路径（避免重复注入）
  private loadedNestedMemoryPaths = new Set<string>()
}
```

---

## submitMessage()：每次对话的入口

```typescript
async *submitMessage(
  prompt: string | ContentBlockParam[],
  options?: { uuid?: string; isMeta?: boolean },
): AsyncGenerator<SDKMessage, void, unknown> {
  // 1. 重置 Turn 级别的追踪状态
  this.discoveredSkillNames.clear()
  setCwd(cwd)
  
  // 2. 构建系统提示
  const { defaultSystemPrompt, userContext, systemContext } = 
    await fetchSystemPromptParts({ tools, ... })
  
  // 3. 处理用户输入（斜杠命令、附件等）
  const processed = await processUserInput(prompt, ...)
  
  // 4. 推送到消息历史
  this.mutableMessages = [...this.mutableMessages, processed.userMessage]
  
  // 5. 调用 query() 主循环
  for await (const message of query({
    messages: this.mutableMessages,
    systemPrompt,
    canUseTool: wrappedCanUseTool,
    ...
  })) {
    // 6. 更新会话状态
    if (isAssistantMessage(message)) {
      this.mutableMessages = [...this.mutableMessages, message]
      this.totalUsage = accumulateUsage(this.totalUsage, message.usage)
    }
    
    // 7. yield 给上层调用者
    yield toSDKMessage(message)
  }
  
  // 8. 持久化会话
  if (persistSession) {
    await flushSessionStorage(this.mutableMessages, ...)
  }
}
```

---

## 权限拒绝追踪

QueryEngine 包装了 `canUseTool` 函数，在不影响原有逻辑的情况下记录每次拒绝：

```typescript
const wrappedCanUseTool: CanUseToolFn = async (...args) => {
  const result = await canUseTool(...args)
  
  if (result.behavior !== 'allow') {
    // 记录被拒绝的工具调用，供 SDK 调用者查询
    this.permissionDenials.push({
      tool_name: sdkCompatToolName(tool.name),
      tool_use_id: toolUseID,
      tool_input: input,
    })
  }
  
  return result
}
```

这是装饰器（Decorator）模式的典型应用：在不修改被装饰函数的情况下，增加额外行为（记录拒绝）。

---

## QueryEngine vs ask()

Claude Code 有两个代码路径：

| 路径 | 使用场景 | 入口 |
|------|---------|------|
| `QueryEngine` | SDK 调用、headless 模式 | `new QueryEngine(config).submitMessage(prompt)` |
| `ask()` | REPL 交互模式 | `src/QueryEngine.ts` 中的 `ask()` 函数 |

两者都最终调用 `query()`，区别在于：
- `QueryEngine` 是面向对象风格，状态存在实例上
- `ask()` 是函数式风格，状态通过 React AppState 传递

注释中明确写道：

> *"One QueryEngine per conversation. Each submitMessage() call starts a new turn within the same conversation."*

---

## 下一步

- [3.4 System Prompt 的构建机制](./04-system-prompt.md) — fetchSystemPromptParts 解析
- [3.5 Context 压缩](./05-context-compact.md) — 对话不爆炸的秘密
