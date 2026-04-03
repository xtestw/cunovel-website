# 1.4 Vim 模式：终端里的完整编辑器

> **源码位置**：`src/vim/`（5 个文件，共约 540 行）
> **激活方式**：输入框里按 `Esc` 键，或在设置中开启 `vim` 模式

---

## 一句话理解

Claude Code 的输入框内置了完整的 Vim 键位系统——不是简单的方向键支持，而是带状态机的完整 NORMAL / INSERT 模式切换、文本对象、操作符、计数前缀、`.` 重复、`u` 撤销。

---

## 状态机设计（VimState）

Vim 模式的核心是一个两层状态机：

```
VimState
  ├── { mode: 'INSERT', insertedText: string }
  │     ← 记录插入的文字，用于 . 重复
  │
  └── { mode: 'NORMAL', command: CommandState }
        │
        ├── { type: 'idle' }                        ← 默认等待键入
        ├── { type: 'count', digits: string }       ← 数字前缀（3dw）
        ├── { type: 'operator', op, count }         ← 等待动作（d_ 中的 d）
        ├── { type: 'operatorCount', op, count, digits } ← 操作符后的数字
        ├── { type: 'operatorFind', op, count, find }   ← df<char>
        ├── { type: 'operatorTextObj', op, count, scope } ← daw / diw
        ├── { type: 'find', find, count }           ← f<char> 跳转
        ├── { type: 'g', count }                    ← g + gg/G
        ├── { type: 'operatorG', op, count }        ← dg + G
        ├── { type: 'replace', count }              ← r<char>
        └── { type: 'indent', dir, count }          ← >> / <<
```

源码注释中直接写了完整状态图（`src/vim/types.ts` 第 1-26 行），是罕见的"类型即文档"设计。

---

## 支持的完整键位

### 移动（Motion）

| 按键 | 功能 |
|------|------|
| `h` `j` `k` `l` | 左下上右 |
| `w` `W` | 下一个词首 |
| `e` `E` | 当前词尾 |
| `b` `B` | 上一个词首 |
| `0` | 行首 |
| `$` | 行尾 |
| `^` | 行首非空白 |
| `g` `g` | 第一行 |
| `G` | 最后一行 |
| `f<x>` `F<x>` | 向前/后查找字符 |
| `t<x>` `T<x>` | 向前/后查找字符（停在前一位）|

### 操作符（Operator）

| 按键 | 操作 |
|------|------|
| `d` | 删除（delete）|
| `c` | 修改（change → 切换到 INSERT）|
| `y` | 复制（yank）|

### 操作符 + 动作组合

```
dd    → 删除整行
d$    → 删除到行尾
dw    → 删除一个词
daw   → 删除一个词（含空格，around）
diw   → 删除一个词（不含空格，inner）
d3w   → 删除 3 个词
3dd   → 删除 3 行
cc    → 修改整行
c$    → 修改到行尾
yy    → 复制整行
```

### 文本对象（Text Object）

| 范围 | 词 | 括号 | 引号 |
|------|-----|------|------|
| inner (`i`) | `iw` | `i(` `i[` `i{` | `i'` `i"` `` i` `` |
| around (`a`) | `aw` | `a(` `a[` `a{` | `a'` `a"` `` a` `` |

### 其他常用操作

| 按键 | 功能 |
|------|------|
| `i` `I` | 进入 INSERT（当前位置 / 行首）|
| `a` `A` | 进入 INSERT（后一位 / 行尾）|
| `o` `O` | 新增行（下方 / 上方）+ INSERT |
| `x` | 删除当前字符 |
| `r<x>` | 替换当前字符 |
| `p` `P` | 粘贴（后 / 前）|
| `u` | 撤销 |
| `>` `<` | 缩进 / 反缩进 |
| `J` | 合并下一行 |
| `~` | 切换大小写 |
| `.` | 重复上次修改操作 |

---

## PersistentState：跨命令记忆

```typescript
// src/vim/types.ts
type PersistentState = {
  register: string | null      // 复制寄存器（最近一次 yank/delete 的内容）
  lastFind: LastFind | null    // 最后一次 f/F/t/T 查找（用于 ; 和 , 重复）
  lastInsert: string | null    // 最后一次 INSERT 内容（用于 . 重复）
  lastOp: LastOp | null        // 最后一次操作（用于 . 重复）
}
```

这解释了为什么 `.` 和 `;` `,` 能正确重复——所有需要记忆的状态都持久化在 `PersistentState` 里。

---

## 与 Ink 的集成

Vim 状态机纯函数式设计，不直接操作 DOM。Claude Code 的 Ink 组件捕获原始键盘事件，传递给 `transition()` 函数：

```typescript
// src/vim/transitions.ts（核心入口）
export function transition(
  state: CommandState,
  key: string,
  ctx: TransitionContext,
): TransitionResult

// TransitionResult
type TransitionResult = {
  next?: CommandState    // 下一个状态（不传 = 回到 idle）
  execute?: () => void   // 要执行的操作（副作用）
}
```

设计原则：**状态机本身无副作用**，只返回"下一状态"和"要执行什么操作"。副作用（光标移动、文本删除）由调用方执行。

---

## 为什么是纯函数式？

Vim 状态机用纯函数实现的好处：
1. **可测试**：输入 (state, key) → 输出 (nextState, operation)，天然可单元测试
2. **无竞态**：不持有可变状态，并发键入不会污染全局
3. **可追溯**：每次状态转换都是清晰的函数调用，调试时 stack trace 直接反映操作序列

---

## 下一步

- [1.3 源码地图](./03-codebase-map.md) — 回顾整体目录结构
- [3.6 Hooks 系统](../ch03-core-engine/06-hooks-system.md) — 另一个高级交互系统
