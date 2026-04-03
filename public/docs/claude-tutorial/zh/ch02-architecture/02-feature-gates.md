# 2.2 三层功能门控系统

> **章节目标**：理解 Claude Code 如何用三层机制控制功能的可见性，以及这套设计背后的工程考量。

---

## 为什么需要门控系统？

Claude Code 内部有大量未公开的功能。Anthropic 需要解决几个问题：

1. **安全发布**：新功能不能直接暴露给所有用户，需要灰度
2. **代码隔离**：外部版不应包含内部调试工具的代码
3. **快速响应**：如果某个功能出问题，需要能立即远程关闭
4. **A/B 测试**：需要对不同用户群测试不同功能配置

三层门控系统就是针对这四个需求设计的：

```
第一层：编译时 → 解决代码隔离
第二层：运行时 → 解决用户类型区分  
第三层：远程配置 → 解决灰度发布和紧急关闭
```

---

## 第一层：编译时开关 `feature()`

**机制**：Bun 构建时的死代码消除（Dead Code Elimination / DCE）

```typescript
// 源码写法
import { feature } from 'bun:bundle'

const coordinatorModule = feature('COORDINATOR_MODE')
  ? require('./coordinator/coordinatorMode.js')
  : null
```

构建外部版时，`feature('COORDINATOR_MODE')` 被替换为 `false`：

```javascript
// 构建后
const coordinatorModule = false
  ? require('./coordinator/coordinatorMode.js')  // ← 这行被完全删除
  : null
```

Bundler 发现这段代码永远不可达，直接从输出文件中删除。**外部版二进制文件里根本不存在 Coordinator 相关代码**。

### 完整的 50 个编译开关分类

| 类别 | 开关名称 |
|------|---------|
| **核心功能** | BUDDY, KAIROS, KAIROS_BRIEF, KAIROS_CHANNELS, KAIROS_GITHUB_WEBHOOKS, ULTRAPLAN, COORDINATOR_MODE, BRIDGE_MODE, VOICE_MODE, PROACTIVE, FORK_SUBAGENT, DAEMON |
| **基础设施** | UDS_INBOX, WORKFLOW_SCRIPTS, TORCH, MONITOR_TOOL, HISTORY_SNIP, BG_SESSIONS, CCR_REMOTE_SETUP, CHICAGO_MCP, HARD_FAIL |
| **上下文优化** | CACHED_MICROCOMPACT, CONTEXT_COLLAPSE, REACTIVE_COMPACT, QUICK_SEARCH, TOKEN_BUDGET, STREAMLINED_OUTPUT |
| **安全合规** | ANTI_DISTILLATION_CC, BASH_CLASSIFIER, NATIVE_CLIENT_ATTESTATION, TRANSCRIPT_CLASSIFIER, UNATTENDED_RETRY |
| **数据与遥测** | EXTRACT_MEMORIES, MEMORY_SHAPE_TELEMETRY, COWORKER_TYPE_TELEMETRY, SLOW_OPERATION_LOGGING, COMMIT_ATTRIBUTION |
| **实验性** | EXPERIMENTAL_SKILL_SEARCH, MCP_SKILLS, LODESTONE, TEMPLATES, TEAMMEM |
| **用户设置同步** | DOWNLOAD_USER_SETTINGS, UPLOAD_USER_SETTINGS, FILE_PERSISTENCE |

---

## 第二层：用户类型 `USER_TYPE`

**机制**：运行时环境变量检查

```typescript
// src/tools.ts 实际代码
const REPLTool =
  process.env.USER_TYPE === 'ant'
    ? require('./tools/REPLTool/REPLTool.js').REPLTool
    : null
```

两种用户类型：

| 类型 | 说明 | 影响 |
|------|------|------|
| `ant` | Anthropic 内部员工 | 解锁全部功能、20 分钟 GrowthBook 刷新、200+ 处专属调试检查 |
| `external` | 外部用户 | 裁剪版功能、6 小时 GrowthBook 刷新 |

### 内部专属工具（USER_TYPE === 'ant'）

- `REPLTool`：交互式 REPL 调试工具
- `SuggestBackgroundPRTool`：PR 建议工具
- 24+ 个 `/` 斜杠命令（`/bughunter`、`/ctx_viz`、`/break-cache` 等）

---

## 第三层：GrowthBook 远程 A/B 测试

**机制**：运行时从 GrowthBook 服务拉取特性标志

```typescript
// 从源码中实际看到的调用方式
import { getFeatureValue_CACHED_MAY_BE_STALE } from './services/analytics/growthbook.js'
import { checkStatsigFeatureGate_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'

// 示例：检查 KAIROS 是否开启
const isKairosEnabled = getFeatureValue_CACHED_MAY_BE_STALE('tengu_kairos')

// 示例：检查 Coordinator Scratchpad 功能  
const scratchpadEnabled = checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_scratch')
```

注意函数名中的 `_CACHED_MAY_BE_STALE`——这是刻意的设计：

- **`ant` 用户**：缓存 20 分钟（频繁更新，调试方便）
- **`external` 用户**：缓存 6 小时（减少 GrowthBook 请求频率）

### 关键 GrowthBook 开关（`tengu_` 前缀）

| 开关名 | 控制内容 |
|--------|---------|
| `tengu_kairos` | KAIROS 助手模式总开关 |
| `tengu_onyx_plover` | 自动 Dream 的触发阈值（间隔时长 / 会话数） |
| `tengu_cobalt_frost` | 语音识别（Nova 3 模型）开关 |
| `tengu_ultraplan_model` | Ultraplan 功能使用的模型 |
| `tengu_ccr_bridge` | Bridge 远程控制总开关 |
| `tengu_bridge_repl_v2` | Bridge v2 传输协议开关 |
| `tengu_max_version_config` | 自动更新 Kill Switch |
| `tengu_session_memory` | 会话记忆功能 |
| `tengu_scratch` | Coordinator Scratchpad 目录 |
| `tengu_sm_config` | 会话记忆配置参数 |
| `tengu_frond_boric` | 数据接收器 Kill Switch |

---

## 三层组合案例：KAIROS 激活流程

一个真实的功能激活需要通过三层检查：

```
激活 KAIROS 助手模式需要：

1. 编译时：feature('KAIROS') = true         ← 外部版无法通过
        ↓
2. 运行时：settings.json 的 assistant: true  ← 用户手动开启
        ↓
3. 目录信任：该目录已被用户信任              ← 安全检查
        ↓
4. GrowthBook：tengu_kairos = true          ← Anthropic 远程开关
        ↓
5. 全局状态：setKairosActive(true)          ← 最终激活
```

任何一层不满足，KAIROS 都不会激活。

---

## 这套设计的工程价值

### Kill Switch 原则

GrowthBook 的设计确保了**任何功能都可以在秒级内全球关闭**：

```typescript
// 假设某个功能出现严重问题
// Anthropic 只需在 GrowthBook 控制台将 tengu_some_feature 设为 false
// 所有用户的下一次请求（最晚 6 小时后）都会读到新值并关闭该功能
```

### 内部版 vs 外部版的本质差异

```
外部版（npm 包）：
  feature('KAIROS') → false → KAIROS 代码 100% 不存在于二进制

内部版（Anthropic 员工运行）：
  feature('KAIROS') → true → KAIROS 代码存在 + GrowthBook 远程开关
```

这不是"隐藏功能"，而是**产品化程度不同的代码在发布管控下的差异**。

---

## 下一步

- [2.3 全局状态管理](./03-global-state.md) — bootstrap/state.ts 详解
- [2.4 UI 层：React + Ink](./04-ink-tui.md) — 终端 React 渲染原理
