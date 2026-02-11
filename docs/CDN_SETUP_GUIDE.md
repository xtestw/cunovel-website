# 国内访问加速方案 - CDN 配置指南

由于 Vercel 在国内访问可能不稳定，可以使用 CDN 做一层代理来加速国内访问。

## ⚠️ 重要提示

**如果 `cutool.vercel.app` 在国内无法访问，CDN 回源也会失败！**

如果遇到这种情况，请参考 **[国内部署方案](./DEPLOY_TO_CHINA.md)**，将静态文件直接部署到国内云存储（腾讯云 COS 或阿里云 OSS），而不是通过 CDN 回源到 Vercel。

## 方案一：腾讯云 CDN（推荐）

### 前置准备

1. **域名准备**
   - 确保 `cutool.online` 已备案（如果使用国内 CDN，域名必须备案）
   - 如果没有备案，可以考虑使用子域名如 `cn.cutool.online` 或使用海外 CDN

2. **腾讯云账号**
   - 注册腾讯云账号并完成实名认证
   - 开通 CDN 服务

### 配置步骤

#### 1. 添加 CDN 加速域名

1. 登录 [腾讯云 CDN 控制台](https://console.cloud.tencent.com/cdn)
2. 点击「域名管理」>「添加域名」
3. 填写配置：
   - **加速域名**：`cutool.online`（或 `www.cutool.online`）
   - **加速区域**：选择「仅中国境内」或「全球」（根据需求）
   - **业务类型**：选择「静态网站」
   - **源站类型**：选择「自有源」
   - **源站地址**：填写 Vercel 的域名，例如：
     - `your-project.vercel.app`（Vercel 分配的域名）
     - 或者直接填写 `cutool.online`（如果已经在 Vercel 配置了自定义域名）

#### 2. 配置源站

- **源站类型**：自有源
- **源站地址**：`your-project.vercel.app`（替换为你的 Vercel 项目域名）
- **回源协议**：HTTPS
- **回源 Host**：`your-project.vercel.app`（与源站地址一致）

**⚠️ 注意**：如果 `your-project.vercel.app` 在国内无法访问，CDN 回源会失败。此时应该：
1. 将静态文件部署到国内云存储（腾讯云 COS 或阿里云 OSS）
2. CDN 源站选择云存储，而不是 Vercel
3. 参考 [国内部署方案](./DEPLOY_TO_CHINA.md)

#### 3. 配置缓存规则

在「缓存配置」中设置：

```
# 静态资源（长期缓存）
/static/* -> 缓存 1 年
/*.js -> 缓存 1 年
/*.css -> 缓存 1 年
/*.png -> 缓存 1 年
/*.jpg -> 缓存 1 年
/*.svg -> 缓存 1 年
/*.woff -> 缓存 1 年
/*.woff2 -> 缓存 1 年
/*.wasm -> 缓存 1 年

# HTML 文件（短期缓存）
/*.html -> 缓存 1 小时
/ -> 缓存 1 小时

# API 请求（不缓存）
/api/* -> 不缓存
```

#### 4. 配置 HTTPS

1. 在「HTTPS 配置」中开启 HTTPS
2. 上传 SSL 证书（可以使用腾讯云免费证书或 Let's Encrypt）
3. 开启「HTTP/2」和「强制跳转 HTTPS」

#### 5. 配置回源 Host

- **回源 Host**：设置为 Vercel 的源站域名（如 `your-project.vercel.app`）
- 这样可以确保 Vercel 正确识别请求

#### 6. 配置域名解析

在域名 DNS 解析处（如 DNSPod、阿里云 DNS 等）：

1. 添加 CNAME 记录：
   - **主机记录**：`@`（或 `www`）
   - **记录类型**：CNAME
   - **记录值**：腾讯云 CDN 提供的 CNAME 地址（如 `cutool.online.cdn.dnsv1.com`）
   - **TTL**：600

2. 等待 DNS 生效（通常几分钟到几小时）

### 注意事项

1. **域名备案**：如果使用国内 CDN，域名必须完成 ICP 备案
2. **回源流量**：CDN 回源到 Vercel 会产生流量费用
3. **缓存更新**：部署新版本后，可能需要手动刷新 CDN 缓存
4. **API 请求**：确保 API 请求（`/api/*`）不缓存，直接回源

---

## 方案二：阿里云 CDN

配置步骤与腾讯云类似：

1. 登录 [阿里云 CDN 控制台](https://cdn.console.aliyun.com/)
2. 添加加速域名
3. 配置源站为 Vercel 域名
4. 配置缓存规则
5. 配置 HTTPS
6. 修改 DNS 解析

---

## 方案三：使用海外 CDN（无需备案）

如果域名未备案，可以使用：

### Cloudflare（推荐，免费）

1. 注册 [Cloudflare](https://www.cloudflare.com/) 账号
2. 添加站点 `cutool.online`
3. 修改 DNS 解析到 Cloudflare 提供的 DNS 服务器
4. 配置：
   - **SSL/TLS**：设置为「Full」模式
   - **Always Use HTTPS**：开启
   - **Caching Level**：Standard
   - **Browser Cache TTL**：4 hours
5. 添加 Page Rule：
   - `cutool.online/*` -> Cache Level: Standard, Edge Cache TTL: 4 hours

**优点**：
- 免费
- 无需备案
- 全球加速
- 自动 HTTPS

**缺点**：
- 国内访问速度可能不如国内 CDN

---

## 方案四：国内服务器反向代理

如果已有国内服务器，可以搭建 Nginx 反向代理：

### Nginx 配置示例

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name cutool.online www.cutool.online;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 静态资源缓存
    location /static/ {
        proxy_pass https://your-project.vercel.app;
        proxy_set_header Host your-project.vercel.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 缓存配置
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # HTML 文件
    location ~ \.(html|htm)$ {
        proxy_pass https://your-project.vercel.app;
        proxy_set_header Host your-project.vercel.app;
        proxy_cache_valid 200 1h;
    }

    # API 请求不缓存（保留完整路径 /api/... 给后端，避免 404）
    location /api/ {
        proxy_pass https://api.cutool.online/api/;
        proxy_set_header Host api.cutool.online;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 不缓存 API
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # 其他请求
    location / {
        proxy_pass https://your-project.vercel.app;
        proxy_set_header Host your-project.vercel.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 方案五：迁移到国内静态托管

如果长期面向国内用户，可以考虑：

### 腾讯云静态网站托管 + CDN

1. 使用腾讯云 COS（对象存储）存储静态文件
2. 开启静态网站托管
3. 配置 CDN 加速
4. 使用 CI/CD 自动部署

### 阿里云 OSS + CDN

类似方案，使用阿里云 OSS 存储静态文件。

---

## 推荐方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 腾讯云 CDN | 国内速度快，配置简单 | 需要备案，有费用 | 已备案域名，主要面向国内用户 |
| 阿里云 CDN | 国内速度快，配置简单 | 需要备案，有费用 | 已备案域名，主要面向国内用户 |
| Cloudflare | 免费，无需备案，全球加速 | 国内速度一般 | 未备案域名，全球用户 |
| 自建反向代理 | 完全控制，灵活 | 需要服务器，维护成本 | 已有服务器资源 |
| 迁移到国内 | 国内访问最优 | 迁移成本高 | 长期面向国内用户 |

---

## 部署后验证

配置完成后，验证以下内容：

1. **访问测试**：
   ```bash
   curl -I https://cutool.online
   ```

2. **检查 CDN 是否生效**：
   - 查看响应头中的 `X-Cache` 或 `CF-Cache-Status`（Cloudflare）
   - 应该显示 `HIT` 表示命中缓存

3. **检查 HTTPS**：
   - 确保网站可以正常访问 HTTPS
   - 检查证书是否有效

4. **检查 API 请求**：
   - 确保 API 请求正常工作
   - 检查是否有跨域问题

---

## 常见问题

### Q: CDN 缓存导致更新不及时怎么办？

A: 
1. 在 CDN 控制台手动刷新缓存
2. 配置较短的 HTML 缓存时间
3. 使用版本号或 hash 的静态资源文件名（React 已自动处理）

### Q: API 请求被缓存了怎么办？

A: 
1. 确保 `/api/*` 路径配置为不缓存
2. 检查 API 响应头是否包含 `Cache-Control: no-cache`

### Q: 域名未备案怎么办？

A: 
1. 使用 Cloudflare 等海外 CDN
2. 或使用子域名（如 `cn.cutool.online`）单独备案

### Q: 如何同时支持国内外访问？

A: 
1. 使用 Cloudflare（全球加速）
2. 或配置智能 DNS，国内解析到国内 CDN，国外解析到 Vercel

---

## 故障排查指南

### 问题：配置 CDN 后无法访问

如果配置好腾讯云 CDN 后仍然无法访问，请按以下步骤排查：

#### 1. 检查 DNS 解析

**使用命令行检查：**
```bash
# 检查 DNS 解析是否正确
nslookup cutool.online
# 或
dig cutool.online

# 应该返回腾讯云 CDN 的 CNAME 地址
```

**检查要点：**
- ✅ DNS 记录类型应该是 `CNAME`，不是 `A` 记录
- ✅ 记录值应该是腾讯云提供的 CNAME（如 `cutool.online.cdn.dnsv1.com`）
- ✅ 如果显示的是 Vercel 的 IP，说明 DNS 还没切换到 CDN

**解决方法：**
- 在域名 DNS 管理后台，确保 `@` 和 `www` 都指向 CDN 的 CNAME
- 等待 DNS 生效（通常 5-30 分钟，最长 48 小时）

#### 2. 检查 CDN 域名状态

在腾讯云 CDN 控制台检查：

1. **域名状态**：应该是「已启动」，不是「已关闭」或「审核中」
2. **域名备案**：如果使用国内 CDN，必须显示「已备案」
3. **CNAME 配置**：记录下 CDN 提供的 CNAME 地址

#### 3. 检查源站配置（最重要）

**常见错误配置：**

❌ **错误 1：源站地址填了 `cutool.online`**
```
源站地址：cutool.online  ❌ 错误！
```
这会导致循环回源，因为 CDN 会尝试从自己回源。

✅ **正确配置：**
```
源站地址：your-project.vercel.app  ✅ 正确
```
必须填写 Vercel 分配的项目域名（不是自定义域名）。

**如何找到 Vercel 项目域名：**
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 在项目设置中查看，通常是：`项目名.vercel.app`
4. 或者查看部署历史，每个部署都有一个 `.vercel.app` 域名

#### 4. 检查回源 Host 配置

**回源 Host 必须与源站地址一致：**

```
源站地址：your-project.vercel.app
回源 Host：your-project.vercel.app  ✅ 必须一致
```

**如果回源 Host 配置错误：**
- Vercel 可能返回 404 或错误页面
- 因为 Vercel 需要根据 Host 头识别项目

#### 5. 检查回源协议

**必须使用 HTTPS：**
```
回源协议：HTTPS  ✅ 正确
回源协议：HTTP   ❌ 可能有问题（Vercel 推荐 HTTPS）
```

#### 6. 测试直接访问源站

**测试 Vercel 源站是否正常：**
```bash
# 替换为你的实际 Vercel 项目域名
curl -I https://your-project.vercel.app
```

**应该返回 200 状态码**，如果返回错误：
- 检查 Vercel 项目是否正常部署
- 检查 Vercel 项目域名是否正确

#### 7. 检查 HTTPS 证书

在腾讯云 CDN 控制台：

1. **HTTPS 配置**：必须已开启
2. **SSL 证书**：必须已上传并生效
3. **强制跳转 HTTPS**：建议开启

**如果没有证书：**
- 可以使用腾讯云免费 SSL 证书（申请需要时间）
- 或使用 Let's Encrypt 证书

#### 8. 检查 CDN 回源日志

在腾讯云 CDN 控制台：

1. 进入「统计分析」>「回源统计」
2. 查看是否有回源请求
3. 查看回源状态码：
   - `200`：正常
   - `404`：源站地址可能错误
   - `502/504`：源站无法访问或超时
   - `403`：可能是回源 Host 配置问题

#### 9. 使用 curl 测试

**测试 CDN 访问：**
```bash
# 测试 CDN 是否生效
curl -I https://cutool.online

# 检查响应头
# 应该看到腾讯云相关的响应头，如：
# X-Cache: HIT/MISS
# Server: Tengine
```

**测试回源：**
```bash
# 直接测试 Vercel 源站（替换为实际域名）
curl -I -H "Host: your-project.vercel.app" https://your-project.vercel.app
```

#### 10. 常见错误及解决方案

| 错误现象 | 可能原因 | 解决方法 |
|---------|---------|---------|
| DNS 解析失败 | DNS 未配置或未生效 | 检查 DNS 解析，等待生效 |
| 502 Bad Gateway | 源站无法访问 | 检查源站地址是否正确，测试直接访问源站 |
| 404 Not Found | 回源 Host 配置错误 | 确保回源 Host 与源站地址一致 |
| 403 Forbidden | 域名未备案或证书问题 | 检查备案状态，检查 HTTPS 配置 |
| 连接超时 | 源站地址错误或网络问题 | 检查源站地址，测试源站可访问性 |
| 循环重定向 | 源站填了 CDN 域名 | 源站必须填 Vercel 项目域名，不是自定义域名 |

#### 11. 完整检查清单

请逐一确认：

- [ ] DNS 解析已切换到 CDN CNAME（使用 `nslookup` 验证）
- [ ] CDN 域名状态为「已启动」
- [ ] 域名已备案（如果使用国内 CDN）
- [ ] 源站地址填写的是 Vercel 项目域名（`xxx.vercel.app`），不是 `cutool.online`
- [ ] 回源 Host 与源站地址完全一致
- [ ] 回源协议设置为 HTTPS
- [ ] HTTPS 证书已配置并生效
- [ ] 可以直接访问 Vercel 源站（`https://your-project.vercel.app`）
- [ ] CDN 回源日志显示正常（状态码 200）

#### 12. 快速诊断脚本

创建一个测试脚本帮助诊断：

```bash
#!/bin/bash
echo "=== CDN 配置诊断 ==="
echo ""

echo "1. 检查 DNS 解析："
nslookup cutool.online
echo ""

echo "2. 检查 CDN 访问："
curl -I https://cutool.online 2>&1 | head -20
echo ""

echo "3. 请手动测试 Vercel 源站（替换为实际域名）："
echo "   curl -I https://your-project.vercel.app"
echo ""

echo "4. 检查响应头中的 CDN 标识："
curl -sI https://cutool.online | grep -i "server\|x-cache\|cdn"
```

#### 13. 如果仍然无法解决

**临时方案：**
1. 暂时将 DNS 切回 Vercel，确保网站可访问
2. 检查 Vercel 项目设置中的自定义域名配置
3. 确认 Vercel 项目是否正常运行

**联系支持：**
- 腾讯云 CDN 技术支持
- 检查腾讯云 CDN 控制台的「诊断工具」

**替代方案：**
- 如果问题持续，可以考虑使用 Cloudflare（无需备案，配置更简单）

---

## 相关资源

- [腾讯云 CDN 文档](https://cloud.tencent.com/document/product/228)
- [阿里云 CDN 文档](https://help.aliyun.com/product/27099.html)
- [Cloudflare 文档](https://developers.cloudflare.com/)
- [Vercel 文档](https://vercel.com/docs)

