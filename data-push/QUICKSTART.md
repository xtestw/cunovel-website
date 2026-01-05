# 快速开始指南

## 最简单的使用方式（Ping 方式）

无需任何配置，直接推送站点地图：

```bash
cd data-push
python google_push.py --sitemap https://cutool.online/sitemap.xml
```

或者推送单个 URL：

```bash
python google_push.py --single-url https://cutool.online/ai-daily
```

## 测试功能

运行测试脚本验证功能是否正常：

```bash
cd data-push
python test_push.py
```

## 安装依赖

```bash
cd data-push
pip install -r requirements.txt
```

## 常用命令

### 1. 推送站点地图（最简单）
```bash
python google_push.py
```

### 2. 推送指定站点地图
```bash
python google_push.py --sitemap https://cutool.online/sitemap.xml
```

### 3. 推送单个 URL
```bash
python google_push.py --single-url https://cutool.online/ai-daily
```

### 4. 推送多个 URL（需要配置 Indexing API）
```bash
python google_push.py --urls https://cutool.online/ai-daily https://cutool.online/tools/json/formatter --method indexing_api
```

## 集成到自动化流程

### 在日报生成后自动推送

修改 `data-fetcher/news/scheduler.py`，在生成日报后添加：

```python
import subprocess
import sys
from datetime import datetime

# 在生成日报后
today = datetime.now().strftime('%Y-%m-%d')
subprocess.run([
    sys.executable,
    '../data-push/google_push.py',
    '--single-url',
    f'https://cutool.online/ai-daily/{today}'
])
```

### 定时推送站点地图

添加到 crontab：

```bash
# 每天凌晨 2 点推送站点地图
0 2 * * * cd /path/to/cutool-web/data-push && python google_push.py
```

## 查看日志

日志文件保存在 `logs/` 目录：

```bash
tail -f logs/google_push_$(date +%Y%m%d).log
```

## 下一步

- 查看 [README.md](README.md) 了解详细配置
- 配置 Google Indexing API 实现实时推送
- 集成到你的自动化流程中

