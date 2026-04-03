# 5.5 Voice & Proactive: Voice Interaction and Initiative Mode

> **Compile gates**: `feature('VOICE_MODE')`, `feature('PROACTIVE')`  
> **Source location**: `src/services/voice.ts` (16.7KB), `src/services/voiceStreamSTT.ts` (20.9KB), `src/proactive/`

---

## Voice Mode

### One-line understanding

Voice mode lets users speak into the microphone, Claude Code transcribes speech in real time, processes it, then speaks back - a terminal-native voice AI assistant.

### Architecture

```
Microphone capture (native audio)
         │
         ▼
VAD (Voice Activity Detection)
  speech detected: start recording
  silence beyond threshold: stop recording
         │
         ▼
Streaming STT (voiceStreamSTT.ts)
  WebSocket -> Anthropic STT service
  live transcription while speaking
         │
         ▼
Text sent into normal Claude query flow
         │
         ▼
TTS output
  streamed playback
```

### Key files

| File | Size | Responsibility |
|------|------|----------------|
| `src/services/voice.ts` | 16.7KB | orchestrator: recording state machine, session management, Claude integration |
| `src/services/voiceStreamSTT.ts` | 20.9KB | streaming STT implementation: WebSocket + audio stream lifecycle |
| `src/services/voiceKeyterms.ts` | 3.4KB | keyword boosting for technical vocabulary |

### GrowthBook remote config

```typescript
// STT model can be switched remotely through GrowthBook
const sttModel = getFeatureValue_CACHED_MAY_BE_STALE('tengu_cobalt_frost')
  ?? 'nova-3'
```

`tengu_cobalt_frost` controls STT model version without requiring a client release.

### `voiceKeyterms`: keyword boosting

Voice mode provides code/AI vocabulary hints to STT for better recognition:

```typescript
const keyterms = [
  'TypeScript', 'Bun', 'React', 'webpack',
  'KAIROS', 'Claude', 'anthropic',
  'npm', 'async', 'await', 'Promise',
  // ... hundreds more technical terms
]
```

This reduces common generic-STT errors such as splitting technical terms incorrectly.

---

## Proactive Mode

### One-line understanding

Claude does not wait for user prompts: it proactively finds useful work. If there is nothing to do, it calls SleepTool until the next periodic `<tick>`.

### Activation

```bash
# CLI argument
claude --proactive

# environment variable
CLAUDE_CODE_PROACTIVE=1 claude
```

Compile protection: `feature('PROACTIVE') || feature('KAIROS')`.

### State machine (`src/proactive/index.ts`)

```typescript
type ProactiveState = {
  active: boolean         // enabled
  paused: boolean         // paused by Esc; resumes on next user input
  contextBlocked: boolean // block ticks on API errors to avoid loops
}
```

### Proactive System Prompt

When active, this block is appended:

```
# Proactive Mode

You are in proactive mode. Take initiative -- explore, act, and make progress
without waiting for instructions.

Start by briefly greeting the user.

You will receive periodic <tick> prompts. These are check-ins. Do whatever
seems most useful, or call Sleep if there's nothing to do.
```

Two key points:

1. **Greeting first**: avoids confusing "silent action" startup
2. **Sleep explicitly allowed**: clear fallback when no useful work exists

### SleepTool

```typescript
const SleepTool =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('./tools/SleepTool/SleepTool.js').SleepTool
    : null
```

Sleep parameters:

```typescript
{
  duration_ms: number  // bounded by minSleepDurationMs / maxSleepDurationMs
}
```

### Tick mechanism

In proactive mode, Claude is not "constantly running" in a hot loop. It receives periodic ticks:

```
no user input -> system injects <tick> every N seconds -> Claude checks if useful work exists
                                                     ├── yes -> execute
                                                     └── no  -> SleepTool(duration_ms)
```

`contextBlocked` prevents error loops when API is failing (tick -> error -> tick -> error ...).

---

## Combining Voice + Proactive

Both can be enabled together:

- Proactive mode handles autonomous behavior during user silence
- Voice mode handles spoken user input

Architecturally, both enter Claude via `query()` and are orthogonal.

---

## Next

- [Chapter 6: Engineering Practices](../ch06-engineering/01-three-layer-gates.md) - release controls and quality management
