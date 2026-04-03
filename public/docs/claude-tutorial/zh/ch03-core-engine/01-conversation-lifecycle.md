# 3.1 一次对话的完整生命周期

> **章节目标**：从宏观视角理解 Claude Code 如何处理一次用户请求，包括每个阶段发生了什么。

---

## 整体流程图

```
用户按下 Enter
      │
      ▼
┌─────────────────────────────────────────────┐
│ 阶段 1：输入处理                              │
│ - 解析是否为斜杠命令（/help, /clear...）       │
│ - 处理图片/文件附件                            │
│ - 记录到会话历史                               │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│ 阶段 2：上下文构建                            │
│ - 构建 System Prompt（工具描述、项目信息）     │
│ - 注入 CLAUDE.md 内容                        │
│ - 注入 git 状态快照                           │
│ - 加载记忆文件（MEMORY.md）                   │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│ 阶段 3：API 调用（流式）                      │
│ - 格式化消息数组（含历史）                     │
│ - 选择模型（主模型 / 备用模型）               │
│ - 调用 Anthropic API（or Bedrock/Vertex）    │
│ - 流式接收 token                             │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│ 阶段 4：响应处理循环                          │
│                                              │
│  loop:                                       │
│    接收 Assistant Message                    │
│    if tool_use:                              │
│      → 权限检查（canUseTool）                │
│      → 并发执行所有工具                       │
│      → 收集工具结果                           │
│      → 追加到消息历史                         │
│      → 继续下一次 API 调用                    │
│    if end_turn:                              │
│      → 退出循环                              │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│ 阶段 5：收尾工作                              │
│ - 持久化会话历史到磁盘                        │
│ - 更新成本追踪（token / USD）                 │
│ - 触发 post_turn hooks                       │
│ - 更新 OpenTelemetry 指标                    │
└─────────────────────────────────────────────┘
```

---

## 关键数据结构：Message

整个生命周期围绕 `Message[]` 数组展开。每条消息有类型：

```typescript
type Message =
  | UserMessage           // 用户输入
  | AssistantMessage      // AI 响应（可含 tool_use）
  | SystemMessage         // 系统消息（工具结果、状态通知）
  | ProgressMessage       // 工具执行进度（仅 UI 显示，不发给 API）
  | ToolUseSummaryMessage // 工具使用摘要（compact 时替换工具调用历史）
  | TombstoneMessage      // 被删除消息的占位符
```

API 只能收到 `UserMessage` 和 `AssistantMessage`，其他类型在 `normalizeMessagesForAPI()` 时被过滤掉。

---

## 什么是"Turn"？

一个 Turn（轮次）= 从用户发一条消息，到 Claude 最终返回纯文本响应（`stop_reason = 'end_turn'`）。

一个 Turn 内部可能有**多次 API 调用**（每次工具调用后 Claude 需要再次调用 API 来继续思考）：

```
Turn 1 开始:
  用户: "帮我修复这个 bug"
    │
    ├── API 调用 1: Claude 说 "我来看一下代码"，调用 FileReadTool
    │   └── 执行 FileReadTool → 得到文件内容
    │
    ├── API 调用 2: Claude 说 "我来修复"，调用 FileEditTool  
    │   └── 执行 FileEditTool → 修改成功
    │
    └── API 调用 3: Claude 说 "已修复，原因是..." ← end_turn，Turn 结束
```

每次工具调用都是一次完整的 API 往返，`query.ts` 的 `queryLoop` 函数通过 while 循环实现这个行为。

---

## 异步 Generator：边生成边消费

`query()` 函数是一个 **async generator**：

```typescript
export async function* query(params: QueryParams): AsyncGenerator<...> {
  yield* queryLoop(params, ...)
}
```

这个设计的优雅之处在于：
- UI 层用 `for await` 消费：每个 `yield` 出来的事件立即渲染到终端
- 流式 token 直接 `yield`，不等完整响应就显示给用户
- 工具执行进度实时更新

---

## 错误恢复机制

`query.ts` 里有几种自动恢复机制：

| 错误类型 | 恢复策略 |
|---------|---------|
| `max_output_tokens` | 重试最多 3 次，每次尝试继续未完成的输出 |
| 上下文超长 | 触发 AutoCompact，压缩历史 → 继续 |
| API 网络错误 | 带退避的自动重试（`withRetry`） |
| 工具执行失败 | 把错误信息作为工具结果返回给 Claude，让它自己处理 |

---

## 下一步

- [3.2 query.ts：主循环的源码精读](./02-query-loop.md) — 深入 queryLoop 函数
- [3.3 QueryEngine：会话状态管理器](./03-query-engine.md) — 理解 submitMessage
