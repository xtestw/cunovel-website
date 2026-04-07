# Memory & MCP 🟡

> Memory gives AI long-term memory across sessions. MCP (Model Context Protocol) connects AI to external systems. This chapter explains both mechanisms.

## I. Memory System

Memory is a **Capability Plugin** providing two tools:
- `memory_create(content)` — write to long-term memory
- `memory_search(query)` — retrieve from long-term memory

Each Bootstrap automatically searches for memories relevant to the current conversation and injects them into the System Prompt.

### Memory Storage

**Local vector store (memory-core plugin)**:
```typescript
type MemoryEntry = {
  id: string;
  content: string;
  embedding: Float32Array;  // vector embedding via LLM API
  tags: string[];           // agentId, sessionKey, etc.
  createdAt: Date;
  accessedAt: Date;
};
```

**External memory service (memory-mcp plugin)** — connects via MCP protocol:
```yaml
plugins:
  - id: memory-mcp
    mcp:
      command: npx
      args: ['-y', '@mem0/mcp-server']
```

---

## II. MCP (Model Context Protocol)

MCP is an open protocol by Anthropic allowing AI models to access external tools and data sources through a standardized interface.

### Three Integration Modes

**Mode 1: mcporter plugin (subprocess, most common)**:
```yaml
plugins:
  - id: mcporter
    mcpServers:
      filesystem:
        command: npx
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace']
      github:
        command: npx
        args: ['-y', '@modelcontextprotocol/server-github']
        env:
          GITHUB_TOKEN: "${env:GITHUB_TOKEN}"
```

**Mode 2: Embedded MCP** (`embedded-pi-mcp.ts`) — runs in the same process, no subprocess needed. Used for LSP integration and other in-process tools.

**Mode 3: HTTP MCP** — connects to remote MCP servers over HTTP.

### MCP Tool Registration

After an MCP Server starts, mcporter:
1. Calls `tools/list` to get the server's tool list
2. Wraps each MCP tool in OpenClaw's tool format (with JSON Schema)
3. Registers via `api.tools.register()`
4. Agent can call them just like built-in tools

---

## III. Bundle MCP Mode

OpenClaw itself can act as an MCP Server — exposing Agent capabilities to external MCP clients. This enables nesting: another AI application can call OpenClaw agents via MCP.

---

## Key Source Files

| File | Size | Role |
|------|------|------|
| `extensions/memory-core/` | - | Local vector memory plugin |
| `src/agents/embedded-pi-mcp.ts` | 0.95KB | Embedded MCP Server |
| `extensions/mcporter/` | - | mcporter plugin (subprocess MCP) |

---

## Summary

1. **Memory plugin provides cross-session memory**: `memory_create` writes, `memory_search` retrieves, Bootstrap auto-injects relevant memories.
2. **Three MCP integration modes**: subprocess (mcporter), embedded, remote HTTP.
3. **MCP tools integrate transparently**: registered as regular agent tools, same usage experience as built-ins.
4. **Bundle MCP**: OpenClaw itself can be exposed as an MCP Server for multi-layer AI nesting.

---

*[← Channel Integration](03-channel-integration.md) | [→ Security Model](05-security-model.md)*
