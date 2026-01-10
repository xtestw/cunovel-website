import requests
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
        """使用DeepSeek生成日报概要（HTML格式）"""
        if not news_list:
            return ""
        
        if not self.api_key:
            print("DeepSeek API key not configured, skipping summary generation")
            return ""
        
        # 构建新闻数据，包含标题和内容
        news_data = []
        for i, news in enumerate(news_list[:20]):  # 最多20条
            title = news.get('title', '')
            content = news.get('content', '') or news.get('summary', '')
            # 限制内容长度，避免 token 过多
            if content:
                content_preview = content[:500] if len(content) > 500 else content
            else:
                content_preview = ''
            
            if language == 'zh':
                news_item = f"{i+1}. 标题：{title}"
                if content_preview:
                    news_item += f"\n   内容：{content_preview}"
            else:
                news_item = f"{i+1}. Title: {title}"
                if content_preview:
                    news_item += f"\n   Content: {content_preview}"
            news_data.append(news_item)
        
        news_text = "\n\n".join(news_data)
        
        if language == 'zh':
            prompt = f"""请根据以下AI行业新闻的标题和内容，生成一份简洁的今日AI行业动态概要（200-300字），并使用HTML格式输出：

{news_text}

要求：
1. 概括今日AI行业的主要动态和趋势
2. 语言简洁、专业、流畅
3. 突出重要新闻和行业变化
4. 使用HTML格式输出，要求：
   - 使用 <p> 标签包裹段落
   - 使用 <strong> 标签突出重要信息
   - 使用 <h3> 标签作为小标题（如果需要分类）
   - 可以使用 <ul> 和 <li> 标签组织列表（如果需要）
   - 确保HTML格式正确、完整
5. 内容结构清晰，每段表达一个主题
6. 开头可以有一个总括性的句子

示例HTML格式：
<p>今日AI行业动态显示，<strong>[总体趋势]</strong>。</p>
<h3>技术突破</h3>
<p>在技术突破方面，[重要技术新闻]。具体而言，[详细描述]。</p>
<h3>产业应用</h3>
<p>在产业应用方面，[应用相关新闻]。这表明[分析]。</p>
<h3>行业生态</h3>
<p>在行业生态方面，[生态相关新闻]。这反映了[趋势分析]。</p>

请直接输出HTML代码，不要包含任何markdown格式或其他说明文字。"""
        else:
            prompt = f"""Please generate a concise summary (200-300 words) of today's AI industry updates based on the following news titles and content, and output in HTML format:

{news_text}

Requirements:
1. Summarize the main dynamics and trends in today's AI industry
2. Use concise, professional, and fluent language
3. Highlight important news and industry changes
4. Output in HTML format with the following requirements:
   - Use <p> tags to wrap paragraphs
   - Use <strong> tags to emphasize important information
   - Use <h3> tags as subheadings (if categorization is needed)
   - You can use <ul> and <li> tags to organize lists (if needed)
   - Ensure the HTML format is correct and complete
5. Clear content structure, with each paragraph expressing one theme
6. Start with a general overview sentence

Example HTML format:
<p>Today's AI industry updates show <strong>[overall trend]</strong>.</p>
<h3>Technological Breakthroughs</h3>
<p>In terms of technological breakthroughs, [important tech news]. Specifically, [detailed description].</p>
<h3>Industry Applications</h3>
<p>In terms of industry applications, [application-related news]. This indicates [analysis].</p>
<h3>Industry Ecosystem</h3>
<p>In terms of industry ecosystem, [ecosystem-related news]. This reflects [trend analysis].</p>

Please output HTML code directly, without any markdown format or other explanatory text."""
        
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
                    'max_tokens': 1500
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
        for language in ['zh', 'en']:
            # 获取今日新闻
            news_list = self.db.get_today_news(language)
            
            if not news_list:
                print(f"No news found for {language}, skipping summary generation")
                continue
            
            # 生成概要（传递完整的新闻数据，包括title和content）
            print(f"Generating summary for {language}...")
            summary = self.generate_summary(
                [{'title': news.get('title', ''), 'content': news.get('content', ''), 'summary': news.get('summary', '')} for news in news_list],
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
