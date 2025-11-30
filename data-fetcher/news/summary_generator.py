import requests
import json
from datetime import datetime
import os
import sys

# 添加当前目录到路径（优先）
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 导入当前目录的config和db_helper
from config import Config
from db_helper import DBHelper

class SummaryGenerator:
    def __init__(self):
        self.db = DBHelper()
        self.api_key = Config.DEEPSEEK_API_KEY
        self.api_url = Config.DEEPSEEK_API_URL
        self.model = Config.DEEPSEEK_MODEL
    
    def generate_summary(self, news_list, language):
        """使用DeepSeek生成日报概要"""
        if not news_list:
            return ""
        
        if not self.api_key:
            print("DeepSeek API key not configured, skipping summary generation")
            return ""
        
        # 构建提示词
        news_titles = "\n".join([f"{i+1}. {news['title']}" for i, news in enumerate(news_list[:20])])  # 最多20条
        
        if language == 'zh':
            prompt = f"""请根据以下AI行业新闻标题，生成一份简洁的今日AI行业动态概要（150-200字）：

{news_titles}

要求：
1. 概括今日AI行业的主要动态和趋势
2. 语言简洁、专业、流畅
3. 突出重要新闻和行业变化
4. 使用段落格式，每段表达一个主题
5. 避免使用列表格式，使用自然语言描述
6. 开头可以有一个总括性的句子

示例格式：
今日AI行业动态显示，[总体趋势]。在技术突破方面，[重要技术新闻]。在产业应用方面，[应用相关新闻]。在行业生态方面，[生态相关新闻]。"""
        else:
            prompt = f"""Please generate a concise summary (150-200 words) of today's AI industry updates based on the following news headlines:

{news_titles}

Requirements:
1. Summarize the main dynamics and trends in today's AI industry
2. Use concise, professional, and fluent language
3. Highlight important news and industry changes
4. Use paragraph format, with each paragraph expressing one theme
5. Avoid using list format, use natural language description
6. Start with a general overview sentence

Example format:
Today's AI industry updates show [overall trend]. In terms of technological breakthroughs, [important tech news]. In terms of industry applications, [application-related news]. In terms of industry ecosystem, [ecosystem-related news]."""
        
        try:
            response = requests.post(
                self.api_url,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.api_key}'
                },
                json={
                    'model': self.model,
                    'messages': [
                        {
                            'role': 'user',
                            'content': prompt
                        }
                    ],
                    'temperature': 0.7,
                    'max_tokens': 800
                },
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            if 'choices' in result and len(result['choices']) > 0:
                summary = result['choices'][0]['message']['content'].strip()
                return summary
            else:
                print(f"Unexpected API response: {result}")
                return ""
        except Exception as e:
            print(f"Error generating summary with DeepSeek: {str(e)}")
            return ""
    
    def update_daily_summaries(self):
        """更新今日所有语言的日报概要"""
        today = datetime.now().date()
        
        for language in ['zh', 'en']:
            # 获取今日新闻
            news_list = self.db.get_today_news(language)
            
            if not news_list:
                print(f"No news found for {language}, skipping summary generation")
                continue
            
            # 生成概要
            print(f"Generating summary for {language}...")
            summary = self.generate_summary(
                [{'title': news['title']} for news in news_list],
                language
            )
            
            if summary:
                # 更新日报概要
                daily_id = self.db.get_today_daily(language)
                self.db.update_daily_summary(daily_id, summary)
                print(f"✓ Updated summary for {language}")
            else:
                print(f"✗ Failed to generate summary for {language}")
    
    def close(self):
        """关闭资源"""
        self.db.close()
