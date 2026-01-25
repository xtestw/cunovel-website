# 第三方登录配置指南

本指南将帮助您配置微信、Gmail（Google）和GitHub的第三方登录功能。

## 前置准备

1. 确保已安装所有依赖：
```bash
cd server
pip install -r requirements.txt
```

2. 创建用户表（如果还没有）：
```bash
mysql -u root -p cutool_db < create_users_table.sql
```

或者使用SQLAlchemy自动创建（已在app.py中配置）。

## GitHub OAuth 配置

### 1. 创建 GitHub OAuth App

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写以下信息：
   - **Application name**: CUTool（或您的应用名称）
   - **Homepage URL**: `https://your-domain.com`（您的网站地址）
   - **Authorization callback URL**: `https://your-domain.com/api/auth/callback/github`
     - 开发环境可以使用：`http://localhost:3003/api/auth/callback/github`
4. 点击 "Register application"
5. 复制 **Client ID** 和 **Client Secret**

### 2. 配置环境变量

在 `server/.env` 文件中添加：

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Google OAuth 配置

### 1. 创建 Google OAuth 2.0 客户端

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API：
   - 进入 "APIs & Services" > "Library"
   - 搜索 "Google+ API" 并启用
4. 创建 OAuth 2.0 凭据：
   - 进入 "APIs & Services" > "Credentials"
   - 点击 "Create Credentials" > "OAuth client ID"
   - 如果首次使用，需要先配置 OAuth consent screen
5. 选择应用类型：**Web application**
6. 填写信息：
   - **Name**: CUTool（或您的应用名称）
   - **Authorized redirect URIs**: 
     - `https://your-domain.com/api/auth/callback/google`
     - 开发环境：`http://localhost:3003/api/auth/callback/google`
7. 点击 "Create"
8. 复制 **Client ID** 和 **Client Secret**

### 2. 配置 OAuth Consent Screen

如果是首次创建，需要配置 OAuth consent screen：

1. 进入 "APIs & Services" > "OAuth consent screen"
2. 选择用户类型（通常选择 "External"）
3. 填写应用信息：
   - **App name**: CUTool
   - **User support email**: 您的邮箱
   - **Developer contact information**: 您的邮箱
4. 添加作用域（Scopes）：
   - `email`
   - `profile`
   - `openid`
5. 添加测试用户（如果应用未发布）

### 3. 配置环境变量

在 `server/.env` 文件中添加：

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 微信 OAuth 配置

### 1. 注册微信开放平台账号

1. 访问 [微信开放平台](https://open.weixin.qq.com/)
2. 注册并认证企业账号（需要企业资质）
3. 创建网站应用

### 2. 创建网站应用

1. 进入 "管理中心" > "网站应用"
2. 点击 "创建网站应用"
3. 填写应用信息：
   - **应用名称**: CUTool
   - **应用简介**: 您的应用描述
   - **应用官网**: `https://your-domain.com`
   - **授权回调域**: `your-domain.com`（不需要协议和路径）
4. 提交审核（通常需要1-3个工作日）

### 3. 获取 AppID 和 AppSecret

审核通过后，在应用详情页面可以获取：
- **AppID**（对应 `WECHAT_CLIENT_ID`）
- **AppSecret**（对应 `WECHAT_CLIENT_SECRET`）

### 4. 配置环境变量

在 `server/.env` 文件中添加：

```bash
WECHAT_CLIENT_ID=your_wechat_app_id
WECHAT_CLIENT_SECRET=your_wechat_app_secret
```

## JWT 密钥配置

在 `server/.env` 文件中添加：

```bash
SECRET_KEY=your_secret_key_here
```

建议使用强随机字符串，可以使用以下命令生成：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 测试登录功能

### 1. 启动后端服务器

```bash
cd server
python app.py
```

### 2. 启动前端开发服务器

```bash
npm start
```

### 3. 测试登录

1. 访问网站首页
2. 点击右上角的登录按钮（GitHub、Google 或微信）
3. 完成 OAuth 授权流程
4. 应该会自动跳转回网站并显示用户信息

## 常见问题

### 1. GitHub 登录失败

- 检查回调 URL 是否正确配置
- 确认 Client ID 和 Secret 是否正确
- 检查网络连接是否正常

### 2. Google 登录失败

- 确认 OAuth consent screen 已配置
- 检查重定向 URI 是否在授权列表中
- 确认 Google+ API 已启用
- 如果使用测试账号，确保已添加到测试用户列表

### 3. 微信登录失败

- 确认账号已通过企业认证
- 检查授权回调域是否正确配置
- 确认应用已通过审核
- 注意：微信登录需要 HTTPS 环境（生产环境）

### 4. Token 验证失败

- 检查 `SECRET_KEY` 是否配置
- 确认前后端使用相同的密钥
- 检查 token 是否过期（默认7天）

## 安全建议

1. **保护密钥**：不要将 `.env` 文件提交到版本控制系统
2. **使用 HTTPS**：生产环境必须使用 HTTPS
3. **定期更新密钥**：定期更换 `SECRET_KEY`
4. **限制回调域名**：在 OAuth 提供商的配置中，只添加必要的回调域名
5. **监控异常登录**：记录登录日志，监控异常行为

## API 接口说明

### 登录接口

- `GET /api/auth/login/github` - GitHub 登录
- `GET /api/auth/login/google` - Google 登录
- `GET /api/auth/login/wechat` - 微信登录

### 回调接口

- `GET /api/auth/callback/github` - GitHub 回调
- `GET /api/auth/callback/google` - Google 回调
- `GET /api/auth/callback/wechat` - 微信回调

### 用户信息接口

- `GET /api/auth/me` - 获取当前登录用户信息（需要 Bearer token）
- `POST /api/auth/logout` - 登出

### 使用示例

```javascript
// 获取用户信息
fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

## 数据库表结构

用户信息存储在 `users` 表中，包含以下字段：

- `id` - 用户ID（主键）
- `username` - 用户名
- `email` - 邮箱
- `avatar_url` - 头像URL
- `provider` - 登录提供商（wechat, google, github）
- `provider_user_id` - 第三方用户ID
- `display_name` - 显示名称
- `created_at` - 创建时间
- `updated_at` - 更新时间
- `last_login_at` - 最后登录时间

