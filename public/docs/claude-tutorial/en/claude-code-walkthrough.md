# ClaudeCode Code Walkthrough: From Request to Tool Execution

This chapter gives you a practical map of how ClaudeCode handles a request, so you can read the source code with clear priorities.

## 1. Main Flow

Think of one request in four steps:

1. Parse user input and current context
2. Build the system prompt
3. Run model inference and decide whether to call tools
4. Persist session state and produce the final response

## 2. Core Modules to Read First

- `query.ts`: main request loop entry
- `QueryEngine`: session state and message orchestration
- Tool modules: tool definitions, permission checks, execution pipeline
- Hook modules: extension points to intercept lifecycle events

## 3. Recommended Reading Strategy

- **Pass 1**: focus on call graph and control flow
- **Pass 2**: focus on state transitions and data structures
- **Pass 3**: focus on edge cases (timeouts, permission denial, tool errors)

## 4. Three Questions to Keep in Mind

- Where does ClaudeCode decide between "continue dialogue" and "call tool"?
- How are tool failures returned to the model for the next reasoning step?
- How is context compacted to avoid token explosion?

---

Next step: read `query.ts` first, then tool orchestration and context compaction modules.
