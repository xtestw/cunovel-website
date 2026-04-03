# 2.4 UI 层：React + Ink 的终端渲染原理

> **章节目标**：理解为什么在终端里用 React，以及 Ink 如何让组件思维在 CLI 中成为可能。

---

## Ink 是什么

[Ink](https://github.com/vadimdemedes/ink) 是一个把 React 渲染到终端的库。它的工作原理类似于 React Native——React Native 把 React 渲染成 iOS/Android 原生组件，Ink 把 React 渲染成 ANSI 终端字符。

```
React Virtual DOM → Ink Renderer → ANSI 转义码 → 终端
```

你写的是 React JSX，用户看到的是终端 UI。

---

## 为什么不用传统 CLI 框架？

传统 CLI 工具用 `console.log` 输出文字，用 `readline` 处理输入。Claude Code 选择 React + Ink 是因为：

### 1. 状态驱动的 UI 更新

Claude Code 的 UI 状态极其复杂：

```
当前正在流式输出的 AI 响应文字
+ 多个并行工具的执行进度
+ 权限确认弹窗（等待用户按键）
+ 底部的 token/cost 状态栏
+ 折叠/展开的历史消息
```

用 `console.log` 实现这种 UI 需要手动处理光标位置、ANSI 清屏、行覆盖……极其繁琐且容易出 bug。而 React 的响应式更新让这一切自动化：状态变了，UI 自动更新。

### 2. 组件化 = 可维护性

```typescript
// src/components/ToolResult.tsx（示意）
function ToolResult({ tool, result, isExpanded }: Props) {
  if (!isExpanded) {
    return <Text dimColor>{tool.name}: {truncate(result)}</Text>
  }
  return (
    <Box flexDirection="column" borderStyle="single">
      <Text bold>{tool.name}</Text>
      <Text>{result}</Text>
    </Box>
  )
}
```

这和 Web 前端组件一模一样。新增功能只需新增组件，不影响其他部分。

### 3. Hooks = 逻辑复用

87 个自定义 Hooks 涵盖各种可复用逻辑：

```typescript
// 典型的自定义 Hook
function useCanUseTool(tool: Tool, input: unknown): PermissionResult {
  const permContext = useContext(PermissionContext)
  // ... 权限判断逻辑
  return result
}

// 在任何需要权限检查的组件里直接用
function ToolExecutor({ tool }) {
  const permission = useCanUseTool(tool, tool.input)
  if (permission.behavior === 'ask') {
    return <PermissionRequest tool={tool} />
  }
  return <ToolProgress tool={tool} />
}
```

---

## Ink 的核心 API

Claude Code 使用的 Ink 组件：

| 组件 | 用途 | 类比 Web |
|------|------|---------|
| `<Box>` | 布局容器，支持 flexbox | `<div>` |
| `<Text>` | 文字，支持颜色/粗体/斜体 | `<span>` |
| `<Newline>` | 换行 | `<br>` |
| `<Spacer>` | 填充空间 | CSS `flex: 1` |
| `useInput()` | 捕获键盘输入 | `addEventListener('keydown')` |
| `useApp()` | 访问 Ink 应用实例 | — |
| `useStdout()` | 访问 stdout | — |

---

## 实际 UI 的关键组件

### 主对话界面（REPL.tsx）

```
┌────────────────────────────────────────────────┐
│  [消息历史区域]                                   │
│  User: 帮我重构这个文件                           │
│  Assistant: 我来看一下这个文件...                  │
│    ✓ FileReadTool: src/main.ts (1.2KB 读取)     │
│    ✓ FileEditTool: src/main.ts (已修改)          │
│  已完成重构，主要改动是...                         │
│                                                 │
│  [输入区域]                                      │
│  > _                                            │
├────────────────────────────────────────────────┤
│  claude-3-5-sonnet · $0.0142 · 3.2k tokens     │
└────────────────────────────────────────────────┘
```

### 权限确认弹窗

```
┌─ 权限请求 ─────────────────────────────────────┐
│                                                │
│  Claude 想要执行以下 Bash 命令：                  │
│                                                │
│  $ rm -rf node_modules && npm install          │
│                                                │
│  ❯ 允许本次                                     │
│    允许整个会话                                  │
│    总是允许                                     │
│    拒绝                                         │
│                                                │
└────────────────────────────────────────────────┘
```

这是一个完整的 React 组件，用 `useInput()` 捕获上下键和回车键。

---

## 流式渲染的工作原理

Claude Code 的流式响应渲染是其 UI 的核心挑战。当 API 流式返回 token 时，需要逐字更新显示：

```typescript
// 简化的流式渲染逻辑
function AssistantMessage({ stream }: { stream: AsyncIterable<Token> }) {
  const [text, setText] = useState('')

  useEffect(() => {
    async function consume() {
      for await (const token of stream) {
        setText(prev => prev + token.text)
      }
    }
    consume()
  }, [stream])

  return <Text>{text}</Text>
}
```

每次 `setText` 调用都触发 React 重渲染，Ink 计算 diff 并更新终端对应行。在终端里实现了和网页版 ChatGPT 一样的流式打字效果。

---

## 关键的渲染优化

### 1. 懒加载 UI 组件

```typescript
// src/QueryEngine.ts 中的注释
// Lazy: MessageSelector.tsx pulls React/ink; only needed for message filtering at query time
const messageSelector =
  (): typeof import('src/components/MessageSelector.js') =>
    require('src/components/MessageSelector.js')
```

React/Ink 组件只在需要时加载，减少初始启动时间。

### 2. 宽终端自适应

窄终端（< 60 列）自动退化显示：Buddy 宠物的 ASCII 精灵退化为文字表情脸（`=·ω·=`），布局从多列退化为单列。

---

## 下一步

- [第三章：核心引擎](../ch03-core-engine/01-conversation-lifecycle.md) — 理解 AI Agent 主循环
