# 5.5 Voice & Proactive：语音交互与主动模式

> **编译开关**：`feature('VOICE_MODE')`、`feature('PROACTIVE')`
> **源码位置**：`src/services/voice.ts`（16.7 KB）、`src/services/voiceStreamSTT.ts`（20.9 KB）、`src/proactive/`

---

## 语音交互（Voice Mode）

### 一句话理解

Voice 模式让用户直接对着麦克风说话，Claude Code 把语音实时转成文字处理，再把响应读出来——终端里的语音 AI 助手。

### 系统架构

```
麦克风录音（native audio capture）
         │
         ▼
语音活动检测（VAD - Voice Activity Detection）
  检测到说话：开始录制
  检测到静音（超过阈值）：停止录制
         │
         ▼
流式 STT（voiceStreamSTT.ts）
  WebSocket → Anthropic STT 服务
  实时返回识别文字（边说边出字）
         │
         ▼
文字发送给 Claude（正常 query 流程）
         │
         ▼
响应合成为语音（TTS）
  流式播放
```

### 关键文件

| 文件 | 大小 | 职责 |
|------|------|------|
| `src/services/voice.ts` | 16.7 KB | 核心协调器：录制状态机、会话管理、与 Claude 集成 |
| `src/services/voiceStreamSTT.ts` | 20.9 KB | 流式 STT 实现：WebSocket + 音频流管理 |
| `src/services/voiceKeyterms.ts` | 3.4 KB | 关键词增强：提高代码词汇识别精度 |

### GrowthBook 远程配置

```typescript
// 语音识别模型可通过 GrowthBook 远程切换
const sttModel = getFeatureValue_CACHED_MAY_BE_STALE('tengu_cobalt_frost')
  ?? 'nova-3'
```

`tengu_cobalt_frost` 用于控制语音识别模型版本，允许 Anthropic 在不发布新版本的情况下切换 STT 模型。

### voiceKeyterms：关键词增强

Voice 模式向 STT 服务提供代码/AI 专业词汇列表，提高识别精度：

```typescript
// 注入技术词汇，让 STT 引擎偏向正确识别
const keyterms = [
  'TypeScript', 'Bun', 'React', 'webpack',
  'KAIROS', 'Claude', 'anthropic',
  'npm', 'async', 'await', 'Promise',
  // ... 数百个技术词汇
]
```

这解决了通用 STT 系统容易把 "TypeScript" 识别成 "Type Script"，把 "async/await" 识别成奇怪内容的问题。

---

## 主动模式（Proactive Mode）

### 一句话理解

不等用户开口，Claude 主动找事情做。没有任务时，调用 SleepTool 等待下一个周期性 `<tick>` 触发。

### 激活方式

```bash
# CLI 参数
claude --proactive

# 环境变量
CLAUDE_CODE_PROACTIVE=1 claude
```

两种编译保护：`feature('PROACTIVE') || feature('KAIROS')`

### 状态机（src/proactive/index.ts）

```typescript
type ProactiveState = {
  active: boolean         // 是否激活
  paused: boolean         // 用户按 Esc 暂停；下次用户输入自动恢复
  contextBlocked: boolean // API 错误时阻塞 tick，防止错误循环
}
```

### Proactive System Prompt

激活后，System Prompt 追加：

```
# Proactive Mode

You are in proactive mode. Take initiative -- explore, act, and make progress
without waiting for instructions.

Start by briefly greeting the user.

You will receive periodic <tick> prompts. These are check-ins. Do whatever
seems most useful, or call Sleep if there's nothing to do.
```

注意这个 System Prompt 的两个关键点：
1. **先打招呼**：避免 Claude 直接就开始做事让用户莫名其妙
2. **Sleep 授权**：明确告诉 Claude 没事做时可以 Sleep

### SleepTool：打盹工具

```typescript
// 只在以下条件下可用
const SleepTool =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('./tools/SleepTool/SleepTool.js').SleepTool
    : null
```

Sleep 的参数：
```typescript
{
  duration_ms: number  // 睡多久（受 minSleepDurationMs / maxSleepDurationMs 配置限制）
}
```

### tick 机制

在 Proactive 模式下，Claude 不是真正"持续运行"的——而是定期收到 `<tick>` 消息：

```
用户不输入  →  系统每 N 秒注入一条 <tick>  →  Claude 检查有无事可做
                                                   ├── 有任务 → 执行
                                                   └── 无任务 → SleepTool(duration_ms)
```

`contextBlocked` 状态用于防止 API 错误时陷入死循环（tick → 错误 → tick → 错误...）。当 API 返回错误时，暂停后续 tick，等待用户手动干预。

---

## Voice + Proactive 的组合使用

理论上可以同时启用两者：
- Proactive 模式处理"没人说话时自主工作"
- Voice 模式处理"用户语音输入"

两者都通过 `query()` 函数进入 Claude 的主循环，架构上是正交的。

---

## 下一步

- [第六章：工程实践](../ch06-engineering/01-three-layer-gates.md) — 功能发布与质量管控
