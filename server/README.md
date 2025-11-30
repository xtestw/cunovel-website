# CUTool 后端服务器

Python Flask 实现的 RESTful API 服务器。

## 环境要求

- Python 3.7+

## 安装依赖

```bash
cd server
pip install -r requirements.txt
```

或者使用虚拟环境（推荐）：

```bash
cd server
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

## 启动服务器

### 开发模式

```bash
python app.py
```

### 生产模式（使用 Gunicorn）

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:3003 app:app
```

服务器默认运行在 `http://localhost:3003`

## API 接口

所有接口都支持 `lang` 查询参数来指定语言：
- `lang=zh` - 中文（默认）
- `lang=en` - 英文

### AI日报接口

- `GET /api/ai-daily/today?lang=zh` - 获取今天的日报
- `GET /api/ai-daily/history?lang=zh` - 获取历史日报列表
- `GET /api/ai-daily/<date>?lang=zh` - 获取指定日期的日报（日期格式：YYYY-MM-DD）
- `GET /api/ai-daily/<date>/news/<news_id>?lang=zh` - 获取新闻详情

### AI教程接口

- `GET /api/ai-tutorial?lang=zh` - 获取AI教程列表

### 健康检查

- `GET /api/health` - 健康检查接口

## 环境变量

创建 `.env` 文件（参考 `env.example`）配置以下环境变量：

```bash
# 复制示例文件
cp env.example .env
```

然后编辑 `.env` 文件，设置正确的数据库密码（当前默认密码：xw123456）

- `DB_HOST` - 数据库主机地址（默认：localhost）
- `DB_PORT` - 数据库端口（默认：3306）
- `DB_USER` - 数据库用户名（默认：root）
- `DB_PASSWORD` - 数据库密码
- `DB_NAME` - 数据库名称（默认：cutool_db）
- `DB_CHARSET` - 数据库字符集（默认：utf8mb4）
- `PORT` - 服务器端口（默认：3003）

## 数据库初始化

### 新安装（支持多语言）

1. 创建数据库并导入表结构：

```bash
mysql -u root -pxw123456 < database_multilang.sql
```

或者手动执行 `database_multilang.sql` 文件中的SQL语句。

### 从旧版本升级

如果已有单语言数据库，需要执行迁移脚本：

```bash
mysql -u root -pxw123456 < migrate_to_multilang.sql
```

**注意**：执行迁移前请备份数据库！

### 配置

确保数据库连接配置正确（在 `.env` 文件中设置）。

## 示例请求

```bash
# 获取今天的日报（中文）
curl http://localhost:3003/api/ai-daily/today?lang=zh

# 获取今天的日报（英文）
curl http://localhost:3003/api/ai-daily/today?lang=en

# 获取历史日报
curl http://localhost:3003/api/ai-daily/history?lang=zh

# 获取指定日期的日报
curl http://localhost:3003/api/ai-daily/2024-01-15?lang=zh

# 获取新闻详情
curl http://localhost:3003/api/ai-daily/2024-01-15/news/0?lang=zh

# 获取AI教程（中文）
curl http://localhost:3003/api/ai-tutorial?lang=zh

# 获取AI教程（英文）
curl http://localhost:3003/api/ai-tutorial?lang=en

# 健康检查
curl http://localhost:3003/api/health
```

## 数据库表结构

- `ai_daily` - AI日报表，存储每日的日报信息（支持多语言）
- `ai_news` - AI新闻表，存储新闻详情，关联到日报（支持多语言）
- `ai_tutorial` - AI教程表，存储教程内容（支持多语言）

所有表都包含 `language` 字段（zh-中文，en-英文），支持同一内容的多语言版本。

详细表结构请参考 `database_multilang.sql` 文件。

## 注意事项

1. **数据库连接**：确保MySQL服务已启动，并且数据库已创建
2. **数据管理**：可以通过SQL直接管理数据，或实现管理后台
3. **生产环境**：建议添加：
   - 认证和授权（JWT Token）
   - 更完善的错误处理和日志记录
   - 数据缓存机制（Redis）
   - API 限流（Flask-Limiter）
   - 使用 WSGI 服务器部署（Gunicorn/uWSGI）
   - 数据库连接池优化

