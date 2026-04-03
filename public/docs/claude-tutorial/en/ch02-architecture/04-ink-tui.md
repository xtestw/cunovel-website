# 2.4 UI Layer: Terminal Rendering Principles of React + Ink

> **Chapter goal**: Understand why React is used in the terminal, and how Ink makes component-driven thinking possible in CLI apps.

---

## What Is Ink

[Ink](https://github.com/vadimdemedes/ink) is a library that renders React in the terminal. It works similarly to React Native—React Native renders React into iOS/Android native components, while Ink renders React into ANSI terminal characters.

```
React Virtual DOM → Ink Renderer → ANSI escape codes → Terminal
```

You write React JSX; users see terminal UI.

---

## Why Not Traditional CLI Frameworks?

Traditional CLI tools use `console.log` for output and `readline` for input. Claude Code chooses React + Ink because:

### 1. State-Driven UI Updates

Claude Code's UI state is highly complex:

```
currently streaming AI response text
+ progress of multiple parallel tools
+ permission confirmation modal (waiting for user input)
+ bottom token/cost status bar
+ collapsed/expanded message history
```

Implementing this with `console.log` requires manual cursor control, ANSI screen clearing, and line replacement—complex and bug-prone. React's reactive updates automate all of it: when state changes, UI updates automatically.

### 2. Componentization = Maintainability

```typescript
// src/components/ToolResult.tsx (illustration)
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

This is exactly like web frontend components. New features can be added by adding components without impacting unrelated parts.

### 3. Hooks = Logic Reuse

87 custom Hooks cover reusable logic across the app:

```typescript
// typical custom Hook
function useCanUseTool(tool: Tool, input: unknown): PermissionResult {
  const permContext = useContext(PermissionContext)
  // ... permission logic
  return result
}

// use directly in any component that needs permission checks
function ToolExecutor({ tool }) {
  const permission = useCanUseTool(tool, tool.input)
  if (permission.behavior === 'ask') {
    return <PermissionRequest tool={tool} />
  }
  return <ToolProgress tool={tool} />
}
```

---

## Ink Core API

Ink components used by Claude Code:

| Component | Purpose | Web analogy |
|------|------|---------|
| `<Box>` | layout container with flexbox support | `<div>` |
| `<Text>` | text with color/bold/italic support | `<span>` |
| `<Newline>` | line break | `<br>` |
| `<Spacer>` | fill remaining space | CSS `flex: 1` |
| `useInput()` | capture keyboard input | `addEventListener('keydown')` |
| `useApp()` | access Ink app instance | — |
| `useStdout()` | access stdout | — |

---

## Key Components in the Actual UI

### Main Conversation UI (`REPL.tsx`)

```
┌────────────────────────────────────────────────┐
│  [message history area]                         │
│  User: Help me refactor this file               │
│  Assistant: Let me inspect this file...         │
│    ✓ FileReadTool: src/main.ts (1.2KB read)    │
│    ✓ FileEditTool: src/main.ts (modified)       │
│  Refactor complete; key changes are...          │
│                                                 │
│  [input area]                                   │
│  > _                                            │
├────────────────────────────────────────────────┤
│  claude-3-5-sonnet · $0.0142 · 3.2k tokens     │
└────────────────────────────────────────────────┘
```

### Permission Confirmation Modal

```
┌─ Permission Request ───────────────────────────┐
│                                                │
│  Claude wants to run this Bash command:        │
│                                                │
│  $ rm -rf node_modules && npm install          │
│                                                │
│  ❯ Allow once                                  │
│    Allow for this session                      │
│    Always allow                                │
│    Deny                                        │
│                                                │
└────────────────────────────────────────────────┘
```

This is a full React component using `useInput()` to capture Up/Down/Enter.

---

## How Streaming Rendering Works

Streaming response rendering is the core UI challenge. As API tokens stream back, display must update token by token:

```typescript
// simplified streaming render logic
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

Each `setText` triggers a React re-render; Ink computes a diff and updates the corresponding terminal lines. This reproduces ChatGPT-style streaming typing effects in a terminal.

---

## Key Rendering Optimizations

### 1. Lazy-Loaded UI Components

```typescript
// comment in src/QueryEngine.ts
// Lazy: MessageSelector.tsx pulls React/ink; only needed for message filtering at query time
const messageSelector =
  (): typeof import('src/components/MessageSelector.js') =>
    require('src/components/MessageSelector.js')
```

React/Ink components are loaded only when needed, reducing initial startup time.

### 2. Adaptive Behavior for Narrow Terminals

In narrow terminals (`< 60` columns), display degrades gracefully: Buddy's ASCII sprite degrades to text emoticon (`=·ω·=`), and layout degrades from multi-column to single-column.

---

## Next

- [Chapter 3: Core Engine](../ch03-core-engine/01-conversation-lifecycle.md) — understand the AI agent main loop
