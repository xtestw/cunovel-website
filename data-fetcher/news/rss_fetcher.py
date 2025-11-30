import feedparser
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re
import os
import sys

# 添加当前目录到路径（优先）
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 导入当前目录的config和db_helper
from config import Config
from db_helper import DBHelper

class RSSFetcher:
    def __init__(self):
        self.db = DBHelper()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def fetch_feed(self, feed_url):
        """抓取RSS订阅源"""
        try:
            response = self.session.get(feed_url, timeout=30)
            response.raise_for_status()
            feed = feedparser.parse(response.content)
            return feed
        except Exception as e:
            print(f"Error fetching feed {feed_url}: {str(e)}")
            return None
    
    def clean_html(self, html_content):
        """清理HTML内容，提取纯文本"""
        if not html_content:
            return ''
        
        # 处理CDATA
        if '<![CDATA[' in html_content:
            html_content = html_content.replace('<![CDATA[', '').replace(']]>', '')
        
        soup = BeautifulSoup(html_content, 'html.parser')
        # 移除script和style标签
        for script in soup(["script", "style", "iframe"]):
            script.decompose()
        
        # 提取文本
        text = soup.get_text()
        
        # 清理多余空白和换行
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        # 限制长度，但保留更多内容用于content
        return text[:5000]  # 增加长度限制
    
    def extract_content(self, entry):
        """从RSS条目中提取内容"""
        content = ''
        
        # feedparser会将content:encoded放在entry.content中
        # 优先尝试获取完整内容（content:encoded）
        if hasattr(entry, 'content') and entry.content:
            if isinstance(entry.content, list) and len(entry.content) > 0:
                # 查找content:encoded或html类型的内容
                for item in entry.content:
                    # feedparser中content是字典，包含value和type
                    if hasattr(item, 'value'):
                        item_value = item.value
                        # 优先选择html类型的内容
                        if hasattr(item, 'type') and ('html' in str(item.type).lower() or 'text' in str(item.type).lower()):
                            content = item_value
                            break
                # 如果没找到，使用第一个
                if not content and hasattr(entry.content[0], 'value'):
                    content = entry.content[0].value
                elif not content:
                    content = str(entry.content[0])
            else:
                content = str(entry.content)
        
        # 如果没有content，尝试summary
        if not content and hasattr(entry, 'summary'):
            content = entry.summary
        
        # 如果没有summary，尝试description
        if not content and hasattr(entry, 'description'):
            content = entry.description
        
        # 处理CDATA格式
        if content and isinstance(content, str):
            # 移除CDATA标签
            if '<![CDATA[' in content:
                content = content.replace('<![CDATA[', '').replace(']]>', '')
        
        return self.clean_html(content)
    
    def extract_summary(self, entry):
        """从RSS条目中提取摘要"""
        summary = ''
        
        # 优先使用description
        if hasattr(entry, 'description'):
            summary = entry.description
        elif hasattr(entry, 'summary'):
            summary = entry.summary
        
        # 处理CDATA格式
        if summary and isinstance(summary, str):
            # 移除CDATA标签
            if '<![CDATA[' in summary:
                summary = summary.replace('<![CDATA[', '').replace(']]>', '')
            # 清理HTML标签，只保留文本
            soup = BeautifulSoup(summary, 'html.parser')
            summary = soup.get_text()
            # 清理多余空白
            summary = ' '.join(summary.split())
        
        return summary[:500] if summary else ''  # 限制长度
    
    def process_feed(self, feed_info):
        """处理单个RSS订阅源"""
        print(f"Processing feed: {feed_info['name']} ({feed_info['url']})")
        
        feed = self.fetch_feed(feed_info['url'])
        if not feed or not feed.entries:
            print(f"No entries found in feed: {feed_info['name']}")
            return []
        
        language = feed_info['language']
        today = datetime.now().date()
        daily_id = self.db.get_today_daily(language)
        
        news_list = []
        count = 0
        
        for entry in feed.entries[:Config.MAX_NEWS_PER_FEED]:
            # 获取链接
            link = entry.get('link', '')
            if not link:
                continue
            
            # 检查是否已存在
            if self.db.check_news_exists(link, language):
                continue
            
            # 提取信息
            title = entry.get('title', 'Untitled')
            # 分别提取摘要和内容
            summary = self.extract_summary(entry)
            content = self.extract_content(entry)
            
            # 如果没有摘要，从内容中提取前500字符作为摘要
            if not summary and content:
                summary = content[:500]
            
            # 获取来源信息
            source = feed_info['name']
            source_link = feed_info['url']
            
            # 提取标签（如果有）
            tags = []
            if hasattr(entry, 'tags'):
                tags = [tag.term for tag in entry.tags[:5]]
            tags_json = str(tags).replace("'", '"') if tags else '[]'
            
            # 插入新闻
            try:
                news_id = self.db.insert_news(
                    daily_id=daily_id,
                    language=language,
                    title=title,
                    summary=summary,  # 已经限制过长度
                    content=content,
                    source=source,
                    source_link=source_link,
                    link=link,
                    tags=tags_json,
                    order_index=count
                )
                news_list.append({
                    'id': news_id,
                    'title': title,
                    'summary': summary[:500] if summary else ''
                })
                count += 1
                print(f"  ✓ Inserted: {title[:50]}...")
            except Exception as e:
                print(f"  ✗ Error inserting news: {str(e)}")
        
        print(f"Processed {count} news items from {feed_info['name']}")
        return news_list
    
    def fetch_all_feeds(self):
        """抓取所有启用的RSS订阅源"""
        feeds = self.db.get_enabled_feeds()
        if not feeds:
            print("No enabled feeds found")
            return
        
        all_news = {'zh': [], 'en': []}
        
        for feed in feeds:
            try:
                news_list = self.process_feed(feed)
                language = feed['language']
                all_news[language].extend(news_list)
            except Exception as e:
                print(f"Error processing feed {feed['name']}: {str(e)}")
        
        return all_news
    
    def close(self):
        """关闭资源"""
        self.db.close()
        self.session.close()
