# 安全模型 🔴

> OpenClaw 作为一个 AI Agent 平台，面临多层次的安全威胁：外部攻击、提示注入、工具滥用、数据泄露。本章系统梳理 OpenClaw 的安全防御体系。

## 本章目标

读完本章你将能够：
- 理解 OpenClaw 的 5 层安全防御架构
- 理解哪些安全机制是开箱即用的，哪些需要手动配置
- 了解提示注入的多种攻击向量和防御策略
- 理解工具执行沙箱的设计

---

## 一、安全威胁全景

OpenClaw 面临的安全威胁来自多个方向：

```mermaid
flowchart TB
    subgraph EXTERNAL["外部威胁"]
        T1["未授权访问\n（未经认证连接 Gateway）"]
        T2["速率攻击\n（暴力破解凭证）"]
    end
    subgraph CONTENT["内容威胁"]
        T3["提示注入\n（恶意指令嵌入外部内容）"]
        T4["System Prompt 泄露\n（诱骗 AI 透露指令）"]
    end
    subgraph EXECUTION["执行威胁"]
        T5["工具滥用\n（AI 执行未预期的危险命令）"]
        T6["路径遍历\n（读取敏感文件）"]
    end
    subgraph DATA["数据威胁"]
        T7["Secret 泄露\n（API Key 暴露在日志/回复中）"]
        T8["会话数据泄露\n（跨用户数据访问）"]
    end
```

---

## 二、5 层安全防御

### 层 1：网络认证（Gateway Auth）

**防御**：未授权访问

如第 03-mechanisms/02 章所述，Gateway 支持 6 种认证方式。

关键配置：

```yaml
# config.yaml — 生产环境推荐配置
gateway:
  auth:
    mode: token                    # 使用 Token 认证
    token: "${env:GATEWAY_TOKEN}"  # Token 通过环境变量注入
  
  # 可选：Tailscale 网络隔离（最安全）
  allowTailscale: true
  # 此时只有 Tailscale 网络内的设备才能访问 Gateway
```

### 层 2：速率限制（Rate Limiting）

**防御**：暴力破解攻击

```typescript
// auth-rate-limit.ts
const RATE_LIMIT_CONFIG = {
  maxAttempts: 20,         // 最大失败次数
  windowMs: 60_000,        // 时间窗口：60 秒
  // 超出后：封禁该 IP 直到窗口结束
};
```

此外，消息处理也有速率限制（`per-account` 或 `per-session`），防止恶意用户疯狂发消息触发大量 LLM 调用。

### 层 3：工具执行安全（Tool Execution Security）

**防御**：工具滥用

OpenClaw 对危险工具的执行有多重保护：

| 机制 | 描述 |
|------|------|
| **审批策略**（Approval Policy）| bash 等危险工具默认需要用户批准 |
| **白名单模式**（Allowlist Mode）| 只允许执行预定义的命令 |
| **Docker 沙箱**（Docker Sandbox）| 在容器中隔离执行，防止影响宿主系统 |
| **工具启用/禁用**（Tool Enable/Disable）| 可通过配置禁用特定工具 |

```yaml
# config.yaml — 工具安全配置
agents:
  default:
    allowedTools:
      - read_file      # 允许读文件
      - write_file     # 允许写文件
      # - bash         # 不允许执行 bash（不在列表中）
    
    settings:
      # 或者允许 bash 但要求审批
      bashApprovalPolicy: approve-all   # 每次都需要用户批准
      
      # 生产环境：使用 Docker 沙箱
      docker:
        enabled: true
        image: alpine:latest
```

### 层 4：提示注入防护（Prompt Injection Protection）

**防御**：通过外部内容注入恶意指令

如第 03-mechanisms/02 章所述，`external-content.ts` 提供：

1. **内容包装**：所有外部内容（邮件、webhook 内容、网页、工具返回等）都被包裹在带随机 ID 的边界标记中：

```
<<<EXTERNAL_UNTRUSTED_CONTENT id="a3f1b9c2d7e8f4a5">>>
SECURITY NOTICE: Content from EXTERNAL, UNTRUSTED source.
[实际外部内容]
<<<END_EXTERNAL_UNTRUSTED_CONTENT id="a3f1b9c2d7e8f4a5">>>
```

2. **模式检测**：12 种注入模式检测，记录日志（但不阻断）

触发提示注入包装的外部内容源：

