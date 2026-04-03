# 4.4 MCP 协议：工具的扩展边界

> **章节目标**：理解 Claude Code 如何通过 MCP（Model Context Protocol）协议接入外部工具，打破内置工具的边界。

---

## MCP 是什么

MCP（Model Context Protocol）是 Anthropic 开源的 AI 工具协议标准。它定义了 AI 模型与外部工具/数据源之间的通信接口。

类比：
```
内置工具（BashTool、FileEditTool）= 操作系统自带应用
MCP 工具 = 第三方应用（通过标准接口安装）
```

---

## MCP 在 Claude Code 中的集成

```
Claude Code
    │
    ├── 内置工具（直接调用）
    │     BashTool, FileEditTool, ...
    │
    └── MCP 代理工具（MCPTool）
          │
          ├── MCP Server A（stdio）
          │     tool_1, tool_2, tool_3
          │
          ├── MCP Server B（HTTP/SSE）
          │     tool_4, tool_5
          │
          └── MCP Server C（SSE 远程）
                tool_6, tool_7
```

每个 MCP 服务器连接后，其工具自动出现在 Claude 可用的工具列表里。Claude 不知道也不需要知道某个工具是"内置"的还是"MCP"的。

---

## MCPServerConnection 类型

```typescript
// src/services/mcp/types.ts
export type MCPServerConnection = {
  name: string              // 服务器名（用户定义）
  client: Client            // MCP SDK 客户端实例
  tools: MCPTool[]          // 这个服务器提供的工具列表
  resources?: ServerResource[] // 这个服务器提供的资源（如文档、数据）
  transportType: 'stdio' | 'sse' | 'http' | 'claude-desktop'
  mcpVersion?: string       // MCP 协议版本
}
```

---

## MCPTool：动态生成的代理工具

当 Claude Code 连接到 MCP 服务器后，每个 MCP 工具都被包装成一个 `MCPTool` 实例：

```typescript
// src/tools/MCPTool/MCPTool.ts（简化）
function createMCPTool(
  serverName: string,
  toolDef: MCPToolDefinition,
  client: Client,
): Tool {
  return {
    // MCP 工具名格式：mcp__serverName__toolName
    name: `mcp__${serverName}__${toolDef.name}`,
    
    description: () => toolDef.description ?? '',
    
    // 直接透传 MCP 工具的 JSON Schema
    inputSchema: toolDef.inputSchema,
    
    // 执行时通过 MCP 协议调用外部服务器
    call: async (input, context) => {
      const result = await client.callTool({
        name: toolDef.name,
        arguments: input,
      })
      return result
    },
    
    // MCP 工具默认需要权限确认
    isReadOnly: () => false,
  }
}
```

---

## 三种连接方式

### 1. stdio（本地进程）

最常见的方式，Claude Code 启动一个本地子进程，通过标准输入/输出通信：

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    }
  }
}
```

### 2. SSE（Server-Sent Events）

连接到远程 HTTP 服务器，通过 SSE 流接收事件：

```json
{
  "mcpServers": {
    "remote-tools": {
      "url": "https://my-mcp-server.com/sse"
    }
  }
}
```

### 3. HTTP（Streamable HTTP，MCP 最新标准）

```json
{
  "mcpServers": {
    "http-tools": {
      "url": "https://my-mcp-server.com/mcp",
      "type": "http"
    }
  }
}
```

---

## MCP 认证（McpAuthTool）

某些 MCP 服务器需要 OAuth 认证。Claude Code 内置了 `McpAuthTool`（`src/tools/McpAuthTool/`）处理 OAuth 流程：

```
1. Claude 调用 mcp__serverName__some_tool
2. 服务器返回 -32042 错误（需要认证）
3. Claude Code 触发 McpAuthTool
4. 弹出 OAuth 认证窗口（本地 HTTP 服务器接收回调）
5. 认证完成 → 存储令牌 → 重试原来的工具调用
```

---

## MCP 资源（Resources）

除了工具，MCP 服务器还可以提供**资源**（文档、数据等）：

```typescript
// src/tools/ListMcpResourcesTool/ListMcpResourcesTool.ts
// Claude 调用这个工具获取可用资源列表

// src/tools/ReadMcpResourceTool/ReadMcpResourceTool.ts
// Claude 调用这个工具读取具体资源
```

资源的工作方式类似 FileReadTool，但读取的是 MCP 服务器提供的数据，而不是本地文件系统。

---

## CHICAGO_MCP（内部专属 MCP 服务器）

```typescript
// feature gate
const chicagoMCP = feature('CHICAGO_MCP')
  ? require('./services/ChicagoMCP/index.js')
  : null
```

`CHICAGO_MCP` 是 Anthropic 内部的特殊 MCP 服务器，为内部用户提供额外的工具。具体实现细节被 feature gate 保护，外部不可见。

---

## 下一步

- [4.5 工具并发与编排](./05-tool-orchestration.md) — 多工具同时执行
- [第五章：高级专题](../ch05-advanced/01-kairos.md) — KAIROS/Coordinator/Bridge
