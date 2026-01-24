# 支付宝配置获取指南

本文档说明如何获取支付宝支付所需的配置信息。

## 一、注册支付宝开放平台账号

1. 访问 [支付宝开放平台](https://open.alipay.com/)
2. 使用企业支付宝账号登录（个人账号无法创建应用）
3. 完成企业认证

## 二、创建应用

1. 登录后，进入 **控制台** > **网页&移动应用**
2. 点击 **创建应用**
3. 选择应用类型：**网页应用** 或 **移动应用**
4. 填写应用信息：
   - 应用名称
   - 应用图标
   - 应用描述
5. 提交审核（一般需要1-3个工作日）

## 三、获取应用配置信息

### 1. 获取 APPID（应用ID）

1. 在应用列表中，找到创建的应用
2. 点击应用名称进入应用详情
3. 在 **应用信息** 页面可以看到 **APPID**
4. 复制 APPID，填入 `ALIPAY_APP_ID`

### 2. 配置应用网关和回调地址

1. 在应用详情页面，找到 **开发信息**
2. 配置以下信息：
   - **应用网关**：填写你的服务器地址，如 `https://your-domain.com`
   - **授权回调地址**：填写 `https://your-domain.com/vehicle-verify`
   - **服务器异步通知页面路径**：填写 `https://your-domain.com/api/vehicle-verify/alipay/notify`

### 3. 生成应用私钥和公钥

#### 方法一：使用支付宝提供的工具生成（推荐）

1. 下载 [支付宝密钥生成工具](https://opendocs.alipay.com/common/02kkv7)
2. 运行工具，选择密钥类型：**RSA2(SHA256)密钥**
3. 点击 **生成密钥**，会生成：
   - 应用私钥（`app_private_key.txt`）
   - 应用公钥（`app_public_key.txt`）

#### 方法二：使用 OpenSSL 生成

```bash
# 生成私钥（RSA2，2048位）
openssl genrsa -out app_private_key.pem 2048

# 生成公钥
openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem
```

### 4. 上传应用公钥

1. 在应用详情页面的 **开发信息** 中，找到 **接口加签方式**
2. 选择 **公钥** 方式
3. 点击 **设置**，将生成的 **应用公钥** 内容粘贴进去
4. 保存设置

### 5. 获取支付宝公钥

1. 在 **接口加签方式** 设置完成后
2. 系统会显示 **支付宝公钥**
3. 复制支付宝公钥，填入 `ALIPAY_PUBLIC_KEY`

## 四、配置环境变量

在 `server/.env` 文件中配置以下信息：

```bash
# 支付宝配置
ALIPAY_APP_ID=你的APPID
ALIPAY_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
你的私钥内容
...
-----END RSA PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
支付宝公钥内容
...
-----END PUBLIC KEY-----"
ALIPAY_SIGN_TYPE=RSA2
ALIPAY_DEBUG=False  # 生产环境设为False，沙箱环境设为True
ALIPAY_RETURN_URL=https://your-domain.com/vehicle-verify
ALIPAY_NOTIFY_URL=https://your-domain.com/api/vehicle-verify/alipay/notify
```

### 注意事项：

1. **私钥格式**：
   - 私钥需要包含完整的 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`
   - 如果私钥是 `-----BEGIN PRIVATE KEY-----` 格式，需要转换为 RSA 格式
   - 私钥中的换行符需要保留，可以使用 `\n` 或实际换行

2. **公钥格式**：
   - 支付宝公钥需要包含完整的 `-----BEGIN PUBLIC KEY-----` 和 `-----END PUBLIC KEY-----`
   - 公钥中的换行符需要保留

3. **URL 配置**：
   - `ALIPAY_RETURN_URL`：用户支付完成后跳转的页面
   - `ALIPAY_NOTIFY_URL`：支付宝服务器异步通知的地址，必须是公网可访问的 HTTPS 地址

## 五、沙箱环境测试（可选）

在正式上线前，可以使用沙箱环境进行测试：

1. 在支付宝开放平台，进入 **开发助手** > **沙箱环境**
2. 获取沙箱环境的 APPID
3. 配置沙箱环境的网关地址：`https://openapi.alipaydev.com/gateway.do`
4. 设置 `ALIPAY_DEBUG=True`
5. 使用沙箱账号进行测试支付

## 六、常见问题

### 1. 私钥格式错误

如果遇到私钥格式错误，检查：
- 是否包含完整的 BEGIN 和 END 标记
- 换行符是否正确
- 私钥内容是否完整（没有被截断）
- 是否使用了正确的私钥（沙箱环境需要使用沙箱应用的私钥）

### 2. 沙箱环境私钥获取

如果使用支付宝沙箱环境：
1. 登录 [支付宝开放平台](https://open.alipay.com/)
2. 进入 **开发助手** > **沙箱环境**
3. 在 **沙箱应用** 中找到你的应用
4. 点击 **查看**，找到 **应用私钥**
5. 复制完整的私钥内容（包括 BEGIN 和 END 标记）
6. 粘贴到 `.env` 文件的 `ALIPAY_APP_PRIVATE_KEY` 中

**注意**：
- 沙箱环境的 APPID 和私钥与正式环境不同
- 确保 `ALIPAY_DEBUG=True` 使用沙箱环境
- 私钥内容应该是一行或多行，系统会自动处理格式
- 是否有多余的空格

### 2. 签名验证失败

- 确认应用公钥已正确上传到支付宝
- 确认使用的是支付宝公钥，不是应用公钥
- 检查签名类型是否为 RSA2

### 3. 回调地址无法访问

- 确保回调地址是公网可访问的 HTTPS 地址
- 检查服务器防火墙设置
- 确认回调地址与配置的一致

## 七、参考文档

- [支付宝开放平台文档](https://opendocs.alipay.com/)
- [网页支付接入指南](https://opendocs.alipay.com/open/270/105899)
- [密钥生成工具下载](https://opendocs.alipay.com/common/02kkv7)