```typescript
type ExternalContentSource =
  | 'email'          // Gmail/邮件 Hook
  | 'webhook'        // Webhook 触发
  | 'api'            // API 调用返回
  | 'browser'        // 浏览器爬取内容
  | 'channel_metadata' // 渠道元数据
  | 'web_search'     // 搜索结果
  | 'web_fetch'      // URL 抓取内容
  | 'unknown';       // 未知外部来源
```

### 层 5：Secret 保护（Secret Protection）

**防御**：Secret 泄露

OpenClaw 的 Secret 保护机制：

**a. 时序安全比较**：防止时序攻击（Timing Attack）

```typescript
// security/secret-equal.ts
// 使用恒定时间比较，防止攻击者通过响应时间推断密钥前缀
export function safeEqualSecret(a: string, b: string): boolean {
  // 使用 crypto.timingSafeEqual 实现
}
```

**b. SecretRef 内存保护**：Secret 值在内存中以密封对象形式存在，不会被 `JSON.stringify` 序列化：

```typescript
// 配置对象中的 Secret 是一个特殊类型，不能被直接读取
type ResolvedSecret = {
  readonly value: string;  // 只在授权路径中可读
  [Symbol.toPrimitive](): string;  // 但不能被序列化到 JSON
};
```

**c. 日志脱敏**：日志输出前自动替换已知 Secret 值为 `[REDACTED]`。

---

## 三、Docker 沙箱（高级安全配置）

在高安全环境中，可以启用 Docker 沙箱，让 Agent 的所有 bash 执行都在容器中隔离运行：

```mermaid
flowchart LR
    AGENT["Agent 请求执行\nbash ls /etc/passwd"]
    DOCKER["Docker 容器\n（隔离环境）"]
    HOST["宿主系统\n（不受影响）"]
    RESULT["执行结果返回"]

    AGENT --> DOCKER
    DOCKER -->|"执行"| RESULT
    DOCKER -.->|"无法访问"| HOST
```

Docker 沙箱配置：

```yaml
# config.yaml
agents:
  default:
    settings:
      docker:
        enabled: true
        image: 'ubuntu:22.04'   # 沙箱镜像
        workspaceMount: '/workspace'  # 挂载工作目录
        resourceLimits:
          memory: '512m'        # 内存限制
          cpus: '1.0'           # CPU 限制
```

---

## 四、渠道级安全

每个渠道插件都可以实现 `ChannelSecurityAdapter`，提供渠道特定的安全检查：

```typescript
type ChannelSecurityAdapter = {
  // 检查用户是否被允许与 Bot 交互
  checkAccess(params: {
    peer: RoutePeer;
    accountId: string;
  }): Promise<SecurityCheckResult>;
};
```

例如 Telegram 渠道可以实现白名单：

```yaml
# config.yaml
channels:
  telegram:
    allowlist:
      userIds: ["123456789", "987654321"]  # 只有这两个用户可以使用
```

---

## 关键源码索引

| 文件 | 大小 | 作用 |
|------|------|------|
| `src/gateway/auth.ts` | 18KB | Gateway 认证（6 种方式）|
| `src/gateway/auth-rate-limit.ts` | 7.6KB | 认证速率限制 |
| `src/security/external-content.ts` | 364行 | 提示注入防护 |
| `src/security/secret-equal.ts` | - | 时序安全密文比较 |
| `src/agents/bash-tools.exec-approval-request.ts` | 7.5KB | 工具执行审批请求 |
| `src/agents/bash-tools.exec-approval-followup.ts` | 7.8KB | 工具执行审批后续处理 |
| `src/agents/bash-tools.build-docker-exec-args.test.ts` | 2.7KB | Docker 参数构建测试 |

---

## 小结

1. **5 层防御纵深**：网络认证 → 速率限制 → 工具安全 → 提示注入防护 → Secret 保护。
2. **开箱即用的安全**：认证、速率限制、工具审批在默认配置下即可工作。
3. **提示注入防护的核心**：随机 ID 边界标记 + 模式检测，防止攻击者伪造边界。
4. **Docker 沙箱是最强防线**：让工具执行与宿主系统完全隔离，适合高安全部署。
5. **Secret 保护多层次**：SecretRef 语法（不写入配置）+ 内存封装 + 日志脱敏 + 时序安全比较。

---

*[← 记忆与 MCP](04-memory-mcp.md) | [→ Skill 系统](../04-application/01-skill-system.md)*
