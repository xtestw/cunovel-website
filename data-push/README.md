# Google Search Console URL 推送工具

这个工具用于主动推送 URL 到 Google Search Console，帮助 Google 更快地发现和索引网站内容。

## 功能特性

- ✅ 支持多种推送方式：
  - **Ping 方式**（最简单，无需 API 密钥）- 推荐用于站点地图推送
  - **Google Indexing API**（最推荐）- 实时推送单个 URL，需要服务账号
  - **Google Search Console API** - 批量操作，需要 OAuth 或服务账号
- ✅ 从站点地图自动提取 URL
- ✅ 支持批量推送多个 URL
- ✅ 详细的日志记录
- ✅ 命令行工具，易于集成到自动化流程

## 安装

```bash
cd data-push
pip install -r requirements.txt
```

## 配置

### 方式 1: Ping 方式（最简单，推荐）

无需任何配置，直接使用：

```bash
python google_push.py --sitemap https://cutool.online/sitemap.xml
```

### 方式 2: Google Indexing API（推荐用于实时推送）

1. 在 [Google Cloud Console](https://console.cloud.google.com/) 创建项目
2. 启用 "Indexing API"
3. 创建服务账号并下载 JSON 密钥文件
4. 在 Google Search Console 中添加服务账号邮箱为所有者
5. 配置环境变量：

```bash
# 在 .env 文件中或环境变量中设置
GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/service-account-key.json
GOOGLE_SITE_URL=https://cutool.online
PUSH_METHOD=indexing_api
```

### 方式 3: Google Search Console API

需要 OAuth 2.0 客户端凭据或服务账号（类似 Indexing API）。

## 使用方法

### 1. 推送站点地图（Ping 方式）

```bash
python google_push.py --sitemap https://cutool.online/sitemap.xml
```

或使用默认配置：

```bash
python google_push.py
```

### 2. 推送单个 URL（Ping 方式）

```bash
python google_push.py --single-url https://cutool.online/ai-daily
```

### 3. 推送多个 URL（Indexing API）

```bash
python google_push.py --urls https://cutool.online/ai-daily https://cutool.online/tools/json/formatter --method indexing_api
```

### 4. 从站点地图提取并推送所有 URL

```bash
python google_push.py --method ping
```

## 环境变量配置

创建 `.env` 文件（参考 `env.example`）：

```bash
# Google 服务账号 JSON 密钥文件路径
GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/service-account-key.json

# 网站 URL（在 Google Search Console 中验证的网站）
GOOGLE_SITE_URL=https://cutool.online

# 推送方式：ping, indexing_api, search_console_api
PUSH_METHOD=ping

# 站点地图 URL
SITEMAP_URL=https://cutool.online/sitemap.xml

# 日志目录
LOG_DIR=./logs

# 日志级别
LOG_LEVEL=INFO
```

## 集成到自动化流程

### 在数据更新后自动推送

例如，在 `data-fetcher/news/scheduler.py` 中，可以在生成新日报后自动推送：

```python
import subprocess
import sys

# 在生成日报后
subprocess.run([
    sys.executable,
    'data-push/google_push.py',
    '--single-url',
    f'https://cutool.online/ai-daily/{today_date}'
])
```

### 定时推送站点地图

使用 cron 或系统定时任务：

```bash
# 每天推送一次站点地图
0 2 * * * cd /path/to/cutool-web && python data-push/google_push.py
```

## 日志

日志文件保存在 `logs/` 目录下，按日期命名：
- `google_push_YYYYMMDD.log`

## 注意事项

1. **Ping 方式**：
   - 最简单，无需配置
   - 主要用于通知 Google 站点地图更新
   - 不保证立即索引

2. **Indexing API**：
   - 需要服务账号和 API 密钥
   - 可以实时推送单个 URL
   - 有每日配额限制（通常 200 次/天）

3. **推送频率**：
   - 不要过于频繁推送相同 URL
   - 建议在内容更新时推送
   - 站点地图可以每天推送一次

4. **验证**：
   - 确保网站在 Google Search Console 中已验证
   - 服务账号需要被添加为网站所有者

## 故障排查

1. **Indexing API 返回 403 错误**：
   - 检查服务账号是否已添加到 Google Search Console
   - 确认已启用 Indexing API

2. **Ping 失败**：
   - 检查网络连接
   - 确认站点地图 URL 可访问

3. **找不到模块**：
   - 运行 `pip install -r requirements.txt`

## 参考文档

- [Google Indexing API 文档](https://developers.google.com/search/apis/indexing-api/v3/using-api)
- [Google Search Console API 文档](https://developers.google.com/webmaster-tools/search-console-api-original)
- [站点地图协议](https://www.sitemaps.org/protocol.html)

