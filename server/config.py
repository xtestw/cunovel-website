import os
from dotenv import load_dotenv

# 加载 .env 文件，忽略解析错误（用于注释等）
load_dotenv(override=True)

class Config:
    # 数据库配置
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'cutool_db')
    DB_CHARSET = os.getenv('DB_CHARSET', 'utf8mb4')
    
    # 数据库连接URL
    SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset={DB_CHARSET}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 服务器配置
    PORT = int(os.getenv('PORT', 3003))

