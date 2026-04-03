# 1.2 技术栈与运行环境

> **章节目标**：了解 Claude Code 的技术选型，理解每个技术选择背后的原因。

---

## 运行时：为什么选 Bun？

Claude Code 运行在 **Bun ≥ 1.3.5**（同时兼容 Node.js ≥ 24）。

```bash
bun install    # 安装依赖
bun run dev    # 启动
```

选择 Bun 而非 Node.js 的原因：

| 特性 | 优势 |
|------|------|
| **原生 TypeScript 执行** | 无需编译步骤，直接运行 `.ts` 文件 |
| **`bun:bundle` 特性** | `feature()` 编译时开关直接集成于打包器 |
| **更快的启动速度** | CLI 工具启动延迟更低 |
| **内置测试运行器** | 统一工具链 |

最关键的是 `import { feature } from 'bun:bundle'`——这个 API 允许在构建时做死代码消除（DCE），让不同版本的功能开关能从二进制层面彻底隔离。

---

## UI 层：React + Ink

这是整个技术栈里最"反直觉"的选择：**在终端里用 React 渲染 UI**。

```typescript
// src/components/某个组件.tsx
import { Box, Text } from 'ink'
import React from 'react'

function StatusBar({ model, cost }: Props) {
  return (
    <Box borderStyle="round">
      <Text color="green">{model}</Text>
      <Text> ${cost.toFixed(4)}</Text>
    </Box>
  )
}
```

[Ink](https://github.com/vadimdemedes/ink) 是一个把 React 渲染到终端的库。Claude Code 用它实现了：

- **实时流式输出**：助手回复边生成边显示
- **可交互的权限对话框**：用键盘上下选择
- **工具执行进度动画**：Spinner 等
- **响应式布局**：窄终端自动调整显示

源码中有 148 个终端 UI 组件（`src/components/`）和 87 个自定义 Hooks（`src/hooks/`），规模堪比一个中型 Web 前端项目。

---

## AI 通信层：多云支持

```typescript
// 三种 AI 后端，同一套接口
import '@anthropic-ai/sdk'              // 直接调用 Anthropic API
// 或
process.env.CLAUDE_CODE_USE_BEDROCK     // AWS Bedrock
// 或
process.env.CLAUDE_CODE_USE_VERTEX      // Google Cloud Vertex AI
```

这种设计让企业用户可以在自己的云环境中部署，无需流量经过 Anthropic 服务器。

---

## 完整依赖技术栈

### 核心 AI 相关

| 库 | 用途 |
|----|------|
| `@anthropic-ai/sdk` | Anthropic API 客户端 |
| `@anthropic-ai/claude-agent-sdk` | Agent SDK（headless 模式） |
| `@modelcontextprotocol/sdk` | MCP 协议支持 |

### 网络通信

| 库 | 用途 |
|----|------|
| `axios` | HTTP 请求 |
| `undici` | 高性能 HTTP（Node.js 内置） |
| `ws` | WebSocket（Bridge 远程控制） |
| Server-Sent Events | 流式响应接收 |

### UI & 交互

| 库 | 用途 |
|----|------|
| `ink` | 终端 React 渲染器 |
| `react` | UI 组件框架 |
| `fuse.js` | 模糊搜索（命令补全） |

### 文件系统 & 进程

| 库 | 用途 |
|----|------|
| `chokidar` | 文件监听（热更新） |
| `execa` | 进程执行（替代 child_process） |
| `tree-kill` | 进程树终止 |

### 数据解析

| 库 | 用途 |
|----|------|
| `yaml` | YAML 配置解析 |
| `jsonc-parser` | 带注释的 JSON 解析 |
| `zod` | 运行时类型验证 |

### 可观测性

| 库 | 用途 |
|----|------|
| `@opentelemetry/*` | 全套 OpenTelemetry 遥测 |

---

## 语言：TypeScript + ESM

所有源码使用 **TypeScript** + **ES Modules（ESM）**：

```typescript
// 典型的源文件头部
import { feature } from 'bun:bundle'  // Bun 专有编译特性
import type { Tool } from './Tool.js'  // .js 后缀（ESM 规范）
import { randomUUID } from 'crypto'    // Node.js 内置
```

值得注意的约定：
- `.js` 后缀的 import——这是 ESM 规范要求，即使文件实际是 `.ts`
- `type` 关键字——明确区分类型导入和值导入，利于 Tree Shaking
- `bun:bundle` 特殊导入——仅在 Bun 编译时可用

---

## 原生模块（Native Modules）

```
shims/            # 原生模块的 JS 替代实现
vendor/           # 原生绑定源码（C++/Rust）
image-processor.node  # 预编译的图片处理模块
```

Claude Code 包含少量原生 Node.js 模块（`.node` 文件），用于图片处理等性能敏感场景。`shims/` 目录提供了跨平台兼容的 JavaScript 替代实现。

---

## 下一步

- [1.3 源码地图：1,987 个文件怎么看](./03-codebase-map.md) — 快速建立目录结构认知
- [第二章：架构设计](../ch02-architecture/01-six-layer-architecture.md) — 理解分层设计
