# 5.4 BUDDY: Deterministic AI Desktop Pet Algorithm

> **Source location**: `src/buddy/` (6 files)  
> **Compile gate**: `feature('BUDDY')`  
> **Estimated launch**: April 2026

---

## One-line understanding

BUDDY is a hidden "desktop pet" inside Claude Code - a terminal ASCII pet with rarity, stats, animation, and deterministic generation based on your account ID.

---

## 18 species

```
duck  goose  cat  dragon  octopus  owl
penguin  turtle  snail  ghost  axolotl  capybara
cactus  robot  rabbit  mushroom  jelly  chonkycat
```

Interesting detail: all species names in source use `String.fromCharCode` hex encoding, e.g. `c(0x64,0x75,0x63,0x6b)` = `"duck"`. A comment explains this avoids build-time `excluded-strings.txt` conflicts with internal model codenames.

---

## 5 rarity tiers + independent 1% shiny chance

| Rarity | Probability | Color |
|--------|-------------|-------|
| Common | 60% | gray |
| Uncommon | 25% | green |
| Rare | 10% | blue |
| Epic | 4% | purple |
| Legendary | 1% | gold |

The **1% shiny chance is independent of rarity**:

```typescript
// src/buddy/companion.ts
shiny: rng() < 0.01
```

---

## Deterministic generation: the core secret

**Each user gets one fixed pet and cannot reroll by editing config.**

### Algorithm flow

```
userId (OAuth accountUuid / userID / 'anon')
    │
    + fixed salt: 'friend-2026-401'
    │
    ▼
FNV-1a hash (uses Bun.hash in Bun runtime)
    │
    ▼
Mulberry32 PRNG (deterministic, 32-bit integer seed)
    │
    ▼
sequential rng() draws:
  species (18) -> eye (6) -> rarity (weighted) -> hat (8) -> shiny (1%) -> 5 stats
```

### Mulberry32 implementation

```typescript
// src/buddy/companion.ts
function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
```

Mulberry32 is a high-quality 32-bit PRNG: same seed always yields same sequence.

### Anti-cheat persistence design

```
Persisted in config:
  name
  personality
  hatchedAt

Not persisted (recomputed from userId each time):
  species
  rarity
  shiny
  eye
  hat
  stats (5 dimensions)
```

You can edit config fields, but species and rarity are always determined by `userId`.

---

## Appearance system

### Eyes (6 styles)

```
·  ✦  ×  ◉  @  °
```

### Hats (8 styles, Common has no hat)

| Hat | Name |
|-----|------|
| Crown | crown |
| Top hat | tophat |
| Wizard hat | wizard |
| Halo | halo |
| Propeller cap | propeller |
| Beanie | beanie |
| Tiny duck accessory | tinyduck |
| None | none (Common only) |

---

## Five stats

Each pet has 5 stats with ranges influenced by rarity:

| Stat | Meaning |
|------|---------|
| DEBUGGING | debugging capability |
| PATIENCE | patience |
| CHAOS | chaos level |
| WISDOM | wisdom |
| SNARK | sass level |

Generation rule: choose one peak stat (significantly high) and one low stat (significantly low), with the rest sampled inside base ranges.

---

## Animation system

### Sprite frame sequence

```typescript
// 15-frame sequence
const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 2, 0, 0, 0]
// 0=idle, 1=fidget, -1=blink (eye -> -), 2=special frame
// 500ms/frame
```

Mostly idle (frame 0), occasional fidget (frame 1), rare blink (frame -1).

### Adaptive display

```typescript
// Narrow terminal (< 100 cols) degrades to text emoticon
// cat: =·ω·=
// duck: (·>
// octopus: (˘з˘)
```

Each species has its own narrow-mode ASCII face.

---

## Interaction commands (feature-gated)

| Command | Effect |
|---------|--------|
| `/buddy hatch` | hatch pet (AI generates name/personality) |
| `/buddy pet` | pet action (2.5s floating hearts animation) |
| `/buddy card` | view pet card (sprite + rarity + stats) |
| `/buddy mute` | mute pet |
| `/buddy unmute` | unmute pet |

---

## AI context injection

When a pet exists and is not muted, `src/buddy/prompt.ts` injects this into System Prompt:

```
# Companion

There is a tiny buddy watching over the terminal.
When the user speaks directly to it, keep your response very brief
(one line or less). Don't simulate the companion.
```

So Claude knows a pet is present and stays concise when users address it, without role-playing the pet.

---

## Launch warm-up timeline

```typescript
// src/buddy/useBuddyNotification.tsx
const BUDDY_LAUNCH_WINDOW_START = new Date('2026-04-01')
const BUDDY_LAUNCH_WINDOW_END = new Date('2026-04-07')
const isBuddyLive = today >= BUDDY_LAUNCH_WINDOW_START
```

Apr 1-7, 2026: warm-up period; rainbow `/buddy` hint shown on startup for 15 seconds.  
After April 2026: `isBuddyLive = true`, command is permanently available.

---

## Source file quick map

| File | Responsibility |
|------|----------------|
| `src/buddy/types.ts` | type defs and species/rarity constants |
| `src/buddy/companion.ts` | **core generation algorithm** (hash, PRNG, stat calculation) |
| `src/buddy/sprites.ts` | ASCII sprites for 18 species (3 frames each) |
| `src/buddy/CompanionSprite.tsx` | React animation component (44KB) |
| `src/buddy/prompt.ts` | AI context injection text |
| `src/buddy/useBuddyNotification.tsx` | startup warm-up notification |

---

## Next

- [5.5 Voice & Proactive: Voice and Proactive Modes](./05-voice-proactive.md)
- [Chapter 6: Engineering Practices](../ch06-engineering/01-three-layer-gates.md)
