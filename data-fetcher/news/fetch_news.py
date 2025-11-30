#!/usr/bin/env python3
"""
RSS新闻抓取主脚本
每天早上8:30执行，从RSS订阅源获取最新新闻并写入数据库
"""

import sys
import os
from datetime import datetime

# 添加当前目录到路径（优先）
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from rss_fetcher import RSSFetcher
from summary_generator import SummaryGenerator
from config import Config

def main():
    print(f"=== RSS News Fetcher Started at {datetime.now()} ===")
    
    # 抓取RSS新闻
    fetcher = RSSFetcher()
    try:
        all_news = fetcher.fetch_all_feeds()
        print(f"\n✓ Fetched news: {len(all_news.get('zh', []))} Chinese, {len(all_news.get('en', []))} English")
    except Exception as e:
        print(f"✗ Error fetching news: {str(e)}")
        return
    finally:
        fetcher.close()
    
    # 生成日报概要
    generator = SummaryGenerator()
    try:
        generator.update_daily_summaries()
        print("\n✓ Summary generation completed")
    except Exception as e:
        print(f"✗ Error generating summary: {str(e)}")
    finally:
        generator.close()
    
    print(f"=== RSS News Fetcher Completed at {datetime.now()} ===\n")

if __name__ == '__main__':
    main()

