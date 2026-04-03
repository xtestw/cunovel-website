# 1.4 Vim Mode: A Full Editor Inside the Terminal

> **Source location**: `src/vim/` (5 files, ~540 lines total)
> **How to activate**: press `Esc` in the input box, or enable `vim` mode in settings

---

## One-Sentence Understanding

Claude Code's input box includes a complete Vim keybinding system—not just arrow-key support, but full NORMAL / INSERT mode switching with a state machine, text objects, operators, count prefixes, `.` repeat, and `u` undo.

---

## State Machine Design (`VimState`)

The core of Vim mode is a two-layer state machine:

```
VimState
  ├── { mode: 'INSERT', insertedText: string }
  │     ← records inserted text for . repeat
  │
  └── { mode: 'NORMAL', command: CommandState }
        │
        ├── { type: 'idle' }                        ← default waiting state
        ├── { type: 'count', digits: string }       ← numeric prefix (3dw)
        ├── { type: 'operator', op, count }         ← waiting for motion (the d in d_)
        ├── { type: 'operatorCount', op, count, digits } ← digits after operator
        ├── { type: 'operatorFind', op, count, find }   ← df<char>
        ├── { type: 'operatorTextObj', op, count, scope } ← daw / diw
        ├── { type: 'find', find, count }           ← f<char> jump
        ├── { type: 'g', count }                    ← g + gg/G
        ├── { type: 'operatorG', op, count }        ← dg + G
        ├── { type: 'replace', count }              ← r<char>
        └── { type: 'indent', dir, count }          ← >> / <<
```

The source comments directly include the full state diagram (`src/vim/types.ts` lines 1-26), a rare "types as documentation" design.

---

## Supported Keybindings

### Motions

| Key | Function |
|------|------|
| `h` `j` `k` `l` | left/down/up/right |
| `w` `W` | next word start |
| `e` `E` | end of current word |
| `b` `B` | previous word start |
| `0` | line start |
| `$` | line end |
| `^` | first non-whitespace of line |
| `g` `g` | first line |
| `G` | last line |
| `f<x>` `F<x>` | find character forward/backward |
| `t<x>` `T<x>` | find character forward/backward (stop one before) |

### Operators

| Key | Operation |
|------|------|
| `d` | delete |
| `c` | change (then switch to INSERT) |
| `y` | yank (copy) |

### Operator + Motion Combinations

```
dd    → delete whole line
d$    → delete to line end
dw    → delete one word
daw   → delete one word (with surrounding space, around)
diw   → delete one word (without surrounding space, inner)
d3w   → delete 3 words
3dd   → delete 3 lines
cc    → change whole line
c$    → change to line end
yy    → yank whole line
```

### Text Objects

| Scope | Word | Brackets | Quotes |
|------|-----|------|------|
| inner (`i`) | `iw` | `i(` `i[` `i{` | `i'` `i"` `` i` `` |
| around (`a`) | `aw` | `a(` `a[` `a{` | `a'` `a"` `` a` `` |

### Other Common Operations

| Key | Function |
|------|------|
| `i` `I` | enter INSERT (current position / line start) |
| `a` `A` | enter INSERT (next position / line end) |
| `o` `O` | insert new line (below / above) + INSERT |
| `x` | delete current character |
| `r<x>` | replace current character |
| `p` `P` | paste (after / before) |
| `u` | undo |
| `>` `<` | indent / outdent |
| `J` | join next line |
| `~` | toggle case |
| `.` | repeat last change |

---

## `PersistentState`: Cross-Command Memory

```typescript
// src/vim/types.ts
type PersistentState = {
  register: string | null      // yank register (most recent yank/delete content)
  lastFind: LastFind | null    // last f/F/t/T search (for ; and , repeat)
  lastInsert: string | null    // last INSERT content (for . repeat)
  lastOp: LastOp | null        // last operation (for . repeat)
}
```

This explains why `.` and `;` `,` can repeat correctly—all memory needed for repetition is persisted in `PersistentState`.

---

## Integration with Ink

The Vim state machine is designed as pure functions and does not manipulate the DOM directly. Claude Code's Ink components capture raw keyboard events and pass them to `transition()`:

```typescript
// src/vim/transitions.ts (core entry)
export function transition(
  state: CommandState,
  key: string,
  ctx: TransitionContext,
): TransitionResult

// TransitionResult
type TransitionResult = {
  next?: CommandState    // next state (omitted = back to idle)
  execute?: () => void   // operation to execute (side effect)
}
```

Design principle: **the state machine itself has no side effects**; it only returns "next state" and "what operation to execute." Side effects (cursor movement, text deletion) are performed by the caller.

---

## Why Pure Functional?

Benefits of implementing the Vim state machine with pure functions:
1. **Testable**: input `(state, key)` → output `(nextState, operation)`, naturally unit-testable
2. **No race conditions**: no mutable shared state; concurrent key input does not pollute globals
3. **Traceable**: every state transition is an explicit function call; stack traces directly reflect operation sequences during debugging

---

## Next

- [1.3 Codebase Map](./03-codebase-map.md) — revisit overall directory structure
- [3.6 Hooks System](../ch03-core-engine/06-hooks-system.md) — another advanced interaction system
