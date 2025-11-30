#!/usr/bin/env python3
"""
定时任务调度器
使用schedule库实现定时执行
"""

import schedule
import time
import sys
import os
from datetime import datetime

# 添加当前目录到路径（优先）
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from fetch_news import main as fetch_news_main
from config import Config

def run_scheduler():
    """运行定时任务调度器"""
    schedule_time = Config.SCHEDULE_TIME
    
    print(f"=== RSS News Fetcher Scheduler Started ===")
    print(f"Scheduled time: {schedule_time} (daily)")
    print(f"Press Ctrl+C to stop\n")
    
    # 设置定时任务
    schedule.every().day.at(schedule_time).do(fetch_news_main)
    
    # 立即执行一次（可选）
    # fetch_news_main()
    
    # 运行调度器
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # 每分钟检查一次
    except KeyboardInterrupt:
        print("\n=== Scheduler Stopped ===")
        sys.exit(0)

if __name__ == '__main__':
    run_scheduler()

