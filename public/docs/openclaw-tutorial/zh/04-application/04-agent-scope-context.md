# Agent 作用域与上下文 🟡

> "作用域"决定了一个 Agent 能看到什么、能访问什么。理解 Agent 的作用域边界，是搭建多 Agent 系统的基础。

## 本章目标

读完本章你将能够：
- 理解 Agent 的作用域由哪些维度构成
- 理解工作目录（workspaceDir）和 Agent 目录（agentDir）的区别
- 掌握 Agent 作用域继承规则
- 理解 Context Window 运行时状态的管理

---

## 一、Agent 的作用域维度

一个 Agent 的"作用域"由以下 8 个维度定义：

```typescript
// agent-scope.ts（ResolvedAgentConfig）
type ResolvedAgentConfig = {
  name?: string;                // Agent 显示名称
  workspace?: string;           // 工作目录路径
  agentDir?: string;            // Agent 专属配置目录
  model?: AgentModelRef;        // 使用的 LLM 模型
  thinkingDefault?: ThinkLevel; // 默认思考模式
  skills?: AgentSkillsFilter;   // 可用的 Skill 集合
  heartbeat?: HeartbeatConfig;  // 心跳主动触发配置
  subagents?: SubagentsConfig;  // 子 Agent 派发权限
  tools?: AgentToolsConfig;     // 允许使用的工具集合
  sandbox?: SandboxConfig;      // 执行沙箱配置
};
```

---

## 二、工作目录 vs Agent 目录

这是一个重要的区分：

| 目录 | 配置字段 | 作用 |
|------|---------|------|
| **工作目录**（workspaceDir）| `workspace` | bash 工具执行的当前目录；文件操作的根目录 |
| **Agent 目录**（agentDir）| `agentDir` | 存放 Agent 专属配置（CLAUDE.md、身份文件等）|

```yaml
# config.yaml
agents:
  list:
    - id: frontend-agent
      workspace: /project/frontend    # bash 执行在 frontend/ 目录
      agentDir: /project/.agents/frontend  # Agent 配置在此目录

    - id: backend-agent
      workspace: /project/backend
      agentDir: /project/.agents/backend
```

### 为什么要分离？

- **安全隔离**：限制 Agent 的文件操作范围（bash 工具限定在 workspace 内）
- **多 Agent 共享项目**：多个 Agent 可以共享同一个 workspace，但有各自的配置
- **CLAUDE.md 分层加载**：Agent 从 agentDir 开始，向上查找 CLAUDE.md 文件

---

## 三、CLAUDE.md 的层次加载

Bootstrap 时，Agent 会从 agentDir 开始，逐层向上查找 `CLAUDE.md`（或 `AGENTS.md`、`.clawconfig.md`）：

```
加载顺序（从上到下）：
/                               ← 根目录
  └── CLAUDE.md                 ← 最低优先级（全局规范）
       └── /project/
            └── CLAUDE.md       ← 项目级规范
                 └── /project/backend/
                      └── CLAUDE.md ← 最高优先级（模块规范）
```

规则：
- 所有层的 CLAUDE.md 都会被加载（不是只取最近的）
- 内容按"离 Agent 越近，放在 System Prompt 越靠前"的顺序排列
- Token 预算不足时，优先保留靠近 Agent 的 CLAUDE.md

---

## 四、Context Window 运行时状态

`src/agents/context-runtime-state.ts` 管理运行时的 Context Window 信息：

```typescript
// context-runtime-state.ts
type ContextWindowRuntimeState = {
  // 已知的 Context Window 大小（按模型 ID 缓存）
  contextWindows: Map<string, number>;
  // 当前会话的 Token 使用量（实时更新）
  currentUsage: Map<string, number>;
};
```

Context Window 信息来源：
1. **Provider 报告**：每次 API 调用后，Provider 返回已使用的 Token 数
2. **模型目录**（model catalog）：已知模型的 Context Window 大小
3. **配置覆盖**：`config.yaml` 中手动配置的 Context Window 大小

实时用量在每轮对话后更新，用于：
- 触发 Compaction（当接近 Context Window 上限时）
- UI 显示（如 Web 界面的 Token 进度条）
- Bootstrap 预算计算（决定能注入多少 Skill 文件）

---

## 五、Identity（身份）系统

每个 Agent 可以有自己的"身份"——包括名字、头像 URL、个性设置：

```yaml
# config.yaml
agents:
  list:
    - id: main
      identity:
        name: Alex          # AI 助手的名字
        avatarUrl: "https://example.com/alex.png"
        humanDelay: true    # 模拟人类回复延迟（更自然）
        perChannelPrefix:   # 在不同渠道前缀不同
          telegram: "🤖"
          discord: "**Alex**"
```

`identity.ts` 和 `identity-avatar.ts` 实现了身份解析逻辑：

```typescript
// identity.ts（节选）
type ResolvedAgentIdentity = {
  name: string;          // 解析后的 Agent 名称
  avatarUrl?: string;    // 头像 URL
  systemPromptPrefix?: string; // System Prompt 中的身份前缀
};
```

身份信息会被注入 System Prompt 的最开头，作为 AI 的"自我定义"：

```
You are Alex, a helpful AI assistant.
...（其他 System Prompt 内容）
```

---

## 六、GroupChat 上下文

在群组聊天中（Telegram 群、Discord 频道），Agent 需要额外的上下文来判断哪些消息是针对自己的：

```yaml
# config.yaml
agents:
  list:
    - id: main
      groupChat:
        respondToMentions: true     # @提及时响应
        respondToBotCommands: true  # /command 时响应
        threadMode: auto            # 自动在线程中回复（减少群组刷屏）
```

`groupChat` 配置影响 Agent 对群组消息的处理策略，决定是否接收消息和如何回复。

---

## 关键源码索引

| 文件 | 大小 | 作用 |
|------|------|------|
| `src/agents/agent-scope.ts` | 11KB | Agent 作用域解析核心 |
| `src/agents/context.ts` | 15KB | Context 管理（消息历史） |
| `src/agents/context-runtime-state.ts` | 1.4KB | Context Window 运行时状态 |
| `src/agents/identity.ts` | 5KB | Agent 身份解析 |
| `src/agents/identity-avatar.ts` | 2.96KB | 头像处理 |
| `src/agents/identity.per-channel-prefix.test.ts` | 10KB | 渠道前缀测试 |

---

## 小结

1. **8 维作用域**：名称、工作目录、Agent 目录、模型、思考模式、Skill、心跳、子 Agent 权限、工具、沙箱。
2. **workspaceDir ≠ agentDir**：工作目录是 bash 执行的根；Agent 目录存放配置文件。
3. **CLAUDE.md 层次加载**：从 agentDir 向上遍历，所有层的文件都会加载，靠近 Agent 的优先级更高。
4. **Context Window 运行时状态**：Provider 报告的 Token 用量实时更新，驱动 Compaction 和 Bootstrap 预算。
5. **Identity 系统**：每个 Agent 可有独立的名字、头像、渠道前缀，注入 System Prompt。

---

*[← 多 Agent 协作](03-multi-agent.md) | [→ 自动化与定时任务](05-automation-cron.md)*
