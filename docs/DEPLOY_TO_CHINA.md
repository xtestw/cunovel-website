# 国内部署方案 - 解决 Vercel 无法访问问题

由于 `cutool.vercel.app` 在国内无法访问，CDN 回源也会失败。本指南提供将网站部署到国内云服务的完整方案。

## 方案一：腾讯云 COS + CDN（推荐）

### 优势
- ✅ 国内访问速度快
- ✅ 成本低（COS 存储 + CDN 流量）
- ✅ 配置简单
- ✅ 支持自动部署

### 前置准备

1. **腾讯云账号**
   - 注册并实名认证
   - 开通 COS（对象存储）服务
   - 开通 CDN 服务

2. **域名备案**
   - 确保 `cutool.online` 已备案

### 步骤 1：创建 COS 存储桶

1. 登录 [腾讯云 COS 控制台](https://console.cloud.tencent.com/cos)
2. 点击「创建存储桶」
3. 配置：
   - **名称**：`cutool-web`（自定义）
   - **所属地域**：选择离用户最近的地域（如：北京、上海）
   - **访问权限**：**公有读私有写**（重要！）
   - **存储类型**：标准存储
   - **版本控制**：关闭（可选）
4. 点击「创建」

### 步骤 2：开启静态网站托管

1. 进入存储桶，点击「基础配置」
2. 找到「静态网站」功能，点击「编辑」
3. 开启静态网站托管：
   - **索引文档**：`index.html`
   - **错误文档**：`index.html`（用于 SPA 路由）
   - **错误码**：`404`
   - **重定向规则**：可以留空
4. 保存配置

### 步骤 3：配置 CDN

1. 登录 [腾讯云 CDN 控制台](https://console.cloud.tencent.com/cdn)
2. 添加加速域名：
   - **加速域名**：`cutool.online`
   - **加速区域**：仅中国境内
   - **业务类型**：静态网站
   - **源站类型**：COS 源
   - **源站地址**：选择刚创建的存储桶（如 `cutool-1254002056.cos.ap-guangzhou.myqcloud.com`）
   - **回源协议**：HTTPS
3. 配置 HTTPS 证书
4. 配置缓存规则（参考下面的缓存配置）

### 步骤 4：配置缓存规则

在 CDN 控制台的「缓存配置」中设置：

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
/*.ico -> 缓存 1 年

# HTML 文件（短期缓存）
/*.html -> 缓存 1 小时
/ -> 缓存 1 小时

# 其他文件
/*.json -> 缓存 1 小时
/*.xml -> 缓存 1 小时
/*.txt -> 缓存 1 小时
```

### 步骤 5：配置域名解析

在域名 DNS 解析处：

1. 添加 CNAME 记录：
   - **主机记录**：`@`
   - **记录类型**：CNAME
   - **记录值**：腾讯云 CDN 提供的 CNAME 地址
   - **TTL**：600

2. 如果需要 `www` 子域名，同样配置 CNAME

### 步骤 6：手动部署（首次测试）

1. **构建项目**：
   ```bash
   npm install
   npm run build
   ```

2. **上传到 COS**：
   
   方法一：使用控制台上传
   - 进入 COS 控制台
   - 选择存储桶
   - 点击「上传文件」
   - 选择 `build` 目录下的所有文件
   - **重要**：上传时选择「上传到当前目录」，不要创建子目录

   方法二：使用命令行工具（推荐）
   ```bash
   # 安装 COS CLI
   pip install coscmd
   
   # 配置（需要 SecretId 和 SecretKey）
   coscmd config -a <SecretId> -s <SecretKey> -b <BucketName> -r <Region>
   
   # 上传 build 目录
   cd build
   coscmd upload -rs ./ /
   ```

### 步骤 7：配置自动部署（GitHub Actions）

创建 `.github/workflows/deploy-cos.yml`：

```yaml
name: Deploy to Tencent Cloud COS

on:
  push:
    branches:
      - main  # 或你的主分支名
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build project
      run: npm run build
      env:
        CI: false
        
    - name: Configure COS CLI
      run: |
        pip install coscmd
        coscmd config -a ${{ secrets.TENCENT_SECRET_ID }} -s ${{ secrets.TENCENT_SECRET_KEY }} -b ${{ secrets.COS_BUCKET_NAME }} -r ${{ secrets.COS_REGION }}
        
    - name: Upload to COS
      run: |
        cd build
        coscmd upload -rs ./ /
        
    - name: Purge CDN Cache
      run: |
        # 刷新 CDN 缓存（需要安装腾讯云 CLI）
        # 或者使用 API 调用
        echo "部署完成，请手动刷新 CDN 缓存"
```

**配置 GitHub Secrets**：

> 📖 **详细配置步骤请参考：[GitHub Secrets 配置快速指南](./GITHUB_SECRETS_SETUP.md)**

#### 步骤 1：获取腾讯云 API 密钥

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 点击右上角头像，选择「访问管理」
3. 进入「API密钥管理」>「API密钥」
4. 如果没有密钥，点击「新建密钥」
5. 复制并保存：
   - **SecretId**：类似 `YOUR_SECRET_ID_HERE`（实际格式：AKID 开头，36 位字符）
   - **SecretKey**：类似 `YOUR_SECRET_KEY_HERE`（实际格式：32 位字符，只显示一次，请妥善保存）

⚠️ **安全提示**：
- SecretKey 只显示一次，请立即保存
- 不要将密钥提交到代码仓库
- 建议创建子账号并授予最小权限（只授予 COS 相关权限）

#### 步骤 2：获取 COS 存储桶信息

1. 登录 [腾讯云 COS 控制台](https://console.cloud.tencent.com/cos)
2. 找到你创建的存储桶
3. 查看存储桶信息：
   - **存储桶名称**：例如 `cutool-1254002056`（完整名称，包含数字后缀）
   - **所属地域**：例如 `广州`、`北京`、`上海` 等

4. 将地域转换为代码格式：
   - `广州` → `ap-guangzhou`（当前使用）
   - `北京` → `ap-beijing`
   - `上海` → `ap-shanghai`
   - `成都` → `ap-chengdu`
   - `重庆` → `ap-chongqing`
   - 更多地域代码：[查看文档](https://cloud.tencent.com/document/product/436/6224)

#### 步骤 3：在 GitHub 仓库中配置 Secrets

1. **进入 GitHub 仓库**
   - 打开你的 GitHub 仓库页面
   - 例如：`https://github.com/your-username/cutool-web`

2. **进入 Settings（设置）**
   - 点击仓库顶部的「Settings」标签
   - 如果没有看到 Settings，说明你没有管理员权限，需要联系仓库所有者

3. **找到 Secrets 配置**
   - 在左侧菜单中找到「Secrets and variables」
   - 点击「Actions」
   - 点击「New repository secret」按钮

4. **添加每个 Secret**

   依次添加以下 4 个 Secrets：

   **Secret 1: TENCENT_SECRET_ID**
   - Name: `TENCENT_SECRET_ID`
   - Secret: 粘贴你的腾讯云 SecretId（格式：AKID 开头，36 位字符）
   - 点击「Add secret」

   **Secret 2: TENCENT_SECRET_KEY**
   - Name: `TENCENT_SECRET_KEY`
   - Secret: 粘贴你的腾讯云 SecretKey（格式：32 位字符）
   - 点击「Add secret」

   **Secret 3: COS_BUCKET_NAME**
   - Name: `COS_BUCKET_NAME`
   - Secret: 粘贴你的 COS 存储桶完整名称（例如：`cutool-1254002056`）
   - ⚠️ 注意：不要包含 `cos.` 前缀或 `.myqcloud.com` 后缀，只要存储桶名称本身
   - 点击「Add secret」

   **Secret 4: COS_REGION**
   - Name: `COS_REGION`
   - Secret: 粘贴地域代码（例如：`ap-guangzhou`）
   - 点击「Add secret」

5. **验证配置**
   - 配置完成后，你应该看到 4 个 Secrets 在列表中
   - 每个 Secret 的名称旁边会显示「Updated X days ago」

#### 配置示例

假设你的信息如下：
- SecretId: `YOUR_ACTUAL_SECRET_ID`（从腾讯云控制台获取，AKID 开头）
- SecretKey: `YOUR_ACTUAL_SECRET_KEY`（从腾讯云控制台获取，32 位字符）
- 存储桶名称: `cutool-1254002056`
- 地域: `广州`

那么配置应该是：
```
TENCENT_SECRET_ID = YOUR_ACTUAL_SECRET_ID
TENCENT_SECRET_KEY = YOUR_ACTUAL_SECRET_KEY
COS_BUCKET_NAME = cutool-1254002056
COS_REGION = ap-guangzhou
```

⚠️ **注意**：请将 `YOUR_ACTUAL_SECRET_ID` 和 `YOUR_ACTUAL_SECRET_KEY` 替换为你从腾讯云控制台获取的真实密钥。

#### 测试配置

配置完成后，可以测试 GitHub Actions：

1. **手动触发工作流**：
   - 进入仓库的「Actions」标签
   - 选择「Deploy to Tencent Cloud COS」工作流
   - 点击「Run workflow」>「Run workflow」

2. **或推送代码到 main 分支**：
   ```bash
   git add .
   git commit -m "test: trigger deployment"
   git push origin main
   ```

3. **查看执行日志**：
   - 在 Actions 页面查看工作流执行情况
   - 如果配置正确，应该能看到「✅ 部署完成！」的消息

#### 常见问题

**Q: 找不到 Settings 选项？**
A: 确保你有仓库的管理员权限。如果没有，请联系仓库所有者添加你为协作者并授予管理员权限。

**Q: SecretKey 忘记了怎么办？**
A: 在腾讯云控制台的「API密钥管理」中，可以禁用旧密钥并创建新密钥。

**Q: 如何验证 Secrets 是否正确？**
A: 运行 GitHub Actions 工作流，查看日志。如果配置错误，会在「Configure COS CLI」步骤报错。

**Q: 存储桶名称格式是什么？**
A: 存储桶名称通常是 `名称-数字` 的格式，例如 `cutool-1254002056`。在 COS 控制台的存储桶列表中可以看到完整名称。

**Q: 地域代码在哪里找？**
A: 在 COS 控制台的存储桶列表中，可以看到地域名称。然后参考[腾讯云地域列表](https://cloud.tencent.com/document/product/436/6224)转换为代码格式。

### 步骤 8：配置 SPA 路由支持

由于是 React SPA，需要配置 CDN 的「回源跟随 3xx」和「错误页面重定向」：

1. 在 CDN 控制台，进入「回源配置」
2. 开启「回源跟随 3xx」
3. 在「高级配置」>「错误页面」中：
   - 添加规则：404 -> `/index.html`，状态码 200

或者使用 COS 的静态网站配置（已在步骤 2 配置）。

---

## 方案二：阿里云 OSS + CDN

配置步骤类似腾讯云：

### 1. 创建 OSS Bucket

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 创建 Bucket：
   - **Bucket 名称**：`cutool-web`
   - **地域**：选择合适的地域
   - **读写权限**：**公共读**（重要！）
   - **服务器端加密**：关闭（可选）

### 2. 开启静态网站托管

1. 进入 Bucket，点击「基础设置」
2. 找到「静态网站托管」，点击「设置」
3. 开启并配置：
   - **默认首页**：`index.html`
   - **默认 404 页**：`index.html`
   - **子目录首页**：`index.html`

### 3. 配置 CDN

1. 登录 [阿里云 CDN 控制台](https://cdn.console.aliyun.com/)
2. 添加加速域名，源站选择 OSS

### 4. 自动部署脚本

创建 `.github/workflows/deploy-oss.yml`：

```yaml
name: Deploy to Aliyun OSS

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build project
      run: npm run build
      env:
        CI: false
        
    - name: Upload to OSS
      uses: manyuanrong/setup-ossutil@v2.0
      with:
        endpoint: ${{ secrets.OSS_ENDPOINT }}
        access-key-id: ${{ secrets.OSS_ACCESS_KEY_ID }}
        access-key-secret: ${{ secrets.OSS_ACCESS_KEY_SECRET }}
        
    - name: Sync files
      run: |
        ossutil cp -r build/ oss://${{ secrets.OSS_BUCKET_NAME }}/
```

---

## 方案三：使用国内服务器做反向代理

如果你已有国内服务器，可以搭建 Nginx 反向代理，通过服务器去拉取 Vercel 的内容。

### Nginx 配置

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name cutool.online www.cutool.online;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 启用缓存
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cutool_cache:10m max_size=1g inactive=60m use_temp_path=off;

    # 静态资源缓存
    location /static/ {
        proxy_cache cutool_cache;
        proxy_cache_valid 200 1y;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        
        proxy_pass https://cutool.vercel.app;
        proxy_set_header Host cutool.vercel.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Cache-Status $upstream_cache_status;
    }

    # HTML 文件
    location ~ \.(html|htm)$ {
        proxy_cache cutool_cache;
        proxy_cache_valid 200 1h;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        
        proxy_pass https://cutool.vercel.app;
        proxy_set_header Host cutool.vercel.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header X-Cache-Status $upstream_cache_status;
    }

    # API 请求（不缓存，直接转发到后端）
    location /api/ {
        proxy_pass https://api.cutool.online;
        proxy_set_header Host api.cutool.online;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA 路由支持
    location / {
        proxy_cache cutool_cache;
        proxy_cache_valid 200 1h;
        
        proxy_pass https://cutool.vercel.app;
        proxy_set_header Host cutool.vercel.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 如果 Vercel 返回 404，返回 index.html
        proxy_intercept_errors on;
        error_page 404 = @fallback;
    }

    location @fallback {
        proxy_pass https://cutool.vercel.app/;
        proxy_set_header Host cutool.vercel.app;
    }
}
```

**注意**：这个方案需要服务器能够访问 Vercel（可能需要代理）。

---

## 方案对比

| 方案 | 优点 | 缺点 | 成本 | 推荐度 |
|------|------|------|------|--------|
| 腾讯云 COS + CDN | 国内速度快，配置简单，支持自动部署 | 需要备案 | 低（存储 + 流量） | ⭐⭐⭐⭐⭐ |
| 阿里云 OSS + CDN | 国内速度快，配置简单 | 需要备案 | 低（存储 + 流量） | ⭐⭐⭐⭐⭐ |
| 服务器反向代理 | 灵活，可控制 | 需要服务器，维护成本高 | 中（服务器费用） | ⭐⭐⭐ |

---

## 推荐方案：腾讯云 COS + CDN

### 快速开始

1. **创建 COS 存储桶并开启静态网站托管**
2. **配置 CDN，源站选择 COS**
3. **首次手动上传 build 目录到 COS**
4. **配置 GitHub Actions 自动部署**
5. **修改 DNS 解析到 CDN**

### 成本估算

- **COS 存储**：约 0.118 元/GB/月（标准存储）
- **COS 流量**：约 0.5 元/GB（外网下行流量）
- **CDN 流量**：约 0.21-0.24 元/GB（国内流量）
- **总成本**：对于中小型网站，每月约 10-50 元

---

## 常见问题

### Q: 访问网站出现 AccessDenied 或 403 错误？

A: 
这是最常见的配置问题，通常是因为存储桶权限配置不正确或 CDN 访问控制配置问题。

**快速修复**：
1. **检查 COS 权限**：
   - 进入 COS 控制台 > 存储桶 > 「权限管理」
   - 将「存储桶访问权限」修改为「公有读私有写」
   - 确保「静态网站托管」已开启

2. **检查 CDN 配置**：
   - 进入 CDN 控制台 > 「访问控制」
   - 检查 IP 黑白名单、Referer 防盗链等是否阻止了访问
   - 确保 CDN 域名状态为「已启动」

**详细排查步骤请参考**：[COS AccessDenied 错误修复指南](./COS_ACCESS_DENIED_FIX.md)

### Q: 部署后页面空白？

A: 
1. 检查 COS 的静态网站托管是否开启
2. 检查文件是否正确上传到根目录
3. 检查 CDN 的 SPA 路由配置（404 重定向到 index.html）

### Q: 如何更新网站？

A: 
1. 使用 GitHub Actions 自动部署（推荐）
2. 或手动上传新的 build 目录到 COS
3. 刷新 CDN 缓存

### Q: API 请求如何处理？

A: 
- API 请求（`/api/*`）应该直接指向后端服务器（`api.cutool.online`）
- 在 CDN 中配置 `/api/*` 不缓存，或使用单独的域名

### Q: 如何同时保留 Vercel 部署？

A: 
- 可以同时部署到 Vercel 和国内云存储
- 使用不同的域名或子域名
- 例如：`cutool.online` 指向国内，`www.cutool.online` 指向 Vercel

---

## 下一步

1. 选择方案（推荐腾讯云 COS + CDN）
2. 按照步骤配置
3. 测试部署
4. 配置自动部署
5. 切换 DNS 解析

如有问题，请查看各云服务商的官方文档。

