#!/usr/bin/env python3
"""
Google Search Console URL 推送工具
支持多种推送方式：
1. Google Indexing API（推荐）- 实时推送单个 URL
2. Google Search Console API - 批量提交 URL
3. Ping 方式 - 简单的通知方式
"""

import os
import sys
import json
import logging
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Optional
from config import Config

# 配置日志
os.makedirs(Config.LOG_DIR, exist_ok=True)
log_file = os.path.join(Config.LOG_DIR, f'google_push_{datetime.now().strftime("%Y%m%d")}.log')
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class GooglePushService:
    """Google Search Console 推送服务"""
    
    def __init__(self):
        self.config = Config
        self.site_url = self.config.GOOGLE_SITE_URL
        
    def ping_sitemap(self, sitemap_url: Optional[str] = None) -> bool:
        """
        使用 Ping 方式通知 Google 站点地图更新
        这是最简单的方式，不需要 API 密钥
        """
        if sitemap_url is None:
            sitemap_url = self.config.SITEMAP_URL
        
        ping_urls = [
            f'https://www.google.com/ping?sitemap={sitemap_url}',
            f'https://www.google.com/webmasters/sitemaps/ping?sitemap={sitemap_url}',
        ]
        
        success_count = 0
        for ping_url in ping_urls:
            try:
                response = requests.get(ping_url, timeout=10)
                if response.status_code == 200:
                    logger.info(f'✓ Ping 成功: {ping_url}')
                    success_count += 1
                else:
                    logger.warning(f'✗ Ping 失败: {ping_url}, 状态码: {response.status_code}')
            except Exception as e:
                logger.error(f'✗ Ping 异常: {ping_url}, 错误: {str(e)}')
        
        return success_count > 0
    
    def ping_url(self, url: str) -> bool:
        """
        使用 Ping 方式通知 Google 单个 URL
        """
        ping_urls = [
            f'https://www.google.com/ping?sitemap={url}',
        ]
        
        for ping_url in ping_urls:
            try:
                response = requests.get(ping_url, timeout=10)
                if response.status_code == 200:
                    logger.info(f'✓ URL Ping 成功: {url}')
                    return True
            except Exception as e:
                logger.error(f'✗ URL Ping 异常: {url}, 错误: {str(e)}')
        
        return False
    
    def push_with_indexing_api(self, urls: List[str]) -> Dict[str, bool]:
        """
        使用 Google Indexing API 推送 URL（需要服务账号）
        这是最推荐的方式，可以实时推送单个 URL
        """
        if not self.config.GOOGLE_SERVICE_ACCOUNT_FILE:
            logger.error('未配置 GOOGLE_SERVICE_ACCOUNT_FILE，无法使用 Indexing API')
            return {}
        
        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build
            from googleapiclient.errors import HttpError
            
            # 加载服务账号凭据
            credentials = service_account.Credentials.from_service_account_file(
                self.config.GOOGLE_SERVICE_ACCOUNT_FILE,
                scopes=['https://www.googleapis.com/auth/indexing']
            )
            
            # 构建服务
            service = build('indexing', 'v3', credentials=credentials)
            
            results = {}
            for url in urls:
                try:
                    # 构建请求体
                    request_body = {
                        'url': url,
                        'type': 'URL_UPDATED'  # 或 'URL_DELETED'
                    }
                    
                    # 发送请求
                    response = service.urlNotifications().publish(body=request_body).execute()
                    logger.info(f'✓ Indexing API 推送成功: {url}')
                    results[url] = True
                    
                except HttpError as e:
                    logger.error(f'✗ Indexing API 推送失败: {url}, 错误: {str(e)}')
                    results[url] = False
                except Exception as e:
                    logger.error(f'✗ Indexing API 推送异常: {url}, 错误: {str(e)}')
                    results[url] = False
            
            return results
            
        except ImportError:
            logger.error('缺少 google-api-python-client 或 google-auth 库，请安装: pip install google-api-python-client google-auth')
            return {}
        except Exception as e:
            logger.error(f'Indexing API 初始化失败: {str(e)}')
            return {}
    
    def push_with_search_console_api(self, urls: List[str]) -> Dict[str, bool]:
        """
        使用 Google Search Console API 批量提交 URL（需要 OAuth 或服务账号）
        """
        if not self.config.GOOGLE_SERVICE_ACCOUNT_FILE and not self.config.GOOGLE_CLIENT_ID:
            logger.error('未配置 Google 凭据，无法使用 Search Console API')
            return {}
        
        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build
            from googleapiclient.errors import HttpError
            
            # 使用服务账号
            if self.config.GOOGLE_SERVICE_ACCOUNT_FILE:
                credentials = service_account.Credentials.from_service_account_file(
                    self.config.GOOGLE_SERVICE_ACCOUNT_FILE,
                    scopes=['https://www.googleapis.com/auth/webmasters']
                )
            else:
                # 使用 OAuth 2.0（需要实现刷新令牌逻辑）
                logger.error('OAuth 2.0 方式暂未实现，请使用服务账号')
                return {}
            
            # 构建服务
            service = build('searchconsole', 'v1', credentials=credentials)
            
            # 批量提交 URL
            try:
                # 提取域名（去掉 https://）
                site_property = self.site_url.replace('https://', '').replace('http://', '')
                
                # 构建请求体
                request_body = {
                    'inspectionUrl': urls[0] if urls else self.site_url
                }
                
                # 注意：Search Console API 主要用于查询，不是推送
                # 实际推送应该使用 Indexing API 或 sitemap
                logger.warning('Search Console API 主要用于查询，建议使用 Indexing API 或 Ping 方式')
                return {}
                
            except HttpError as e:
                logger.error(f'Search Console API 调用失败: {str(e)}')
                return {}
                
        except ImportError:
            logger.error('缺少 google-api-python-client 或 google-auth 库')
            return {}
        except Exception as e:
            logger.error(f'Search Console API 初始化失败: {str(e)}')
            return {}
    
    def extract_urls_from_sitemap(self, sitemap_url: Optional[str] = None) -> List[str]:
        """
        从站点地图中提取所有 URL
        """
        if sitemap_url is None:
            sitemap_url = self.config.SITEMAP_URL
        
        try:
            response = requests.get(sitemap_url, timeout=10)
            response.raise_for_status()
            
            # 解析 XML
            root = ET.fromstring(response.content)
            
            # 定义命名空间
            ns = {'sitemap': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            
            urls = []
            for url_elem in root.findall('sitemap:url', ns):
                loc_elem = url_elem.find('sitemap:loc', ns)
                if loc_elem is not None and loc_elem.text:
                    urls.append(loc_elem.text.strip())
            
            logger.info(f'从站点地图提取到 {len(urls)} 个 URL')
            return urls
            
        except Exception as e:
            logger.error(f'提取站点地图 URL 失败: {str(e)}')
            return []
    
    def push_urls(self, urls: Optional[List[str]] = None, method: Optional[str] = None) -> Dict[str, bool]:
        """
        推送 URL 列表
        """
        if method is None:
            method = self.config.PUSH_METHOD
        
        if urls is None:
            # 如果没有提供 URL，从站点地图提取
            urls = self.extract_urls_from_sitemap()
        
        if not urls:
            logger.warning('没有要推送的 URL')
            return {}
        
        logger.info(f'开始推送 {len(urls)} 个 URL，使用方式: {method}')
        
        if method == 'indexing_api':
            return self.push_with_indexing_api(urls)
        elif method == 'search_console_api':
            return self.push_with_search_console_api(urls)
        elif method == 'ping':
            # Ping 方式主要用于站点地图
            success = self.ping_sitemap()
            return {url: success for url in urls}
        else:
            logger.error(f'未知的推送方式: {method}')
            return {}


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Google Search Console URL 推送工具')
    parser.add_argument('--urls', nargs='+', help='要推送的 URL 列表')
    parser.add_argument('--sitemap', help='站点地图 URL')
    parser.add_argument('--method', choices=['ping', 'indexing_api', 'search_console_api'], 
                       help='推送方式（默认从配置读取）')
    parser.add_argument('--single-url', help='推送单个 URL（使用 ping 方式）')
    
    args = parser.parse_args()
    
    service = GooglePushService()
    
    if args.single_url:
        # 推送单个 URL
        success = service.ping_url(args.single_url)
        sys.exit(0 if success else 1)
    elif args.sitemap:
        # 推送站点地图
        success = service.ping_sitemap(args.sitemap)
        sys.exit(0 if success else 1)
    elif args.urls:
        # 推送指定的 URL 列表
        results = service.push_urls(args.urls, args.method)
        success_count = sum(1 for v in results.values() if v)
        logger.info(f'推送完成: {success_count}/{len(results)} 成功')
        sys.exit(0 if success_count == len(results) else 1)
    else:
        # 默认：从站点地图提取并推送
        results = service.push_urls(method=args.method)
        success_count = sum(1 for v in results.values() if v)
        logger.info(f'推送完成: {success_count}/{len(results)} 成功')
        sys.exit(0 if success_count > 0 else 1)


if __name__ == '__main__':
    main()

