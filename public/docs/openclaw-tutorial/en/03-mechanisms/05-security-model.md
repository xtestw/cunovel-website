# Security Model 🔴

> As an AI Agent platform, OpenClaw faces multi-layer security threats: external attacks, prompt injection, tool abuse, data leakage. This chapter systematically covers OpenClaw's security defense architecture.

## I. 5-Layer Defense Architecture

### Layer 1: Network Authentication (Gateway Auth)

6 authentication methods (see the Auth System chapter). Production recommendation:
```yaml
gateway:
  auth:
    mode: token
    token: "${env:GATEWAY_TOKEN}"
  allowTailscale: true  # Network-level isolation via Tailscale
```

### Layer 2: Rate Limiting

```typescript
const RATE_LIMIT = { maxAttempts: 20, windowMs: 60_000 };
// IP blocked after 20 failed auth attempts in 60 seconds
```

### Layer 3: Tool Execution Security

| Mechanism | Description |
|-----------|-------------|
| **Approval Policy** | bash and dangerous tools require user approval by default |
| **Allowlist Mode** | only permit pre-defined commands |
| **Docker Sandbox** | isolate execution in a container |
| **Tool Enable/Disable** | configure which tools an agent can use |

```yaml
agents:
  default:
    allowedTools:
      - read_file
      - write_file
      # bash not in list = not available
    settings:
      bashApprovalPolicy: approve-all  # require approval for every bash execution
      docker:
        enabled: true
        image: alpine:latest
```

### Layer 4: Prompt Injection Protection

External content is wrapped with random-ID boundary markers (see Auth System chapter). The random ID in each wrapper prevents attackers from injecting fake boundary markers to escape the wrapper.

External content sources that trigger wrapping:
- `email` — Gmail/email hooks
- `webhook` — Webhook triggers
- `web_search` — search results
- `web_fetch` — URL-fetched content
- `browser` — browser-scraped content

### Layer 5: Secret Protection

**Timing-safe comparison** (`security/secret-equal.ts`):
```typescript
// Uses crypto.timingSafeEqual — prevents timing attacks
export function safeEqualSecret(a: string, b: string): boolean { ... }
```

**Log sanitization**: known secret values are automatically replaced with `[REDACTED]` before logging.

**SecretRef memory protection**: Secret values exist as sealed objects in memory, cannot be serialized by `JSON.stringify`.

---

## II. Docker Sandbox (Advanced Security)

For high-security environments, enable Docker sandbox to isolate all bash execution:

```yaml
agents:
  default:
    settings:
      docker:
        enabled: true
        image: 'ubuntu:22.04'
        workspaceMount: '/workspace'
        resourceLimits:
          memory: '512m'
          cpus: '1.0'
```

---

## III. Channel-Level Security

Channel plugins implement `ChannelSecurityAdapter` for platform-specific access control:

```yaml
channels:
  telegram:
    allowlist:
      userIds: ["123456789", "987654321"]  # only these users
```

---

## Key Source Files

| File | Size | Role |
|------|------|------|
| `src/gateway/auth.ts` | 18KB | Gateway authentication |
| `src/security/external-content.ts` | 364 lines | Prompt injection protection |
| `src/security/secret-equal.ts` | - | Timing-safe secret comparison |
| `src/agents/bash-tools.exec-approval-request.ts` | 7.5KB | Tool execution approval |

---

## Summary

1. **5-layer defense**: network auth → rate limiting → tool security → prompt injection → secret protection.
2. **Out-of-box security**: auth, rate limiting, tool approval work with default configuration.
3. **Prompt injection core defense**: random-ID boundary markers prevent fake boundary injection.
4. **Docker sandbox is strongest**: complete isolation from host system for high-security deployments.
5. **Multi-layer secret protection**: SecretRef syntax + memory sealing + log sanitization + timing-safe comparison.

---

*[← Memory & MCP](04-memory-mcp.md) | [→ Skill System](../04-application/01-skill-system.md)*
