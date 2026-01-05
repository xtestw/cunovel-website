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
    # Google Search Console 配置
    # 使用服务账号 JSON 密钥文件路径
    GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE', '')
    
    # 或者使用 OAuth 2.0 客户端凭据
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')
    GOOGLE_REFRESH_TOKEN = os.getenv('GOOGLE_REFRESH_TOKEN', '')
    
    # 网站属性（在 Google Search Console 中验证的网站）
    GOOGLE_SITE_URL = os.getenv('GOOGLE_SITE_URL', 'https://cutool.online')
    
    # 推送方式：'indexing_api' 或 'search_console_api' 或 'ping'
    PUSH_METHOD = os.getenv('PUSH_METHOD', 'ping')
    
    # 站点地图 URL
    SITEMAP_URL = os.getenv('SITEMAP_URL', 'https://cutool.online/sitemap.xml')
    
    # 日志配置
    LOG_DIR = os.getenv('LOG_DIR', os.path.join(current_dir, 'logs'))
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

