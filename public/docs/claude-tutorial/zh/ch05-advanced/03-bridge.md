# 5.3 Bridge：从 claude.ai 远程控制本地 CLI

> **源码位置**：`src/bridge/`（33 个文件，`replBridge.ts` 单文件 98KB）
> **编译开关**：`feature('BRIDGE_MODE')`、`feature('DAEMON')`
> **远程开关**：GrowthBook `tengu_ccr_bridge`

---

## 一句话理解

Bridge 是一个**双向通信通道**，让你可以从 claude.ai 网页或手机，控制运行在你本地电脑上的 Claude Code CLI。

```
你的手机 / 网页浏览器
         │
     HTTPS
         │
    Anthropic 服务器（消息中转）
         │
    WebSocket / SSE
         │
   你的电脑上运行的 claude 进程
```

---

## 两种工作模式

### 模式一：REPL 内嵌模式（`/remote-control`）

在你正在用的 claude 会话里输入 `/remote-control`：

```
- 当前对话被"镜像"到 claude.ai
- 本地打字 和 网页打字 都能驱动同一个会话
- 关闭网页不影响本地继续运行
```

代码：`src/bridge/initReplBridge.ts` + `src/bridge/replBridge.ts`

### 模式二：独立 Bridge 服务器（`claude remote-control`）

作为一个长期运行的后台服务：

```
注册为"环境"→ 持续轮询任务 → 每个任务启动子进程
```

代码：`src/bridge/bridgeMain.ts`（112KB！）

三种 Session 分发模式：

| 模式 | 说明 |
|------|------|
| `single-session` | 处理一个 session 后关闭 |
| `worktree` | 每个 session 获得独立 git worktree |
| `same-dir` | 所有 session 共享同一目录 |

---

## 启用条件（三层检查）

```typescript
// src/bridge/bridgeEnabled.ts
isBridgeEnabled() =
  feature('BRIDGE_MODE')             ← 编译时（外部版不可用）
  && isClaudeAISubscriber()          ← 必须是付费订阅用户
  && GrowthBook('tengu_ccr_bridge')  ← Anthropic 远程开关
```

非订阅用户会收到"请升级订阅"的诊断提示。

---

## 两代传输协议

### v1 协议（环境层方案）

完整的"环境"生命周期：

```
1. 注册环境  POST /v1/environments/bridge
2. 轮询工作  GET  /v1/environments/{id}/work/poll（长轮询，指数退避）
3. 确认工作  POST /v1/environments/{id}/work/confirm
4. 心跳      POST /v1/environments/{id}/heartbeat
5. 注销      DELETE /v1/environments/{id}
```

传输层：`HybridTransport`（WebSocket 读 + HTTP POST 写）

### v2 协议（跳过环境层）

```
1. 创建 session  POST /v1/code/sessions
2. 获取 JWT      POST /v1/code/sessions/{id}/bridge
3. 建立通道      SSE 读 + CCRClient 写
4. JWT 刷新      到期前 5 分钟主动刷新
```

v2 完全绕过 Environments API，直接连到 session-ingress，延迟更低。

GrowthBook 门控：`tengu_bridge_repl_v2`（v1 到 v2 的灰度切换开关）

---

## 服务端控制请求

通过 Bridge，claude.ai 可以对本地 CLI 发出控制指令：

| 请求类型 | 说明 |
|---------|------|
| `initialize` | 获取 CLI 能力声明 |
| `set_model` | 切换模型 |
| `set_max_thinking_tokens` | 调整思考 token 上限 |
| `set_permission_mode` | 改变权限模式（accept_edits 等）|
| `interrupt` | 中断当前操作（相当于 Ctrl+C）|

**关键时限**：控制请求必须在 **10-14 秒内**响应，否则服务端关闭连接。

---

## 消息去重：BoundedUUIDSet

`src/bridge/bridgeMessaging.ts` 里有一个精巧的去重机制：

```typescript
// 环形缓冲区，避免内存无限增长
export class BoundedUUIDSet {
  private readonly maxSize: number  // 默认 2000
  private readonly queue: string[]  // 环形缓冲区
  private readonly set: Set<string>
  
  add(uuid: string): boolean {
    if (this.set.has(uuid)) return false
    if (this.queue.length >= this.maxSize) {
      const evicted = this.queue.shift()!
      this.set.delete(evicted)
    }
    this.queue.push(uuid)
    this.set.add(uuid)
    return true
  }
}
```

用途：
- **回声去重**：过滤自己发出的消息（防止本地消息被中转回来后再次处理）
- **重投递去重**：防止同一条消息被处理两次

---

## 崩溃恢复机制

`src/bridge/bridgePointer.ts` 实现了指针文件机制：

```
写入：~/.claude/projects/<cwd-hash>/bridge-pointer.json
内容：{ sessionId, environmentId, source }
TTL：4 小时
mtime：运行时定期刷新
清除：干净退出时删除
```

下次启动 Claude Code 时，如果检测到指针文件（未超时），会提示：

```
Found an interrupted Bridge session. Would you like to resume it?
  ❯ Yes, resume session abc-123
    No, start fresh
```

---

## 安全设计

| 机制 | 说明 |
|------|------|
| **OAuth 令牌** | 主身份凭证，从系统 keychain 读取，自动刷新 |
| **Worker JWT** | 每 session 的短期令牌（几小时有效） |
| **Trusted Device Token** | 设备信任令牌，防止未知设备接管 |
| **401 自动恢复** | 检测 401 → OAuth 刷新 → 重获凭证 → 重建传输 |
| **命名空间保护** | `isInProtectedNamespace()` 防止操作敏感系统目录 |

---

## replBridge.ts 为何 98KB？

`src/bridge/replBridge.ts` 是整个项目单文件最大的（98.18KB）。这是因为它承载了整个 Bridge 系统在 REPL 模式下的**全部实现**：

- 消息 flush 队列（保证历史消息在连接建立前不丢失）
- 完整的 v1/v2 协议实现
- 状态机（`ready → connected → reconnecting → failed`）
- JWT 刷新调度器
- 权限回调路由

这种"大文件"设计是有代价的：它违反了单一职责原则，但集中管理了所有 Bridge REPL 相关的状态，避免了复杂的跨模块状态同步问题。

---

## 下一步

- [5.4 BUDDY：AI 电子宠物的确定性生成算法](./04-buddy.md)
- [5.5 Voice & Proactive](./05-voice-proactive.md)
