import pymysql
from datetime import datetime, timedelta
import os
import sys

# 添加当前目录到路径（优先）
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 导入当前目录的config
from config import Config

class DBHelper:
    def __init__(self):
        self.conn = pymysql.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            charset=Config.DB_CHARSET,
            cursorclass=pymysql.cursors.DictCursor
        )
    
    def get_enabled_feeds(self):
        """获取所有启用的RSS订阅源，按权重降序排序"""
        with self.conn.cursor() as cursor:
            sql = """
                SELECT * FROM rss_feeds 
                WHERE enabled = 1 
                ORDER BY weight DESC, id ASC
            """
            cursor.execute(sql)
            return cursor.fetchall()
    
    def check_news_exists(self, link, language):
        """检查新闻是否已存在（通过链接和语言）"""
        with self.conn.cursor() as cursor:
            sql = """
                SELECT id FROM ai_news 
                WHERE link = %s AND language = %s
                LIMIT 1
            """
            cursor.execute(sql, (link, language))
            return cursor.fetchone() is not None
    
    def get_today_daily(self, language):
        """获取今天的日报，如果不存在则创建"""
        today = datetime.now().date()
        with self.conn.cursor() as cursor:
            # 先查询是否存在
            sql = "SELECT id FROM ai_daily WHERE date = %s AND language = %s"
            cursor.execute(sql, (today, language))
            daily = cursor.fetchone()
            
            if daily:
                return daily['id']
            else:
                # 创建新的日报
                sql = """
                    INSERT INTO ai_daily (date, language, summary) 
                    VALUES (%s, %s, %s)
                """
                cursor.execute(sql, (today, language, ''))
                self.conn.commit()
                return cursor.lastrowid
    
    def insert_news(self, daily_id, language, title, summary, content, source, source_link, link, tags, order_index):
        """插入新闻"""
        with self.conn.cursor() as cursor:
            sql = """
                INSERT INTO ai_news 
                (daily_id, language, title, summary, content, source, source_link, link, tags, order_index)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                daily_id, language, title, summary, content,
                source, source_link, link, tags, order_index
            ))
            self.conn.commit()
            return cursor.lastrowid
    
    def get_today_news(self, language):
        """获取今天的所有新闻"""
        today = datetime.now().date()
        with self.conn.cursor() as cursor:
            sql = """
                SELECT n.* FROM ai_news n
                INNER JOIN ai_daily d ON n.daily_id = d.id
                WHERE d.date = %s AND n.language = %s
                ORDER BY n.order_index ASC, n.created_at DESC
            """
            cursor.execute(sql, (today, language))
            return cursor.fetchall()
    
    def update_daily_summary(self, daily_id, summary):
        """更新日报概要"""
        with self.conn.cursor() as cursor:
            sql = "UPDATE ai_daily SET summary = %s WHERE id = %s"
            cursor.execute(sql, (summary, daily_id))
            self.conn.commit()
    
    def close(self):
        """关闭数据库连接"""
        self.conn.close()

