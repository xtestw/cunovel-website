# 2.2 Three-Layer Feature Gate System

> **Chapter goal**: Understand how Claude Code uses a three-layer mechanism to control feature visibility, and the engineering considerations behind this design.

---

## Why Is a Gate System Needed?

Claude Code has many internal features that are not publicly exposed. Anthropic needs to solve several problems:

1. **Safe rollout**: new features cannot be exposed to all users immediately; progressive rollout is required
2. **Code isolation**: external builds should not contain internal debugging tool code
3. **Fast response**: if a feature fails, it must be remotely disabled immediately
4. **A/B testing**: different feature configurations must be testable across user groups

The three-layer gate system is designed for these four needs:

```
Layer 1: compile time → solves code isolation
Layer 2: runtime → solves user-type differentiation  
Layer 3: remote config → solves progressive rollout and emergency shutdown
```

---

## Layer 1: Compile-Time Switch `feature()`

**Mechanism**: dead code elimination (DCE) during Bun build

```typescript
// source form
import { feature } from 'bun:bundle'

const coordinatorModule = feature('COORDINATOR_MODE')
  ? require('./coordinator/coordinatorMode.js')
  : null
```

When building the external edition, `feature('COORDINATOR_MODE')` is replaced with `false`:

```javascript
// after build
const coordinatorModule = false
  ? require('./coordinator/coordinatorMode.js')  // ← this line is removed entirely
  : null
```

The bundler sees that this code path is unreachable and removes it from output directly. **Coordinator-related code literally does not exist in the external binary**.

### Full Classification of 50 Compile Switches

| Category | Switch names |
|------|---------|
| **Core features** | BUDDY, KAIROS, KAIROS_BRIEF, KAIROS_CHANNELS, KAIROS_GITHUB_WEBHOOKS, ULTRAPLAN, COORDINATOR_MODE, BRIDGE_MODE, VOICE_MODE, PROACTIVE, FORK_SUBAGENT, DAEMON |
| **Infrastructure** | UDS_INBOX, WORKFLOW_SCRIPTS, TORCH, MONITOR_TOOL, HISTORY_SNIP, BG_SESSIONS, CCR_REMOTE_SETUP, CHICAGO_MCP, HARD_FAIL |
| **Context optimization** | CACHED_MICROCOMPACT, CONTEXT_COLLAPSE, REACTIVE_COMPACT, QUICK_SEARCH, TOKEN_BUDGET, STREAMLINED_OUTPUT |
| **Security & compliance** | ANTI_DISTILLATION_CC, BASH_CLASSIFIER, NATIVE_CLIENT_ATTESTATION, TRANSCRIPT_CLASSIFIER, UNATTENDED_RETRY |
| **Data & telemetry** | EXTRACT_MEMORIES, MEMORY_SHAPE_TELEMETRY, COWORKER_TYPE_TELEMETRY, SLOW_OPERATION_LOGGING, COMMIT_ATTRIBUTION |
| **Experimental** | EXPERIMENTAL_SKILL_SEARCH, MCP_SKILLS, LODESTONE, TEMPLATES, TEAMMEM |
| **User settings sync** | DOWNLOAD_USER_SETTINGS, UPLOAD_USER_SETTINGS, FILE_PERSISTENCE |

---

## Layer 2: User Type `USER_TYPE`

**Mechanism**: runtime environment variable checks

```typescript
// real code from src/tools.ts
const REPLTool =
  process.env.USER_TYPE === 'ant'
    ? require('./tools/REPLTool/REPLTool.js').REPLTool
    : null
```

Two user types:

| Type | Description | Impact |
|------|------|------|
| `ant` | Anthropic internal employee | unlocks full features, 20-minute GrowthBook refresh, 200+ internal debug checks |
| `external` | external user | trimmed feature set, 6-hour GrowthBook refresh |

### Internal-Only Tools (`USER_TYPE === 'ant'`)

- `REPLTool`: interactive REPL debugging tool
- `SuggestBackgroundPRTool`: PR suggestion tool
- 24+ slash commands (`/bughunter`, `/ctx_viz`, `/break-cache`, etc.)

---

## Layer 3: GrowthBook Remote A/B Testing

**Mechanism**: fetch feature flags from GrowthBook service at runtime

```typescript
// actual call style seen in source
import { getFeatureValue_CACHED_MAY_BE_STALE } from './services/analytics/growthbook.js'
import { checkStatsigFeatureGate_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'

// example: check whether KAIROS is enabled
const isKairosEnabled = getFeatureValue_CACHED_MAY_BE_STALE('tengu_kairos')

// example: check Coordinator Scratchpad feature
const scratchpadEnabled = checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_scratch')
```

Notice `_CACHED_MAY_BE_STALE` in the function names—this is intentional:

- **`ant` users**: 20-minute cache (frequent updates, easier debugging)
- **`external` users**: 6-hour cache (lower GrowthBook request frequency)

### Key GrowthBook Switches (`tengu_` prefix)

| Switch name | Controls |
|--------|---------|
| `tengu_kairos` | global switch for KAIROS assistant mode |
| `tengu_onyx_plover` | auto Dream trigger threshold (interval/session count) |
| `tengu_cobalt_frost` | speech recognition (Nova 3 model) |
| `tengu_ultraplan_model` | model used by Ultraplan |
| `tengu_ccr_bridge` | global Bridge remote control switch |
| `tengu_bridge_repl_v2` | Bridge v2 transport protocol switch |
| `tengu_max_version_config` | auto-update kill switch |
| `tengu_session_memory` | session memory feature |
| `tengu_scratch` | Coordinator Scratchpad directory |
| `tengu_sm_config` | session memory config parameters |
| `tengu_frond_boric` | data receiver kill switch |

---

## Three-Layer Composition Example: KAIROS Activation Flow

A real feature activation must pass all layers:

```
To activate KAIROS assistant mode:

1. Compile time: feature('KAIROS') = true         ← external build cannot pass
        ↓
2. Runtime: settings.json assistant: true         ← user enables manually
        ↓
3. Directory trust: directory is trusted by user  ← security check
        ↓
4. GrowthBook: tengu_kairos = true                ← Anthropic remote switch
        ↓
5. Global state: setKairosActive(true)            ← final activation
```

If any layer fails, KAIROS will not activate.

---

## Engineering Value of This Design

### Kill Switch Principle

GrowthBook ensures **any feature can be globally disabled within seconds**:

```typescript
// suppose a feature has a serious issue
// Anthropic only needs to set tengu_some_feature = false in the GrowthBook console
// all users will read the new value on next refresh (at most 6 hours) and disable it
```

### Essential Difference: Internal vs External Build

```
External build (npm package):
  feature('KAIROS') → false → KAIROS code is 100% absent from binary

Internal build (run by Anthropic employees):
  feature('KAIROS') → true → KAIROS code exists + GrowthBook remote switch
```

This is not "hidden functionality"; it is **a release-controlled difference between code at different productization levels**.

---

## Next

- [2.3 Global State Management](./03-global-state.md) — detailed analysis of `bootstrap/state.ts`
- [2.4 UI Layer: React + Ink](./04-ink-tui.md) — terminal React rendering principles
