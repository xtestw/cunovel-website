# COS AccessDenied 错误修复指南

## 错误信息

访问网站时出现以下错误：

```xml
<?xml version='1.0' encoding='utf-8' ?>
<Error>
    <Code>AccessDenied</Code>
    <Message>Access Denied.</Message>
</Error>
```

## 问题原因

这个错误通常是因为 COS 存储桶的访问权限配置不正确。

## 解决方案

### ✅ 步骤 1：检查存储桶访问权限

1. 登录 [腾讯云 COS 控制台](https://console.cloud.tencent.com/cos)
2. 找到你的存储桶，点击进入
3. 点击「权限管理」标签
4. 检查「存储桶访问权限」：

   **必须设置为：公有读私有写**

   - ✅ **公有读私有写**：允许所有人读取，只有授权用户可以写入
   - ❌ **私有读写**：只有授权用户可以访问（会导致 AccessDenied）
   - ❌ **公有读写**：不推荐，安全风险高

5. 如果权限不对，点击「编辑」，修改为「公有读私有写」，保存

### ✅ 步骤 2：检查静态网站托管是否开启

1. 在存储桶中，点击「基础配置」标签
2. 找到「静态网站」功能
3. 确认已开启静态网站托管：
   - **索引文档**：`index.html`
   - **错误文档**：`index.html`
   - **错误码**：`404`

4. 如果没有开启，点击「编辑」开启并保存

### ✅ 步骤 3：检查文件是否已上传

1. 在存储桶中，点击「文件列表」
2. 检查根目录下是否有文件：
   - 应该有 `index.html`
   - 应该有 `static/` 目录
   - 应该有其他构建产物

3. 如果文件列表为空，需要上传文件：
   ```bash
   # 构建项目
   npm run build
   
   # 上传到 COS（需要先配置 coscmd）
   cd build
   coscmd upload -rs ./ /
   ```

### ✅ 步骤 4：检查 CDN 源站配置

1. 登录 [腾讯云 CDN 控制台](https://console.cloud.tencent.com/cdn)
2. 找到你的加速域名，点击「管理」
3. 进入「基础配置」>「源站信息」
4. 检查源站配置：
   - **源站类型**：应该是「COS 源」
   - **源站地址**：应该是你的存储桶地址（如 `cutool-1254002056.cos.ap-guangzhou.myqcloud.com`）
   - **回源协议**：HTTPS 或 HTTP

5. 如果配置不对，修改并保存

### ✅ 步骤 5：检查 CDN 回源 Host 配置

1. 在 CDN 控制台，进入「回源配置」
2. 检查「回源 Host」配置：
   - 如果源站是 COS，回源 Host 应该设置为存储桶的完整域名
   - 例如：`cutool-1254002056.cos.ap-guangzhou.myqcloud.com`

### ✅ 步骤 6：测试直接访问 COS

在浏览器中直接访问存储桶的静态网站地址：

```
https://cutool-1254002056.cos.ap-guangzhou.myqcloud.com
```

或者使用静态网站地址：

```
https://cutool-1254002056.cos-website.ap-guangzhou.myqcloud.com
```

**如果直接访问 COS 也出现 AccessDenied：**
- 说明是存储桶权限问题，按照步骤 1 修复

**如果直接访问 COS 正常，但通过 CDN 访问出错：**
- 说明是 CDN 配置问题，按照步骤 4-5 修复

## 快速检查清单

请逐一确认：

- [ ] 存储桶访问权限设置为「公有读私有写」
- [ ] 静态网站托管已开启
- [ ] 索引文档设置为 `index.html`
- [ ] 错误文档设置为 `index.html`
- [ ] 文件已上传到存储桶根目录
- [ ] CDN 源站类型为「COS 源」
- [ ] CDN 源站地址正确
- [ ] 可以直接访问 COS 静态网站地址

## 详细配置步骤

### 配置存储桶权限（最重要！）

1. **进入存储桶权限管理**
   - COS 控制台 > 选择存储桶 > 「权限管理」

2. **修改存储桶访问权限**
   - 点击「存储桶访问权限」右侧的「编辑」
   - 选择「公有读私有写」
   - 点击「保存」

3. **配置存储桶策略（可选，更精细控制）**
   - 在「存储桶策略」中，可以添加更详细的访问规则
   - 对于简单的静态网站，使用「公有读私有写」即可

### 配置静态网站托管

1. **进入基础配置**
   - 存储桶 > 「基础配置」> 「静态网站」

2. **开启静态网站托管**
   - 点击「编辑」
   - 开启「静态网站」
   - 配置：
     ```
     索引文档：index.html
     错误文档：index.html
     错误码：404
     ```
   - 点击「保存」

3. **获取静态网站地址**
   - 保存后，会显示静态网站访问地址
   - 格式：`https://存储桶名.cos-website.地域.myqcloud.com`

### 验证配置

1. **测试 COS 直接访问**
   ```bash
   curl https://你的存储桶名.cos-website.地域.myqcloud.com
   ```
   应该返回 HTML 内容，而不是 XML 错误

2. **测试 CDN 访问**
   ```bash
   curl https://cutool.online
   ```
   应该返回 HTML 内容

## 常见错误配置

### ❌ 错误 1：存储桶权限为私有读写

**现象**：访问时出现 AccessDenied

**解决**：修改为「公有读私有写」

### ❌ 错误 2：CDN 源站类型选择错误

**现象**：CDN 回源失败

**解决**：
- 源站类型必须选择「COS 源」
- 不要选择「自有源」然后填写 COS 地址

### ❌ 错误 3：文件上传到子目录

**现象**：访问根路径 404，访问子路径正常

**解决**：
- 确保文件上传到存储桶根目录（`/`）
- 不要上传到 `/build/` 或其他子目录

### ❌ 错误 4：静态网站托管未开启

**现象**：访问时出现 AccessDenied 或 404

**解决**：在「基础配置」中开启静态网站托管

## 如果问题仍然存在

1. **清除浏览器缓存**：Ctrl+F5 强制刷新
2. **清除 CDN 缓存**：在 CDN 控制台手动刷新缓存
3. **检查域名解析**：确保 DNS 正确解析到 CDN
4. **等待配置生效**：某些配置可能需要几分钟生效

## 问题：浏览器下载 index.html 而不是显示网页

### 问题现象

访问 COS 静态网站地址时，浏览器直接下载 `index.html` 文件，而不是显示网页内容。

### 问题原因

这是因为 HTML 文件的 `Content-Type` 没有正确设置。COS 默认可能将 HTML 文件识别为 `application/octet-stream`（二进制文件），导致浏览器下载而不是显示。

### 解决方案

#### 方案 1：重新上传文件并设置 Content-Type（推荐）

使用更新后的部署脚本，会自动设置正确的 Content-Type：

```bash
# 使用更新后的脚本
./scripts/deploy-to-cos.sh
```

或者手动使用 coscmd 上传并设置 Content-Type：

```bash
cd build
# 上传 index.html 并设置 Content-Type
coscmd upload index.html /index.html --header "Content-Type:text/html; charset=utf-8"

# 上传其他 HTML 文件
find . -name "*.html" -type f | while read file; do
    rel_path="${file#./}"
    coscmd upload "$file" "/$rel_path" --header "Content-Type:text/html; charset=utf-8"
done

# 上传其他文件
coscmd upload -rs ./ / --skipmd5
```

#### 方案 2：在 COS 控制台手动设置元数据

1. 进入 COS 控制台 > 存储桶 > 「文件列表」
2. 找到 `index.html` 文件
3. 点击文件右侧的「详情」
4. 在「元数据」中，点击「编辑」
5. 添加或修改：
   - **Content-Type**：`text/html; charset=utf-8`
6. 保存

#### 方案 3：使用 COS 控制台批量设置

1. 进入 COS 控制台 > 存储桶 > 「文件列表」
2. 选择所有 HTML 文件
3. 点击「更多操作」>「修改元数据」
4. 设置 Content-Type 为：`text/html; charset=utf-8`
5. 保存

### 验证修复

修复后，访问静态网站地址：
```
https://cutool-1254002056.cos-website.ap-guangzhou.myqcloud.com
```

应该显示网页内容，而不是下载文件。

### 预防措施

确保部署脚本正确设置 Content-Type：
- 使用更新后的 `scripts/deploy-to-cos.sh` 脚本
- 或使用 GitHub Actions 自动部署（已更新）

---

## 问题：访问 CDN 域名出现 403 Forbidden

### 问题现象

访问 `https://cutool.online/` 时出现 403 Forbidden 错误。

### 可能原因

403 错误通常是由以下原因引起的：

1. **CDN 访问控制规则**：CDN 配置了 IP 白名单、Referer 防盗链等访问控制
2. **CDN 域名未通过审核**：新添加的 CDN 域名可能还在审核中
3. **CDN 回源配置错误**：回源到 COS 时权限不足
4. **COS 存储桶权限问题**：虽然设置了公有读，但 CDN 回源时可能有问题

### 解决方案

#### ✅ 步骤 1：检查 CDN 域名状态

1. 登录 [腾讯云 CDN 控制台](https://console.cloud.tencent.com/cdn)
2. 找到加速域名 `cutool.online`
3. 检查域名状态：
   - **已启动**：正常
   - **审核中**：需要等待审核通过（通常几分钟到几小时）
   - **已关闭**：需要启动域名
   - **已下线**：需要重新配置

4. 如果状态不是「已启动」，等待审核或手动启动

#### ✅ 步骤 2：检查 CDN 访问控制

1. 在 CDN 控制台，进入「访问控制」
2. 检查以下配置：

   **IP 访问限频配置**：
   - 如果开启了 IP 访问限频，可能导致正常访问被限制
   - 建议：关闭或调整限频规则

   **Referer 防盗链**：
   - 如果开启了 Referer 防盗链，需要添加允许的域名
   - 建议：暂时关闭测试，或添加 `*` 允许所有来源

   **IP 黑白名单**：
   - 如果配置了 IP 黑名单，你的 IP 可能被阻止
   - 建议：检查并移除你的 IP，或暂时关闭

   **地区访问限制**：
   - 如果配置了地区限制，某些地区可能无法访问
   - 建议：暂时关闭测试

#### ✅ 步骤 3：检查 CDN 回源配置

1. 进入「回源配置」
2. 检查「回源 Host」：
   - 应该设置为：`cutool-1254002056.cos.ap-guangzhou.myqcloud.com`
   - 不要设置为 `cutool.online`（会导致循环）

3. 检查「回源协议」：
   - 建议使用 HTTPS
   - 如果 COS 不支持 HTTPS，可以尝试 HTTP

#### ✅ 步骤 4：检查 COS 存储桶权限

1. 登录 [腾讯云 COS 控制台](https://console.cloud.tencent.com/cos)
2. 进入存储桶 `cutool-1254002056`
3. 检查「权限管理」：
   - **存储桶访问权限**：必须是「公有读私有写」
   - 如果不对，修改并保存

4. 检查「存储桶策略」：
   - 如果有自定义策略，确保允许 CDN 回源访问

#### ✅ 步骤 5：测试直接访问 COS

测试直接访问 COS 静态网站地址：

```bash
curl -I https://cutool-1254002056.cos-website.ap-guangzhou.myqcloud.com
```

**如果直接访问 COS 正常（返回 200）：**
- 说明 COS 配置正确，问题在 CDN 配置
- 按照步骤 1-3 检查 CDN 配置

**如果直接访问 COS 也返回 403：**
- 说明是 COS 权限问题
- 按照步骤 4 修复 COS 权限

#### ✅ 步骤 6：检查 CDN 缓存

1. 在 CDN 控制台，进入「缓存配置」
2. 点击「缓存刷新」
3. 添加刷新任务：
   - 刷新类型：目录刷新
   - 刷新目录：`/`
4. 提交刷新任务

#### ✅ 步骤 7：检查域名解析

```bash
# 检查 DNS 解析
nslookup cutool.online
```

确保解析到 CDN 的 CNAME 地址，而不是直接解析到 COS。

### 快速修复清单

按顺序检查：

- [ ] CDN 域名状态为「已启动」
- [ ] CDN 访问控制中，IP 黑白名单、Referer 防盗链等都已关闭或正确配置
- [ ] CDN 回源 Host 设置为 COS 存储桶地址
- [ ] COS 存储桶权限为「公有读私有写」
- [ ] 可以直接访问 COS 静态网站地址（返回 200）
- [ ] DNS 解析正确指向 CDN
- [ ] 已清除 CDN 缓存

### 常见错误配置

#### ❌ 错误 1：CDN 开启了 Referer 防盗链但未配置允许的域名

**现象**：访问返回 403

**解决**：
1. 进入 CDN 控制台 > 「访问控制」> 「Referer 防盗链」
2. 暂时关闭，或添加允许的 Referer（如 `*` 允许所有）

#### ❌ 错误 2：CDN 域名还在审核中

**现象**：新添加的域名返回 403

**解决**：等待审核通过（通常几分钟到几小时）

#### ❌ 错误 3：CDN 回源 Host 配置错误

**现象**：CDN 回源失败，返回 403

**解决**：
- 回源 Host 必须设置为 COS 存储桶地址
- 不要设置为 CDN 域名本身

### 调试命令

```bash
# 测试直接访问 COS
curl -I https://cutool-1254002056.cos-website.ap-guangzhou.myqcloud.com

# 测试 CDN 访问
curl -I https://cutool.online

# 检查响应头
curl -v https://cutool.online 2>&1 | grep -i "403\|forbidden\|x-cache"
```

---

## 问题：根路径 `/` 返回 403，但其他文件可以访问

### 问题现象

- ✅ `https://cutool.online/ads.txt` 可以访问
- ✅ `https://cutool-1254002056.cos.ap-guangzhou.myqcloud.com/index.html` 可以访问
- ❌ `https://cutool.online/` 返回 403

### 问题原因

这是 CDN 对根路径 `/` 的处理问题。当 CDN 回源到 COS 时，访问根路径 `/` 需要被重定向到 `/index.html`，但 CDN 可能没有正确配置这个规则。

### 解决方案

#### ✅ 方案 1：配置 CDN 默认首页（推荐）

1. 登录 [腾讯云 CDN 控制台](https://console.cloud.tencent.com/cdn)
2. 找到加速域名 `cutool.online`，点击「管理」
3. 进入「回源配置」
4. 找到「回源跟随 3xx」配置：
   - 开启「回源跟随 3xx」
   - 保存

5. 进入「高级配置」>「回源 URL 重写」
6. 添加规则：
   - **匹配模式**：`/`
   - **目标 URL**：`/index.html`
   - **保留查询字符串**：开启
   - 保存

#### ✅ 方案 2：配置 CDN 错误页面重定向

1. 在 CDN 控制台，进入「高级配置」>「错误页面」
2. 添加规则：
   - **错误码**：`403`
   - **重定向到**：`/index.html`
   - **状态码**：`200`（重要！）
   - 保存

#### ✅ 方案 3：使用 COS 静态网站地址作为源站

如果 CDN 源站配置使用的是普通 COS 地址，可以改为使用静态网站地址：

1. 进入「基础配置」>「源站信息」
2. 修改源站地址：
   - **原地址**：`cutool-1254002056.cos.ap-guangzhou.myqcloud.com`
   - **新地址**：`cutool-1254002056.cos-website.ap-guangzhou.myqcloud.com`
   - 保存

这样 CDN 会使用 COS 的静态网站功能，自动处理根路径到 index.html 的重定向。

#### ✅ 方案 4：配置 CDN URL 重写规则

1. 进入「高级配置」>「URL 重写」
2. 添加规则：
   - **匹配模式**：`^/$`
   - **目标 URL**：`/index.html`
   - **保留查询字符串**：开启
   - 保存

### 验证修复

修复后，测试访问：

```bash
# 测试根路径
curl -I https://cutool.online/

# 应该返回 200 或 301/302 重定向到 /index.html
```

### 推荐配置

**最佳实践**：
1. 使用 COS 静态网站地址作为 CDN 源站（方案 3）
2. 或配置 CDN 的 URL 重写规则（方案 4）
3. 同时配置错误页面重定向（方案 2）作为备用

这样可以确保：
- 根路径 `/` 正确访问到 `index.html`
- SPA 路由正常工作
- 404 错误也能正确重定向到 `index.html`

---

## 联系支持

如果以上步骤都无法解决问题：

1. 查看 [腾讯云 COS 文档](https://cloud.tencent.com/document/product/436)
2. 查看 [腾讯云 CDN 文档](https://cloud.tencent.com/document/product/228)
3. 提交工单：腾讯云控制台 > 工单 > 提交工单
4. 检查 COS 控制台的「监控报表」，查看访问日志
5. 检查 CDN 控制台的「统计分析」，查看回源状态码

