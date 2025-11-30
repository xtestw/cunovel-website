"""
数据库初始化脚本
用于创建数据库表结构（如果使用SQLAlchemy自动创建）
"""
from sqlalchemy import create_engine
from models import Base
from config import Config

def init_database():
    """初始化数据库表"""
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
    
    # 创建所有表
    Base.metadata.create_all(engine)
    
    print("数据库表创建成功！")
    print(f"数据库: {Config.DB_NAME}")
    print(f"已创建的表:")
    for table_name in Base.metadata.tables.keys():
        print(f"  - {table_name}")

if __name__ == '__main__':
    init_database()

