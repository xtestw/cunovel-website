# GitHub Secrets 配置快速指南

## 📋 配置清单

在开始之前，请准备好以下信息：

- [ ] 腾讯云 SecretId
- [ ] 腾讯云 SecretKey
- [ ] COS 存储桶名称
- [ ] COS 地域代码

---

## 🔑 步骤 1：获取腾讯云 API 密钥

### 方法一：使用主账号密钥（简单但不推荐）

1. 访问：https://console.cloud.tencent.com/cam/capi
2. 如果没有密钥，点击「新建密钥」
3. 复制 **SecretId** 和 **SecretKey**（SecretKey 只显示一次！）

### 方法二：创建子账号（推荐，更安全）

1. 访问：https://console.cloud.tencent.com/cam
2. 创建子账号，授予以下权限：
   - `QcloudCOSDataFullControl`（COS 完全控制）
   - 或更细粒度的权限：`QcloudCOSPutObject`、`QcloudCOSGetObject` 等
3. 为子账号创建 API 密钥
4. 使用子账号的 SecretId 和 SecretKey

---

## 🪣 步骤 2：获取 COS 存储桶信息

1. 访问：https://console.cloud.tencent.com/cos
2. 找到你的存储桶，查看信息：

**存储桶名称示例：**
```
cutool-1254002056
```
⚠️ 注意：只要名称本身，不要包含 `cos.` 或 `.myqcloud.com`

**地域代码对照表：**

| 地域名称 | 地域代码 |
|---------|---------|
| 广州 | `ap-guangzhou`（当前使用） |
| 北京 | `ap-beijing` |
| 上海 | `ap-shanghai` |
| 成都 | `ap-chengdu` |
| 重庆 | `ap-chongqing` |
| 南京 | `ap-nanjing` |
| 深圳 | `ap-shenzhen-fsi` |
| 香港 | `ap-hongkong` |

更多地域：[查看完整列表](https://cloud.tencent.com/document/product/436/6224)

---

## ⚙️ 步骤 3：在 GitHub 配置 Secrets

### 3.1 进入仓库设置

1. 打开你的 GitHub 仓库
2. 点击顶部的 **Settings** 标签
3. 如果没有看到 Settings，说明没有管理员权限

### 3.2 找到 Secrets 配置

1. 在左侧菜单找到 **Secrets and variables**
2. 点击 **Actions**
3. 点击 **New repository secret** 按钮

### 3.3 添加 4 个 Secrets

#### Secret 1: TENCENT_SECRET_ID

```
Name: TENCENT_SECRET_ID
Value: YOUR_ACTUAL_SECRET_ID_HERE
```

⚠️ **注意**：请替换为从腾讯云控制台获取的真实 SecretId（格式：AKID 开头，36 位字符）

#### Secret 2: TENCENT_SECRET_KEY

```
Name: TENCENT_SECRET_KEY
Value: YOUR_ACTUAL_SECRET_KEY_HERE
```

⚠️ **注意**：请替换为从腾讯云控制台获取的真实 SecretKey（格式：32 位字符）

#### Secret 3: COS_BUCKET_NAME

```
Name: COS_BUCKET_NAME
Value: cutool-1254002056
```

⚠️ **重要**：只要存储桶名称，不要包含：
- ❌ `cos.cutool-1254002056`
- ❌ `cutool-1254002056.cos.ap-guangzhou.myqcloud.com`
- ✅ `cutool-1254002056`

#### Secret 4: COS_REGION

```
Name: COS_REGION
Value: ap-guangzhou
```

---

## ✅ 验证配置

### 方法 1：手动触发工作流

1. 进入仓库的 **Actions** 标签
2. 选择 **Deploy to Tencent Cloud COS**
3. 点击 **Run workflow** > **Run workflow**
4. 查看执行日志，应该看到「✅ 部署完成！」

### 方法 2：推送代码

```bash
git add .
git commit -m "test: trigger deployment"
git push origin main
```

然后在 Actions 页面查看执行结果。

---

## 🔍 常见问题

### Q: 找不到 Settings 选项？

**A:** 确保你有仓库的管理员权限：
1. 如果你是仓库所有者，应该有权限
2. 如果是协作者，需要仓库所有者授予管理员权限
3. 在仓库的 Settings > Collaborators 中检查权限

### Q: SecretKey 忘记了怎么办？

**A:** 
1. 访问：https://console.cloud.tencent.com/cam/capi
2. 找到对应的密钥
3. 点击「禁用」旧密钥
4. 点击「新建密钥」创建新密钥
5. 在 GitHub 中更新 `TENCENT_SECRET_KEY`

### Q: 如何知道存储桶名称是否正确？

**A:** 
1. 在 COS 控制台的存储桶列表中查看
2. 存储桶名称格式通常是：`名称-数字`
3. 例如：`cutool-1254002056`
4. 不要包含任何前缀或后缀

### Q: 地域代码在哪里找？

**A:**
1. 在 COS 控制台的存储桶列表中，可以看到地域列
2. 例如显示「广州」，对应代码是 `ap-guangzhou`
3. 参考上面的对照表

### Q: 工作流执行失败，提示认证失败？

**A:** 检查以下几点：
1. SecretId 和 SecretKey 是否正确复制（不要有多余空格）
2. 密钥是否被禁用
3. 子账号是否有足够的权限（需要 COS 相关权限）
4. 存储桶名称是否正确（不要包含前缀后缀）
5. 地域代码是否正确

### Q: 如何测试 Secrets 是否正确？

**A:** 
1. 在本地安装 coscmd：`pip install coscmd`
2. 使用 Secrets 的值配置：
   ```bash
   coscmd config -a <你的SecretId> -s <你的SecretKey> -b <存储桶名称> -r <地域代码>
   ```
3. 测试上传：
   ```bash
   echo "test" > test.txt
   coscmd upload test.txt /
   ```
4. 如果成功，说明配置正确

---

## 📝 配置示例

假设你的信息如下：

- **SecretId**: `YOUR_ACTUAL_SECRET_ID`（从腾讯云控制台获取）
- **SecretKey**: `YOUR_ACTUAL_SECRET_KEY`（从腾讯云控制台获取）
- **存储桶名称**: `cutool-1254002056`
- **地域**: `广州`

那么在 GitHub Secrets 中应该配置：

```
TENCENT_SECRET_ID = YOUR_ACTUAL_SECRET_ID
TENCENT_SECRET_KEY = YOUR_ACTUAL_SECRET_KEY
COS_BUCKET_NAME = cutool-1254002056
COS_REGION = ap-guangzhou
```

⚠️ **重要**：请将 `YOUR_ACTUAL_SECRET_ID` 和 `YOUR_ACTUAL_SECRET_KEY` 替换为你从腾讯云控制台获取的真实密钥值。

---

## 🔒 安全建议

1. **使用子账号**：不要使用主账号的 API 密钥
2. **最小权限原则**：只授予必要的 COS 权限
3. **定期轮换**：定期更换 API 密钥
4. **不要泄露**：不要将密钥提交到代码仓库
5. **监控使用**：定期检查 API 密钥的使用情况

---

## 📚 相关文档

- [腾讯云 API 密钥管理](https://console.cloud.tencent.com/cam/capi)
- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [COS 地域列表](https://cloud.tencent.com/document/product/436/6224)
- [COS CLI 文档](https://cloud.tencent.com/document/product/436/10976)

