# RSS新闻抓取服务

定时从RSS订阅源抓取AI行业新闻并写入数据库，使用DeepSeek生成日报概要。

## 功能特性

- 支持多个RSS订阅源管理
- 自动去重，避免重复抓取
- 支持中英文双语
- 使用DeepSeek API生成日报概要
- 定时任务，每天早上8:30自动执行

## 安装依赖

```bash
cd data-fetcher/news
pip install -r requirements.txt
```

## 配置

创建 `.env` 文件（参考项目根目录的 `server/env.example`）：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=xw123456
DB_NAME=cutool_db
DB_CHARSET=utf8mb4

# DeepSeek API配置
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat

# 定时任务配置
SCHEDULE_TIME=08:30

# 新闻抓取配置
MAX_NEWS_PER_FEED=10
NEWS_DEDUP_HOURS=24
```

## 初始化数据库

执行RSS订阅源表创建脚本：

```bash
mysql -u root -pxw123456 < ../../server/rss_feeds.sql
```

## 使用方法

### 1. 手动执行一次

```bash
python fetch_news.py
```

### 2. 启动定时任务调度器

```bash
python scheduler.py
```

调度器会在每天指定时间（默认8:30）自动执行抓取任务。

### 3. 使用系统cron（推荐生产环境）

编辑crontab：

```bash
crontab -e
```

添加以下行（每天早上8:30执行）：

```cron
30 8 * * * cd /path/to/cutool-web/data-fetcher/news && /usr/bin/python3 fetch_news.py >> /var/log/rss_fetcher.log 2>&1
```

## RSS订阅源管理

RSS订阅源存储在数据库的 `rss_feeds` 表中，可以通过SQL直接管理：

```sql
-- 查看所有订阅源
SELECT * FROM rss_feeds;

-- 添加新订阅源
INSERT INTO rss_feeds (name, url, language, weight, description) 
VALUES ('订阅源名称', 'https://example.com/rss', 'zh', 8, '描述');

-- 禁用订阅源
UPDATE rss_feeds SET enabled = 0 WHERE id = 1;

-- 启用订阅源
UPDATE rss_feeds SET enabled = 1 WHERE id = 1;
```

## 日志

脚本执行时会输出日志到控制台。如果使用cron，建议将输出重定向到日志文件。

## 注意事项

1. 确保数据库连接配置正确
2. DeepSeek API密钥需要有效
3. 定时任务需要确保Python环境正确
4. 建议在生产环境使用systemd或supervisor管理进程

