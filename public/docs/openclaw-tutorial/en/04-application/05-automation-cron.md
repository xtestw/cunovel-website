# Automation & Scheduled Tasks: Heartbeat & Cron 🟡

> OpenClaw isn't just a passive Q&A bot — it can **proactively execute tasks**. This chapter covers two automation mechanisms: Heartbeat and Cron.

## I. Heartbeat: Proactive AI

### What Is Heartbeat?

Heartbeat makes the AI **periodically check for tasks and take action autonomously**, triggering every **30 minutes** by default.

Each heartbeat, the AI:
1. Reads `HEARTBEAT.md` (if it exists)
2. Executes tasks per the file's instructions
3. If nothing needs attention, replies `HEARTBEAT_OK` and silences (no push to user)

### HEARTBEAT.md Example

```markdown
<!-- HEARTBEAT.md -->

# Assistant Task List

## Continuous Monitoring
- [ ] Check /logs/app.log for ERROR level logs
  - If found: summarize and notify user
- [ ] Check ~/Downloads for new files
  - If found: organize into appropriate directories

## Morning Tasks (first heartbeat after 9:00 AM on weekdays)
- [ ] Pull latest git changes
- [ ] Generate yesterday's work summary

## Pending
- [ ] Review PR #42 code
```

### Heartbeat Configuration

```yaml
agents:
  list:
    - id: main
      heartbeat:
        enabled: true
        every: "30m"
        prompt: |
          Check HEARTBEAT.md and complete pending tasks.
          Be concise when reporting.
```

Default `HEARTBEAT_PROMPT`:
```
Read HEARTBEAT.md if it exists. Follow it strictly.
Do not infer or repeat old tasks from prior chats.
If nothing needs attention, reply HEARTBEAT_OK.
```

---

## II. Cron: Precise Scheduling

### Three Schedule Types

```typescript
// 'at': one-time execution at specific time
{ kind: 'at', at: '2024-03-15T09:00:00Z' }

// 'every': fixed interval repeat
{ kind: 'every', everyMs: 3600000 }  // every hour

// 'cron': cron expression (most flexible)
{ kind: 'cron', expr: '0 9 * * 1-5' }  // weekdays at 9:00
```

### Payload Types

| Payload Type | Description | Use Case |
|-------------|-------------|---------|
| `agentTurn` | Trigger agent reasoning as new user message | Make AI complete a task |
| `systemEvent` | Inject system event (no AI reasoning) | Trigger hooks or internal logic |

### Delivery Strategies

| Mode | Description |
|------|-------------|
| `none` | Silent execution, no user notification |
| `announce` | Push result to associated session on completion |
| `webhook` | Push result to specified webhook URL |

```yaml
cron:
  jobs:
    - name: daily-report
      schedule:
        kind: cron
        expr: "0 9 * * *"    # daily at 9:00
      payload:
        kind: agentTurn
        message: "Generate today's work plan summary"
      delivery:
        mode: announce
```

---

## III. Managing Cron via Agent Tool

Agents can manage cron jobs through conversation:

```
User: Check system memory every hour, alert me if over 80%

Agent calls cron tool:
cron({
  action: 'add',
  name: 'memory-check',
  schedule: { kind: 'every', everyMs: 3600000 },
  payload: {
    kind: 'agentTurn',
    message: 'Check memory usage, warn if over 80%'
  },
  delivery: { mode: 'announce' }
})
```

Cron tool actions: `status`, `list`, `add`, `update`, `remove`, `run`, `runs`, `wake`

---

## Key Source Files

| File | Size | Role |
|------|------|------|
| `src/auto-reply/heartbeat.ts` | 172 lines | Heartbeat logic |
| `src/agents/tools/cron-tool.ts` | 739 lines | Cron agent tool |
| `src/tasks/task-registry.ts` | 57KB | Task state machine |
| `src/tasks/task-executor.ts` | 18KB | Task executor |

---

## Summary

1. **Heartbeat = proactive checking**: reads HEARTBEAT.md, executes tasks, silences if nothing to do.
2. **`HEARTBEAT_OK` mechanism**: AI returns special token when idle, framework filters it out silently.
3. **Cron supports 3 schedules**: `at` (time point), `every` (interval), `cron` (expression).
4. **Two payload types**: `agentTurn` (AI reasoning) and `systemEvent` (system trigger).
5. **Agent manages cron via conversation**: no config file editing needed.

---

*[← Agent Scope & Context](04-agent-scope-context.md) | [→ Write a Channel Plugin](../05-extension/01-write-channel-plugin.md)*
