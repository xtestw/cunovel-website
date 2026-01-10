import feedparser
import requests
from bs4 import BeautifulSoup
from datetime import datetime
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
    
    def clean_html(self, html_content, preserve_formatting=False):
        """清理HTML内容，提取文本或格式化HTML
        
        Args:
            html_content: 原始HTML内容
            preserve_formatting: 是否保留格式化（用于content），False则提取纯文本（用于summary）
        """
        if not html_content:
            return ''
        
        # 处理CDATA
        if '<![CDATA[' in html_content:
            html_content = html_content.replace('<![CDATA[', '').replace(']]>', '')
        
        soup = BeautifulSoup(html_content, 'html.parser')
        # 移除script和style标签
        for script in soup(["script", "style", "iframe", "noscript"]):
            script.decompose()
        
        if preserve_formatting:
            # 保留格式化，转换为干净的HTML
            # 保留段落、列表、标题等结构标签
            allowed_tags = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                          'ul', 'ol', 'li', 'blockquote', 'a', 'code', 'pre']
            
            # 清理所有不允许的标签，但保留文本内容
            for tag in soup.find_all(True):
                if tag.name not in allowed_tags:
                    tag.unwrap()  # 移除标签但保留内容
            
            # 确保段落之间有合理的间距
            for p in soup.find_all('p'):
                if not p.get_text(strip=True):
                    p.decompose()  # 移除空段落
            
            # 限制长度
            html_str = str(soup)
            if len(html_str) > 5000:
                # 如果太长，截取前5000字符，但要确保HTML标签完整
                truncated = html_str[:5000]
                # 尝试找到最后一个完整的标签
                last_tag_end = truncated.rfind('>')
                if last_tag_end > 0:
                    truncated = truncated[:last_tag_end + 1] + '...'
                return truncated
            return html_str
        else:
            # 提取纯文本，但保留段落结构（用换行分隔）
            # 先处理段落
            for p in soup.find_all(['p', 'div', 'br']):
                if p.name == 'br':
                    p.replace_with('\n')
                else:
                    p_text = p.get_text(strip=True)
                    if p_text:
                        p.replace_with(p_text + '\n\n')
            
            # 处理列表
            for ul in soup.find_all(['ul', 'ol']):
                items = []
                for li in ul.find_all('li', recursive=False):
                    items.append('• ' + li.get_text(strip=True))
                if items:
                    ul.replace_with('\n'.join(items) + '\n\n')
            
            # 提取文本
            text = soup.get_text()
            
            # 清理多余空白，但保留段落分隔
            lines = []
            for line in text.splitlines():
                line = line.strip()
                if line:
                    lines.append(line)
            
            # 合并连续的短行（可能是被错误分割的）
            merged_lines = []
            for line in lines:
                if merged_lines and len(line) < 50 and not line.endswith(('.', '。', '!', '！', '?', '？')):
                    merged_lines[-1] += ' ' + line
                else:
                    merged_lines.append(line)
            
            text = '\n\n'.join(merged_lines)
            
            # 限制长度
            return text[:5000]
    
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
        
        # 保留格式化（HTML格式）
        return self.clean_html(content, preserve_formatting=True)
    
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
            # 使用 clean_html 提取格式化的纯文本（保留段落结构）
            summary = self.clean_html(summary, preserve_formatting=False)
        
        # 限制长度，但保留换行
        if summary and len(summary) > 500:
            # 在500字符附近找合适的截断点（句号、换行等）
            truncated = summary[:500]
            # 尝试在句号、问号、感叹号或换行处截断
            for delimiter in ['。', '.', '!', '！', '?', '？', '\n']:
                last_pos = truncated.rfind(delimiter)
                if last_pos > 400:  # 确保不会截得太短
                    truncated = truncated[:last_pos + 1]
                    break
            return truncated + '...' if len(summary) > 500 else summary
        return summary if summary else ''
    
    def process_feed(self, feed_info):
        """处理单个RSS订阅源"""
        print(f"Processing feed: {feed_info['name']} ({feed_info['url']})")
        
        feed = self.fetch_feed(feed_info['url'])
        if not feed or not feed.entries:
            print(f"No entries found in feed: {feed_info['name']}")
            return []
        
        language = feed_info['language']
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
