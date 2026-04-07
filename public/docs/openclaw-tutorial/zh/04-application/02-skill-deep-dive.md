# Skill 深度解析：编写高质量 Skill 🟡

> 知道 Skill 是什么还不够，如何编写真正有效的 Skill 才是核心。本章通过拆解内置 Skill 案例，总结高质量 Skill 的编写模式。

## 本章目标

读完本章你将能够：
- 掌握 Skill 编写的 5 种最佳实践
- 理解 Skill 与 System Prompt 的关系
- 分析内置 Skill 的设计模式（以 `coding-agent`、`taskflow` 为例）
- 编写自己的第一个 Skill

---

## 一、Skill 的本质：System Prompt 的模块化组件

Skill 文件在 Bootstrap 时被**追加到 System Prompt 的末尾**。这意味着：

1. Skill 的优先级低于 Agent 的核心指令（核心指令在 System Prompt 开头）
2. 多个 Skill 会被依次追加，后面的不会覆盖前面的（LLM 整合所有指令）
3. Skill 过大会消耗 Token 预算，影响其他内容的注入

---

## 二、高质量 Skill 的 5 种编写模式

### 模式 1：场景触发（When-Then 结构）

好的 Skill 明确定义"什么时候触发"，而不是笼统的"总是做 X"：

```markdown
❌ 不好的写法：
"Always use conventional commits."

✅ 好的写法：
## Commit Messages
When creating a git commit:
- Use conventional commits format: `type(scope): description`
- Types: feat, fix, docs, chore, refactor, test, perf
- Scope is optional but helpful: feat(auth): add OAuth2 support
```

### 模式 2：分步骤指导（Numbered Steps）

复杂任务拆分为明确的步骤序列：

```markdown
## Code Review Mode
When the user says "review this" or "do a code review":
1. Read all mentioned files using read_file
2. Identify issues by category:
   - Bugs (logic errors, null pointer risks)
   - Performance (O(n²) loops, unnecessary computations)
   - Style (naming conventions, line length)
3. Format output as:
   ### Findings
   **Critical**: [only real bugs]
   **Warnings**: [potential issues]
   **Suggestions**: [style & improvement]
4. Always end with "X issues found" summary
```

### 模式 3：格式规范（Output Format Specification）

明确指定 AI 输出的格式，保证可预期性：

```markdown
## Task Status Updates
Always format status updates as:
```
STATUS: [IN PROGRESS / COMPLETED / BLOCKED]
Progress: X/Y items done
Current: [what you're doing now]
Next: [what comes after]
```
Only deviate from this format if explicitly asked.
```

### 模式 4：防错条款（Guard Clauses）

列出明确不应该做的事，防止 AI 过度发散：

```markdown
## Scope Limits
When fixing a bug:
- ONLY fix the reported bug
- DO NOT refactor surrounding code unless explicitly asked
- DO NOT add logging or comments unless the issue involves them
- DO NOT update dependencies unless the bug is caused by a dependency
```

### 模式 5：工具引导（Tool Usage Guide）

指导 AI 如何使用特定工具：

```markdown
## File Operations
When reading multiple files:
- Use batch read (read_file multiple times in parallel) rather than one at a time
- Always check if the file exists before editing
- For large files, read the outline first (view_file_outline), then specific sections

When writing files:
- Prefer replace_in_file for small edits
- Only use write_to_file when creating new files or replacing entire content
```

---

## 三、内置 Skill 案例分析

### 案例 1：`skills/taskflow/SKILL.md`

TaskFlow 是一个任务流程管理 Skill，核心设计：

- **定义了一套"任务语言"**：用户说"新任务"、"推进"、"完成"触发对应行为
- **规范了存储格式**：任务保存到特定的 YAML 文件
- **指定了汇报格式**：任务完成时按固定格式汇报

这类 Skill 实质上**为 AI 定义了一个微型工作流引擎**，全部用 Markdown 实现。

### 案例 2：`skills/summarize/SKILL.md`

Summarize Skill 指导 AI 如何生成摘要：

- 不同内容类型（会议记录、代码、文章）有不同的摘要模板
- 指定摘要长度（避免 AI 生成过长或过短的摘要）
- 定义摘要中必须包含的字段（如"关键决定"、"待办事项"）

### 案例 3：`skills/github/SKILL.md`

GitHub Skill 定义了 Git 和 GitHub 操作规范：

- PR 标题和描述模板
- Branch 命名约定
- Issue 引用格式
- CI 失败时的调试步骤

---

## 四、Skill 与 Plugin 的比较

| 维度 | Skill（Markdown）| Plugin（TypeScript）|
|------|-----------------|---------------------|
| 复杂度 | 低，任何人都能写 | 高，需要编程知识 |
| 能力边界 | 只能影响 AI 推理行为 | 可以调用 API、管理状态、修改系统 |
| 维护成本 | 极低 | 中高 |
| 适用场景 | 工作流规范、输出格式、行为约束 | 新工具、新渠道、新 Provider |

**原则**：能用 Skill 解决的问题，优先用 Skill，不要过度工程化。

---

## 五、实战：编写你的第一个 Skill

假设你想给 AI 添加"使用中文回复"的规范：

```markdown
<!-- skills/chinese-reply/SKILL.md -->

# 中文回复规范

## 语言规则
始终用中文回复用户消息，除非：
- 用户明确用英文提问
- 用户要求英文回复
- 问题涉及代码示例（代码本身用英文，注释可以中文）

## 格式规范
- 使用中文标点（不是英文逗号和句号）
- 专业术语保留英文原词并附中文解释：如 "Dependency Injection（依赖注入）"
- 代码相关词汇（函数名、变量名）保持英文

## 长度规范
- 简单问题：2-3 句话内回答
- 复杂问题：用标题分组，每节不超过 5 行
- 避免过度解释
```

将此文件放入 `skills/chinese-reply/SKILL.md` 并在 Agent 配置中启用：

```yaml
# config.yaml
agents:
  list:
    - id: main
      skills:
        enabled:
          - chinese-reply
          - coding-agent
```

---

## 关键源码索引

| 文件 | 大小 | 作用 |
|------|------|------|
| `skills/taskflow/SKILL.md` | - | 任务流管理 Skill（设计参考）|
| `skills/summarize/SKILL.md` | - | 摘要生成 Skill |
| `skills/coding-agent/SKILL.md` | - | 编程 Agent Skill |
| `skills/github/SKILL.md` | - | GitHub 工作流 Skill |
| `skills/sag/SKILL.md` | - | Skill 创建助手（SAG）|

---

## 小结

1. **When-Then 结构**：明确触发条件，避免 AI 在不适当时刻应用 Skill。
2. **分步骤指导**：复杂任务拆为有序步骤，减少 AI 遗漏。
3. **格式规范**：明确输出格式，让 AI 行为可预期。
4. **防错条款**：列出明确禁止行为，防止 AI 过度发散。
5. **Skill 优先于 Plugin**：能用 Markdown 解决的问题，不要用代码。

---

*[← Skill 系统](01-skill-system.md) | [→ 多 Agent 协作](03-multi-agent.md)*
