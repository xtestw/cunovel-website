# 6.1 Three-Layer Gating Deep Dive: `feature()` / `USER_TYPE` / GrowthBook

> This chapter explains, from an **engineering practice** angle, how the gating system supports safe releases, gradual rollouts, and emergency response in Claude Code.

---

## Engineering challenges in feature rollout

For a company like Anthropic, shipping AI features safely to millions of users presents unique constraints:

1. **Code-level isolation**: before systems like KAIROS are production-ready, external binaries should not even include related code
2. **Instant global shutdown**: if voice crashes or a pet feature is broken, disable in seconds
3. **Internal debugging surface**: debugging/experimental capabilities should only be available to Anthropic staff
4. **Progressive rollout**: launch to 10% first, paid users first, etc.

The three-layer gate architecture maps directly to these needs.

---

## Layer 1: compile-time `feature()`

**Problem solved**: code-level isolation (internal code not present in external binaries)

```typescript
// src/tools.ts (real source)
const SleepTool =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('./tools/SleepTool/SleepTool.js').SleepTool
    : null
```

What happens in external build:

```javascript
// built external output
const SleepTool =
  false || false
    ? require('./tools/SleepTool/SleepTool.js').SleepTool
    : null

// bundler DCE removes dead branch entirely
const SleepTool = null
```

This is dead code elimination (DCE): external users do not merely "not see" these features - the code is absent from shipped binaries.

### How `feature()` works

```typescript
import { feature } from 'bun:bundle'
```

This is Bun's compile-time API (similar to C/C++ `#ifdef`, but integrated with JS modules). In dev mode (`bun run dev`), all `feature()` calls return `true`.

---

## Layer 2: runtime `USER_TYPE`

**Problem solved**: separate internal staff from external users, with different tooling surfaces

```typescript
// src/tools.ts
const REPLTool =
  process.env.USER_TYPE === 'ant'
    ? require('./tools/REPLTool/REPLTool.js').REPLTool
    : null
```

In external builds, `USER_TYPE` is compile-injected as `"external"`, so checks like `"external" === 'ant'` are always false.

| USER_TYPE | Meaning | Extra privileges |
|-----------|---------|------------------|
| `ant` | Anthropic internal | REPLTool, 200+ debug checkpoints, 20-min GB refresh, all internal slash commands |
| `external` | public users | standard feature set, 6-hour GB refresh |

### ant-only capabilities

| Category | Capability |
|----------|------------|
| GrowthBook | debug logs, gate overrides, 20-min refresh (vs 6h) |
| Debugging | richer API error details, prompt dump tools |
| Commands | 24+ internal-only slash commands |
| CLI flags | `--delegate-permissions`, `--afk`, `--tasks`, `--agent-teams` |
| Env vars | `CLAUDE_INTERNAL_FC_OVERRIDES` (JSON GB override) |
| Config UI | `/config` Gates tab (visual overrides) |

---

## Layer 3: GrowthBook remote A/B

**Problem solved**: real-time control and gradual rollout without shipping a new client version

### Two APIs

```typescript
// boolean feature gate
const isEnabled = checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_kairos')

// typed feature value
const model = getFeatureValue_CACHED_MAY_BE_STALE('tengu_ultraplan_model')
  ?? 'claude-opus-4-5'
```

### Cache policy differences

```typescript
// ant users
GrowthBook refresh interval = 20 minutes

// external users
GrowthBook refresh interval = 6 hours
```

The `_CACHED_MAY_BE_STALE` suffix is intentionally explicit: callers are reminded values can lag (up to 6h).

### Important GrowthBook gates

| Gate | Controls |
|------|----------|
| `tengu_kairos` | global KAIROS gate |
| `tengu_onyx_plover` | AutoDream thresholds (interval/session count) |
| `tengu_cobalt_frost` | voice STT (Nova 3) |
| `tengu_ultraplan_model` | Ultraplan model selection |
| `tengu_max_version_config` | auto-update kill switch |
| `tengu_frond_boric` | data-receiver kill switch |
| `tengu_ccr_bridge` | global Bridge gate |
| `tengu_bridge_repl_v2` | Bridge v2 protocol gate |
| `tengu_scratch` | Coordinator scratchpad |
| `tengu_session_memory` | session-memory feature |

---

## Cross-layer composition

A feature is active only if **all required layers pass**. Example: KAIROS

```
1. ✓ feature('KAIROS') = true
           ↓
2. ✓ settings.json: assistant: true
           ↓
3. ✓ trusted directory check
           ↓
4. ✓ GrowthBook: tengu_kairos = true
           ↓
5. -> setKairosActive(true)
```

If any layer fails, activation fails.

---

## Kill switch design principle

One primary reason GrowthBook exists is **emergency kill-switch control**:

```
Scenario: Dream subsystem bug causes data issues for some users
Action:
  1. Set tengu_onyx_plover.minSessions to a very large value
  2. Dream stops triggering globally (within cache window)
  3. No client release required
```

Anthropic's practical lesson: **every major feature needs an independent kill switch**.

---

## Override mechanism (internal only)

Internal users can override remote GrowthBook config for local debugging:

```bash
# method 1: environment variable
CLAUDE_INTERNAL_FC_OVERRIDES='{"tengu_kairos": true}' claude

# method 2: /config -> Gates tab -> growthBookOverrides
```

---

## Next

- [6.2 Full Compile Flag Reference](./02-feature-flags-reference.md) - all 50 gates
- [6.3 Telemetry & Observability](./03-telemetry.md) - OpenTelemetry in practice
