# 5.4 BUDDY：AI 电子宠物的确定性生成算法

> **源码位置**：`src/buddy/`（6 个文件）
> **编译开关**：`feature('BUDDY')`
> **预计上线**：2026 年 4 月

---

## 一句话理解

BUDDY 是 Claude Code 里隐藏的"电子宠物"——一只有稀有度、有属性、有动画的终端 ASCII 宠物，完全基于你的账号 ID 确定性生成。

---

## 18 种物种

```
鸭子 🦆  鹅 🪿  猫 🐱  龙 🐉  章鱼 🐙  猫头鹰 🦉
企鹅 🐧  乌龟 🐢  蜗牛 🐌  幽灵 👻  六角恐龙 🦎  水豚 🦫
仙人掌 🌵  机器人 🤖  兔子 🐰  蘑菇 🍄  果冻 🫧  胖猫 🐈
```

有趣的细节：源码中所有物种名都用 `String.fromCharCode` 十六进制编码表示，例如 `c(0x64,0x75,0x63,0x6b)` = `"duck"`。注释解释原因：某个物种名与内部模型代号冲突，会被构建时的 `excluded-strings.txt` 检查拦截，所以全部改用编码形式绕过。

---

## 5 级稀有度 + 1% 闪光概率

| 稀有度 | 概率 | 颜色 |
|--------|------|------|
| Common（普通） | 60% | 灰色 |
| Uncommon（非凡） | 25% | 绿色 |
| Rare（稀有） | 10% | 蓝色 |
| Epic（史诗） | 4% | 紫色 |
| Legendary（传说） | 1% | 金色 |

**额外的 1% 闪光概率独立于稀有度**——任何物种都有 1% 概率成为闪光个体（类似宝可梦的闪光）：

```typescript
// src/buddy/companion.ts
shiny: rng() < 0.01
```

---

## 确定性生成算法：核心秘密

**每人只会得到一只固定的宠物，无法通过修改配置文件改变。**

### 算法流程

```
userId (OAuth accountUuid / userID / 'anon')
    │
    + 固定盐值: 'friend-2026-401'
    │
    ▼
FNV-1a 哈希（Bun 环境下使用 Bun.hash）
    │
    ▼
Mulberry32 伪随机数生成器（确定性 PRNG，接受 32 位整数种子）
    │
    ▼
依次调用 rng() 抽取：
  物种（18 种）→ 眼睛（6 种）→ 稀有度（加权随机）→ 帽子（8 种）→ 闪光（1%）→ 5 项属性
```

### Mulberry32 实现

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

Mulberry32 是一个高质量的 32 位伪随机数生成器，输入相同种子总是产生相同序列。

### 防作弊设计

```
持久化（存入配置文件）：
  名字（name）
  性格（personality）
  孵化时间（hatchedAt）

不持久化（每次从 userId 重新计算）：
  物种（species）
  稀有度（rarity）
  闪光（shiny）
  眼睛（eye）
  帽子（hat）
  五维属性（stats）
```

你可以任意修改配置文件，但宠物的物种和稀有度**永远由你的 userId 决定**，改不了。

---

## 外观系统

### 眼睛（6 种）

```
·  ✦  ×  ◉  @  °
```

### 帽子（8 种，Common 无帽子）

| 帽子 | 名称 |
|------|------|
| 皇冠 | crown |
| 礼帽 | tophat |
| 巫师帽 | wizard |
| 光环 | halo |
| 螺旋桨帽 | propeller |
| 毛线帽 | beanie |
| 小鸭子头饰 | tinyduck |
| 无 | none（Common 专用）|

---

## 五维属性

每只宠物有 5 项属性，由稀有度决定数值范围：

| 属性 | 含义 |
|------|------|
| DEBUGGING | 调试能力 |
| PATIENCE | 耐心 |
| CHAOS | 混乱值 |
| WISDOM | 智慧 |
| SNARK | 毒舌值 |

生成规则：随机选一个峰值属性（显著偏高）和一个最低属性（显著偏低），其余属性在基础范围内随机。

---

## 动画系统

### 精灵帧序列

```typescript
// 15 帧动画序列
const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 2, 0, 0, 0]
// 0=idle帧, 1=fidget帧, -1=眨眼(眼睛→-), 2=特殊帧
// 500ms/帧
```

大部分时间静止（frame 0），偶尔 fidget（frame 1），极少眨眼（frame -1）。

### 自适应显示

```typescript
// 窄终端（< 100 列）退化为文字表情脸
// 猫: =·ω·=
// 鸭子: (·>
// 章鱼: (˘з˘)
```

每种物种都有一个窄模式下的 ASCII 表情。

---

## 交互命令（feature gate 保护）

| 命令 | 效果 |
|------|------|
| `/buddy hatch` | 孵化（AI 模型生成名字和性格） |
| `/buddy pet` | 抚摸（2.5 秒爱心上浮动画） |
| `/buddy card` | 查看宠物卡片（精灵 + 稀有度 + 属性）|
| `/buddy mute` | 静音（宠物不主动发言）|
| `/buddy unmute` | 取消静音 |

---

## AI 上下文注入

当宠物存在且未静音时，`src/buddy/prompt.ts` 向 Claude 的 System Prompt 注入一段说明：

```
# Companion

There is a tiny buddy watching over the terminal. 
When the user speaks directly to it, keep your response very brief 
(one line or less). Don't simulate the companion.
```

这告知 Claude 旁边有一只小宠物，当用户对宠物说话时，Claude 保持简短，不扮演宠物。

---

## 预热时间线

```typescript
// src/buddy/useBuddyNotification.tsx
const BUDDY_LAUNCH_WINDOW_START = new Date('2026-04-01')
const BUDDY_LAUNCH_WINDOW_END = new Date('2026-04-07')
const isBuddyLive = today >= BUDDY_LAUNCH_WINDOW_START
```

2026 年 4 月 1-7 日：预热期，启动时显示彩虹色 `/buddy` 命令提示（持续 15 秒）。
2026 年 4 月后：`isBuddyLive = true`，命令永久可用。

---

## 源码文件速查

| 文件 | 职责 |
|------|------|
| `src/buddy/types.ts` | 类型定义、物种/稀有度常量 |
| `src/buddy/companion.ts` | **核心生成算法**（哈希、PRNG、属性计算）|
| `src/buddy/sprites.ts` | 18 种物种的 ASCII 精灵图（每种 3 帧）|
| `src/buddy/CompanionSprite.tsx` | React 动画组件（44KB！）|
| `src/buddy/prompt.ts` | AI 上下文注入文本 |
| `src/buddy/useBuddyNotification.tsx` | 启动预热通知 |

---

## 下一步

- [5.5 Voice & Proactive：语音与主动模式](./05-voice-proactive.md)
- [第六章：工程实践](../ch06-engineering/01-three-layer-gates.md)
