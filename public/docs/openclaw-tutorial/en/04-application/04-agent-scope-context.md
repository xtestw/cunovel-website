# Agent Scope & Context 🟡

> "Scope" determines what an Agent can see and access. Understanding Agent scope boundaries is the foundation for building multi-agent systems.

## I. 8 Scope Dimensions

```typescript
type ResolvedAgentConfig = {
  name?: string;               // Agent display name
  workspace?: string;          // Working directory path
  agentDir?: string;           // Agent-specific config directory
  model?: AgentModelRef;       // LLM model
  thinkingDefault?: ThinkLevel;
  skills?: AgentSkillsFilter;  // Allowed Skills
  heartbeat?: HeartbeatConfig;
  subagents?: SubagentsConfig; // Child agent dispatch permissions
  tools?: AgentToolsConfig;    // Allowed tools
  sandbox?: SandboxConfig;     // Execution sandbox
};
```

---

## II. workspaceDir vs agentDir

| Directory | Config Field | Role |
|-----------|-------------|------|
| **workspaceDir** | `workspace` | bash execution root; file operations root |
| **agentDir** | `agentDir` | Agent-specific config (CLAUDE.md, identity files, etc.) |

```yaml
agents:
  list:
    - id: frontend
      workspace: /project/frontend    # bash runs here
      agentDir: /project/.agents/frontend  # config here

    - id: backend
      workspace: /project/backend
      agentDir: /project/.agents/backend
```

---

## III. CLAUDE.md Hierarchical Loading

During Bootstrap, the Agent scans from `agentDir` upward for `CLAUDE.md` files:

```
/ (root)
  └── CLAUDE.md          ← lowest priority (global rules)
       └── /project/
            └── CLAUDE.md  ← project-level rules
                 └── /project/backend/
                      └── CLAUDE.md  ← highest priority (module rules)
```

All levels are loaded — content is ordered with "closer to agent = earlier in System Prompt".

---

## IV. Context Window Runtime State

`src/agents/context-runtime-state.ts` tracks token usage:

```typescript
type ContextWindowRuntimeState = {
  contextWindows: Map<string, number>;  // known window sizes by model ID
  currentUsage: Map<string, number>;    // current session token usage
};
```

Usage is updated after each API call and drives:
- Compaction trigger timing
- Bootstrap budget calculation
- UI display (Web UI token progress bar)

---

## V. Identity System

```yaml
agents:
  list:
    - id: main
      identity:
        name: Alex             # AI assistant name
        avatarUrl: "https://..."
        humanDelay: true       # simulate human reply delay
        perChannelPrefix:
          telegram: "🤖"
          discord: "**Alex**"
```

Identity information is injected at the very start of the System Prompt:
```
You are Alex, a helpful AI assistant.
...
```

---

## VI. GroupChat Context

```yaml
agents:
  list:
    - id: main
      groupChat:
        respondToMentions: true
        respondToBotCommands: true
        threadMode: auto  # auto-reply in threads (reduce channel noise)
```

---

## Key Source Files

| File | Size | Role |
|------|------|------|
| `src/agents/agent-scope.ts` | 11KB | Agent scope resolution |
| `src/agents/context.ts` | 15KB | Context management |
| `src/agents/context-runtime-state.ts` | 1.4KB | Context window runtime state |
| `src/agents/identity.ts` | 5KB | Agent identity resolution |

---

## Summary

1. **8 scope dimensions**: name, workspace, agentDir, model, thinking, Skills, heartbeat, subagents, tools, sandbox.
2. **workspaceDir ≠ agentDir**: workspace is bash root; agentDir holds config files.
3. **CLAUDE.md hierarchical loading**: from agentDir upward, all levels loaded, closer = higher priority.
4. **Context window runtime tracking**: provider-reported token usage drives compaction and bootstrap budget.
5. **Identity system**: each agent can have independent name, avatar, channel prefix.

---

*[← Multi-Agent Collaboration](03-multi-agent.md) | [→ Automation & Cron](05-automation-cron.md)*
