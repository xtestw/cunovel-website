# 6.1 三层门控详解：feature() / USER_TYPE / GrowthBook

> 本章从**工程实践**角度，深入讲解功能门控体系如何支撑 Claude Code 的安全发布、灰度测试和应急响应。

---

## 功能发布的工程挑战

对于 Anthropic 这样的公司，向数百万用户安全地发布 AI 功能面临独特挑战：

1. **代码级隔离**：KAIROS 这类复杂系统在内部测试完成前，外部版二进制里不应包含相关代码
2. **问题功能立即关闭**：语音识别崩溃、电子宠物有 bug，需要秒级全球关闭
3. **内部调试环境**：调试工具、实验功能，只有 Anthropic 内部人员应该能用
4. **灰度发布**：对 10% 用户先放开，对付费用户优先，等等

三层门控系统针对这四个需求分别设计了解决方案。

---

## 第一层：编译时 feature()

**解决问题**：代码级隔离（外部版本里根本不包含内部代码）

```typescript
// src/tools.ts（真实源码）
const SleepTool =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('./tools/SleepTool/SleepTool.js').SleepTool
    : null
```

**Bun 构建时发生了什么**：

外部版本构建时，`feature('KAIROS')` → `false`：

```javascript
// 构建后的外部版代码
const SleepTool =
  false || false    // 两个 feature() 都是 false
    ? require('./tools/SleepTool/SleepTool.js').SleepTool
    : null

// Bundler DCE 优化：条件永远为 false，整个 require 被死代码消除
const SleepTool = null
// SleepTool 模块的内容完全不在外部版二进制中
```

这是**死代码消除（DCE）**。外部用户不仅"看不到"这些功能，连代码本身都不在他们下载的二进制文件里。

### feature() 的实现原理

```typescript
import { feature } from 'bun:bundle'
```

这是 Bun 专有的编译时 API，类似 C/C++ 的 `#ifdef` 预处理指令，但集成在 JavaScript 模块系统中。在开发模式（`bun run dev`）下，所有 `feature()` 返回 `true`，可以看到所有功能。

---

## 第二层：USER_TYPE 运行时

**解决问题**：区分内部员工和外部用户，提供不同的工具集和调试能力

```typescript
// src/tools.ts（真实源码）
const REPLTool =
  process.env.USER_TYPE === 'ant'
    ? require('./tools/REPLTool/REPLTool.js').REPLTool
    : null
```

源码中到处可见 `"external" === 'ant'` 的比较，这永远为 `false`——因为外部版 `USER_TYPE` 在构建时被硬编码为 `"external"`。

| USER_TYPE | 含义 | 额外权限 |
|-----------|------|---------|
| `ant` | Anthropic 内部员工 | REPLTool、200+ 调试检查点、20 分钟 GrowthBook 刷新、全部内部斜杠命令 |
| `external` | 外部用户 | 标准功能集、6 小时 GrowthBook 刷新 |

### ant 专属能力

| 类别 | 能力 |
|------|------|
| GrowthBook | 调试日志、开关覆盖、20 分钟刷新（vs 6 小时）|
| 调试 | API 错误详情、prompt dump 工具 |
| 命令 | 24+ 个内部专属斜杠命令 |
| CLI 参数 | `--delegate-permissions`、`--afk`、`--tasks`、`--agent-teams` |
| 环境变量 | `CLAUDE_INTERNAL_FC_OVERRIDES`（JSON 覆盖 GrowthBook）|
| 配置 UI | `/config` Gates 标签页（可视化覆盖 GrowthBook）|

---

## 第三层：GrowthBook 远程 A/B

**解决问题**：无需发布新版本，实时控制功能的开关和灰度比例

### 两种 API

```typescript
// 布尔型 Feature Gate（开/关）
const isEnabled = checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_kairos')

// 字符串/数值型 Feature Value（配置参数）
const model = getFeatureValue_CACHED_MAY_BE_STALE('tengu_ultraplan_model')
  ?? 'claude-opus-4-5'
```

### 缓存策略的差异

```typescript
// ant 用户（Anthropic 内部）
GrowthBook 刷新间隔 = 20 分钟  // 快速反映配置变化，便于调试

// external 用户（外部）
GrowthBook 刷新间隔 = 6 小时   // 减少 GrowthBook 服务器负载
```

函数名中刻意包含 `_CACHED_MAY_BE_STALE`——这是一种"诚实的命名"，提醒调用者这个值可能不是最新的（最长有 6 小时的延迟）。

### 关键 GrowthBook 开关

| 开关 | 控制内容 |
|------|---------|
| `tengu_kairos` | KAIROS 助手模式总开关 |
| `tengu_onyx_plover` | AutoDream 触发阈值（整合间隔/会话数）|
| `tengu_cobalt_frost` | 语音识别（Nova 3 模型）开关 |
| `tengu_ultraplan_model` | Ultraplan 使用的模型 |
| `tengu_max_version_config` | 自动更新 Kill Switch |
| `tengu_frond_boric` | 数据接收器 Kill Switch |
| `tengu_ccr_bridge` | Bridge 远程控制总开关 |
| `tengu_bridge_repl_v2` | Bridge v2 传输协议开关 |
| `tengu_scratch` | Coordinator Scratchpad 目录 |
| `tengu_session_memory` | 会话记忆功能 |

---

## 三层的协同：一个功能被激活需要通过所有层

以 KAIROS 为例：

```
激活 KAIROS 需要同时满足：

1. ✓ feature('KAIROS') = true    ← 编译时（外部版永远不满足）
           ↓
2. ✓ settings.json: assistant: true  ← 用户手动配置
           ↓
3. ✓ 目录信任检查通过               ← 安全检查
           ↓
4. ✓ GrowthBook: tengu_kairos = true ← Anthropic 远程控制
           ↓
5. → setKairosActive(true)           ← 功能激活
```

任何一层不通过，功能都不会激活。

---

## Kill Switch 设计原则

GrowthBook 层的存在意义之一是**紧急 Kill Switch**：

```
场景：KAIROS 的 Dream 功能出现 bug，导致某些用户数据异常
处理：
  1. Anthropic 在 GrowthBook 控制台将 tengu_onyx_plover 的 minSessions 设为极大值
  2. 所有用户（最晚 6 小时后）不再触发 Dream
  3. 不需要发布任何新版本
```

这是 Anthropic 在 AI 功能发布中总结出的重要经验：**每个功能都必须有独立的 Kill Switch**。

---

## 覆盖机制（仅内部用户）

内部用户可以覆盖 GrowthBook 的远程配置，用于本地调试：

```bash
# 方法 1：环境变量
CLAUDE_INTERNAL_FC_OVERRIDES='{"tengu_kairos": true}' claude

# 方法 2：/config → Gates 标签页 → growthBookOverrides
```

---

## 下一步

- [6.2 完整编译开关速查表](./02-feature-flags-reference.md) — 50 个开关全览
- [6.3 遥测与可观测性](./03-telemetry.md) — OpenTelemetry 实践
