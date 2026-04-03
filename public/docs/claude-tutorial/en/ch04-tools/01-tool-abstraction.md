# 4.1 Tool Abstraction: What Is a Tool

> **Chapter goal**: Understand Claude Code's tool abstraction design and master the core fields and execution model of the `Tool` type.

---

## The essence of tools

In Claude Code, a Tool is the **only interface** Claude has to interact with the outside world.

Whenever Claude wants to do anything "real" — read files, write code, run commands — it must go through tools. This design comes from Anthropic's Tool Use API.

---

## Tool type definition

`src/Tool.ts` defines the core tool type (793 lines):

```typescript
// Full type definition of a tool
export type Tool<
  TInput extends object = object,
  TOutput = unknown,
  TProgress = unknown,
> = {
  // ── Basic info ──
  name: string                // tool name (e.g. 'Bash', 'str_replace_based_edit')
  description: () => string   // tool description (function-returned, supports dynamic content)
  inputSchema: JSONSchema     // input JSON Schema (sent to API to describe tool usage)
  
  // ── Execution ──
  call: (
    input: TInput,
    context: ToolUseContext,
  ) => Promise<TOutput>       // actual execution logic
  
  // ── Permissions ──
  checkPermissions?: (
    input: TInput,
    context: ToolPermissionContext,
  ) => PermissionResult       // synchronous pre-check (fast decision)
  
  isReadOnly?: () => boolean  // whether read-only (read-only tools are allowed by default)
  isSensitive?: () => boolean // whether sensitive (needs stricter permissions)
  
  // ── UI rendering ──
  renderToolUse?: (           // progress rendering during execution
    input: TInput,
    progress: TProgress,
  ) => React.ReactNode
  
  renderToolResult?: (        // result rendering after completion
    input: TInput,
    output: TOutput,
  ) => React.ReactNode
  
  // ── Prompt injection ──
  prompt?: () => string       // extra tool instructions injected into System Prompt
  
  // ── Metadata ──
  isEnabled?: () => boolean   // whether tool is enabled (dynamic)
  isHidden?: () => boolean    // whether hidden in /help
  type?: 'prompt'             // special type marker
  
  // more fields...
}
```

---

## Key design: functions, not values

Notice many fields are **functions** rather than direct values:

```typescript
description: () => string    // function, not string
isEnabled: () => boolean     // function, not boolean
prompt: () => string         // function, not string
```

Why? Because these values may **change at runtime**:

```typescript
// Example: BashTool description changes by PowerShell config/platform
const BashTool: Tool = {
  name: 'Bash',
  description: () => {
    const isWindows = process.platform === 'win32'
    return isWindows 
      ? 'Run PowerShell commands...' 
      : 'Run bash commands...'
  },
  // ...
}
```

Function-based fields ensure latest state at each invocation.

---

## ToolUseContext: tool "execution environment"

Each tool's `call` method receives a `ToolUseContext` containing everything needed for execution:

```typescript
export type ToolUseContext = {
  // Configuration
  options: {
    commands: Command[]
    tools: Tools
    mcpClients: MCPServerConnection[]
    debug: boolean
    verbose: boolean
    mainLoopModel: string
    // ...
  }
  
  // State management
  abortController: AbortController  // abort signal
  readFileState: FileStateCache      // file state cache (for diff)
  getAppState(): AppState            // read React state
  setAppState(f: ...): void          // update React state
  
  // UI callbacks
  setToolJSX?: SetToolJSXFn          // set tool UI rendering
  addNotification?: (n: Notification) => void
  appendSystemMessage?: (msg: ...) => void
  
  // Permissions
  messages: Message[]                // current conversation history (for permission checks)
  
  // Sub-agent specific
  agentId?: AgentId                  // sub-agent ID
  agentType?: string                 // sub-agent type
}
```

ToolUseContext is a **dependency injection container**: tools do not directly access global state; they access required resources through injected context. This makes tool testing easy to mock.

---

## Tool registration: tools.ts

`src/tools.ts` is the registration center for all tools:

```typescript
// src/tools.ts (simplified)
import { AgentTool } from './tools/AgentTool/AgentTool.js'
import { BashTool } from './tools/BashTool/BashTool.js'
import { FileEditTool } from './tools/FileEditTool/FileEditTool.js'
// ... more imports

// Conditional tools (based on feature gates / USER_TYPE)
const REPLTool = process.env.USER_TYPE === 'ant'
  ? require('./tools/REPLTool/REPLTool.js').REPLTool
  : null

const SleepTool = feature('PROACTIVE') || feature('KAIROS')
  ? require('./tools/SleepTool/SleepTool.js').SleepTool
  : null

// Final exported tool list
export function getAllTools(): Tool[] {
  return [
    AgentTool, BashTool, FileEditTool, FileReadTool, FileWriteTool,
    GlobTool, GrepTool, WebSearchTool, TodoWriteTool,
    ...(REPLTool ? [REPLTool] : []),
    ...(SleepTool ? [SleepTool] : []),
    // ...
  ].filter(Boolean)
}
```

---

## Tool categories

Claude Code tools are grouped into five functional categories:

### 1. Filesystem tools (read-only)
```
FileReadTool   - read file content
GlobTool       - file path matching
GrepTool       - file content search
```

### 2. Filesystem tools (write)
```
FileEditTool   - precise str-replace edits (recommended)
FileWriteTool  - full-file write (overwrite entire file)
NotebookEditTool - Jupyter Notebook editing
```

### 3. Execution tools
```
BashTool        - run shell commands
PowerShellTool  - Windows PowerShell (Windows only)
```

### 4. Agent/Task tools
```
AgentTool       - spawn sub-agent (recursive Claude instances)
TaskCreateTool  - create background task
TaskGetTool     - get task status
TaskUpdateTool  - update task
TaskListTool    - list all tasks
TaskStopTool    - stop task (Coordinator only)
SleepTool       - wait (KAIROS/Proactive only)
```

### 5. Network/external tools
```
WebSearchTool   - search web
WebFetchTool    - fetch webpage content
WebBrowserTool  - full browser operations
```

### 6. MCP protocol tools
```
MCPTool         - dynamically generated MCP tool proxy
ListMcpResourcesTool  - list MCP resources
ReadMcpResourceTool   - read MCP resources
```

---

## Next

- [4.2 Core tools deep dive](./02-core-tools.md) — source analysis of Bash/FileEdit/AgentTool
- [4.3 Permission system](./03-permission-system.md) — `canUseTool` decision chain
