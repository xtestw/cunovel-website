import os
import sys
from dotenv import load_dotenv

# 尝试从多个位置加载.env文件
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(parent_dir)
server_dir = os.path.join(project_root, 'server')

# 优先加载当前目录的.env，然后是server目录的.env
env_files = [
    os.path.join(current_dir, '.env'),
    os.path.join(server_dir, '.env'),
    os.path.join(project_root, '.env')
]

for env_file in env_files:
    if os.path.exists(env_file):
        load_dotenv(env_file)
        break
else:
    # 如果都没有，尝试从环境变量加载
    load_dotenv()

class Config:
    # 数据库配置
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'xw123456')
    DB_NAME = os.getenv('DB_NAME', 'cutool_db')
    DB_CHARSET = os.getenv('DB_CHARSET', 'utf8mb4')
    
    # DeepSeek API配置
    DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
    DEEPSEEK_API_URL = os.getenv('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1/chat/completions')
    DEEPSEEK_MODEL = os.getenv('DEEPSEEK_MODEL', 'deepseek-chat')
    
    # 定时任务配置
    SCHEDULE_TIME = os.getenv('SCHEDULE_TIME', '08:30')  # 每天执行时间
    
    # 新闻抓取配置
    MAX_NEWS_PER_FEED = int(os.getenv('MAX_NEWS_PER_FEED', 10))  # 每个订阅源最多抓取多少条
    NEWS_DEDUP_HOURS = int(os.getenv('NEWS_DEDUP_HOURS', 24))  # 去重时间窗口（小时）

