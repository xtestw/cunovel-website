# 4.4 MCP Protocol: The Extension Boundary of Tools

> **Chapter goal**: Understand how Claude Code integrates external tools through MCP (Model Context Protocol) and breaks beyond the boundary of built-in tools.

---

## What is MCP

MCP (Model Context Protocol) is an open-source AI tool protocol standard by Anthropic. It defines communication interfaces between AI models and external tools/data sources.

Analogy:
```
Built-in tools (BashTool, FileEditTool) = operating system built-in apps
MCP tools = third-party apps (installed through a standard interface)
```

---

## MCP integration in Claude Code

```
Claude Code
    │
    ├── Built-in tools (direct call)
    │     BashTool, FileEditTool, ...
    │
    └── MCP proxy tools (MCPTool)
          │
          ├── MCP Server A (stdio)
          │     tool_1, tool_2, tool_3
          │
          ├── MCP Server B (HTTP/SSE)
          │     tool_4, tool_5
          │
          └── MCP Server C (remote SSE)
                tool_6, tool_7
```

After each MCP server connection, its tools are automatically added to Claude's available tool list. Claude neither knows nor needs to know whether a tool is built-in or MCP.

---

## MCPServerConnection type

```typescript
// src/services/mcp/types.ts
export type MCPServerConnection = {
  name: string              // server name (user-defined)
  client: Client            // MCP SDK client instance
  tools: MCPTool[]          // tools provided by this server
  resources?: ServerResource[] // resources provided by this server (docs, data, etc.)
  transportType: 'stdio' | 'sse' | 'http' | 'claude-desktop'
  mcpVersion?: string       // MCP protocol version
}
```

---

## MCPTool: dynamically generated proxy tool

When Claude Code connects to an MCP server, each MCP tool is wrapped into an `MCPTool` instance:

```typescript
// src/tools/MCPTool/MCPTool.ts (simplified)
function createMCPTool(
  serverName: string,
  toolDef: MCPToolDefinition,
  client: Client,
): Tool {
  return {
    // MCP tool name format: mcp__serverName__toolName
    name: `mcp__${serverName}__${toolDef.name}`,
    
    description: () => toolDef.description ?? '',
    
    // Pass through MCP tool JSON Schema directly
    inputSchema: toolDef.inputSchema,
    
    // Call external server through MCP protocol on execution
    call: async (input, context) => {
      const result = await client.callTool({
        name: toolDef.name,
        arguments: input,
      })
      return result
    },
    
    // MCP tools require permission confirmation by default
    isReadOnly: () => false,
  }
}
```

---

## Three connection methods

### 1. stdio (local process)

Most common method: Claude Code launches a local subprocess and communicates via stdin/stdout:

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

### 2. SSE (Server-Sent Events)

Connect to remote HTTP server, receive events through SSE stream:

```json
{
  "mcpServers": {
    "remote-tools": {
      "url": "https://my-mcp-server.com/sse"
    }
  }
}
```

### 3. HTTP (Streamable HTTP, latest MCP standard)

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

## MCP authentication (McpAuthTool)

Some MCP servers require OAuth. Claude Code includes built-in `McpAuthTool` (`src/tools/McpAuthTool/`) for OAuth flow:

```
1. Claude calls mcp__serverName__some_tool
2. Server returns -32042 error (authentication required)
3. Claude Code triggers McpAuthTool
4. OAuth auth window pops up (local HTTP server receives callback)
5. Auth completes → token stored → original tool call retried
```

---

## MCP resources (Resources)

Besides tools, MCP servers can provide **resources** (docs, data, etc.):

```typescript
// src/tools/ListMcpResourcesTool/ListMcpResourcesTool.ts
// Claude calls this tool to list available resources

// src/tools/ReadMcpResourceTool/ReadMcpResourceTool.ts
// Claude calls this tool to read specific resources
```

Resources work similarly to FileReadTool, but data is from MCP servers instead of local filesystem.

---

## CHICAGO_MCP (internal-only MCP server)

```typescript
// feature gate
const chicagoMCP = feature('CHICAGO_MCP')
  ? require('./services/ChicagoMCP/index.js')
  : null
```

`CHICAGO_MCP` is a special internal Anthropic MCP server providing extra tools for internal users. Implementation details are protected by feature gate and are not visible externally.

---

## Next

- [4.5 Tool concurrency and orchestration](./05-tool-orchestration.md) — executing multiple tools simultaneously
- [Chapter 5: Advanced topics](../ch05-advanced/01-kairos.md) — KAIROS/Coordinator/Bridge
