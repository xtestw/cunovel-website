# Writing High-Quality Skills 🟡

> Knowing what a Skill is isn't enough — knowing how to write an *effective* Skill is the key. This chapter distills 5 best practices through analysis of built-in Skills.

## I. The Nature of Skills: Modular System Prompt Components

Skill files are **appended to the end of the System Prompt** during Bootstrap. This means:
1. Skills have lower priority than core agent instructions (core is at the top)
2. Multiple Skills are appended in sequence — the LLM integrates all instructions
3. Overly large Skills consume token budget, affecting injection of other content

---

## II. 5 Best Practices for High-Quality Skills

### Pattern 1: When-Then Structure

```markdown
❌ Vague:
"Always use conventional commits."

✅ Clear trigger:
## Commit Messages
When creating a git commit:
- Use format: `type(scope): description`
- Types: feat, fix, docs, chore, refactor, test, perf
```

### Pattern 2: Numbered Steps for Complex Tasks

```markdown
## Code Review Mode
When the user says "review this":
1. Read all mentioned files
2. Identify issues by category:
   - Bugs (logic errors, null pointer risks)
   - Performance (O(n²) loops, unnecessary computations)
   - Style (naming conventions, line length)
3. Format as: **Critical** / **Warnings** / **Suggestions**
4. End with "X issues found" summary
```

### Pattern 3: Output Format Specification

```markdown
## Status Updates
Always format as:
STATUS: [IN PROGRESS / COMPLETED / BLOCKED]
Progress: X/Y items done
Current: [what you're doing now]
Next: [what comes after]
```

### Pattern 4: Guard Clauses (What NOT to Do)

```markdown
## Scope Limits
When fixing a bug:
- ONLY fix the reported bug
- DO NOT refactor surrounding code
- DO NOT add logging unless directly related to the bug
- DO NOT update dependencies unless bug is caused by one
```

### Pattern 5: Tool Usage Guide

```markdown
## File Operations
When reading multiple files:
- Use batch read (parallel) rather than sequential
- For large files, read outline first, then specific sections

When writing files:
- Prefer replace_in_file for small edits
- Only use write_to_file for new files or full replacements
```

---

## III. Skills vs Plugins

| Dimension | Skill (Markdown) | Plugin (TypeScript) |
|-----------|----------------|---------------------|
| Complexity | Low — anyone can write | High — requires coding knowledge |
| Capability | Only influences AI reasoning | Can call APIs, manage state, modify system |
| Maintenance | Very low | Medium-high |
| Use case | Workflows, output formats, behavior constraints | New tools, channels, Providers |

**Rule**: if a Skill can solve it, use a Skill — don't over-engineer.

---

## IV. Writing Your First Skill

```markdown
<!-- skills/respond-in-english/SKILL.md -->

# English Response Skill

## Language Rules
Always respond in English, unless:
- User explicitly asks in another language
- User requests a specific language

## Format Rules
- Technical terms keep original: "Dependency Injection"
- Code (function names, variables): always English
- Code comments: English

## Length Rules
- Simple questions: 2-3 sentences
- Complex questions: use headings, max 5 lines per section
```

Enable in `config.yaml`:
```yaml
agents:
  list:
    - id: main
      skills:
        enabled:
          - respond-in-english
          - coding-agent
```

---

## Summary

1. **When-Then structure**: define clear triggers so AI knows when to apply the Skill.
2. **Numbered steps**: break complex tasks into ordered steps to reduce omissions.
3. **Format specification**: define output format for predictable AI behavior.
4. **Guard clauses**: list prohibited behaviors to prevent over-generalization.
5. **Skill over Plugin**: if Markdown can solve it, avoid writing code.

---

*[← Skill System](01-skill-system.md) | [→ Multi-Agent Collaboration](03-multi-agent.md)*
