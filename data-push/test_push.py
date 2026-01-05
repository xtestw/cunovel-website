#!/usr/bin/env python3
"""
测试 Google 推送功能
"""

import sys
from google_push import GooglePushService

def test_ping_sitemap():
    """测试 Ping 站点地图"""
    print("=" * 50)
    print("测试: Ping 站点地图")
    print("=" * 50)
    
    service = GooglePushService()
    success = service.ping_sitemap()
    
    if success:
        print("✓ Ping 站点地图成功")
    else:
        print("✗ Ping 站点地图失败")
    
    return success

def test_extract_urls():
    """测试从站点地图提取 URL"""
    print("\n" + "=" * 50)
    print("测试: 从站点地图提取 URL")
    print("=" * 50)
    
    service = GooglePushService()
    urls = service.extract_urls_from_sitemap()
    
    print(f"提取到 {len(urls)} 个 URL:")
    for i, url in enumerate(urls[:5], 1):  # 只显示前5个
        print(f"  {i}. {url}")
    if len(urls) > 5:
        print(f"  ... 还有 {len(urls) - 5} 个 URL")
    
    return len(urls) > 0

def test_single_url_ping():
    """测试单个 URL Ping"""
    print("\n" + "=" * 50)
    print("测试: 单个 URL Ping")
    print("=" * 50)
    
    service = GooglePushService()
    test_url = "https://cutool.online/ai-daily"
    success = service.ping_url(test_url)
    
    if success:
        print(f"✓ URL Ping 成功: {test_url}")
    else:
        print(f"✗ URL Ping 失败: {test_url}")
    
    return success

def main():
    """运行所有测试"""
    print("开始测试 Google 推送功能...\n")
    
    results = []
    
    # 测试 Ping 站点地图
    results.append(("Ping 站点地图", test_ping_sitemap()))
    
    # 测试提取 URL
    results.append(("提取站点地图 URL", test_extract_urls()))
    
    # 测试单个 URL Ping
    results.append(("单个 URL Ping", test_single_url_ping()))
    
    # 汇总结果
    print("\n" + "=" * 50)
    print("测试结果汇总")
    print("=" * 50)
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"{name}: {status}")
    
    success_count = sum(1 for _, result in results if result)
    print(f"\n总计: {success_count}/{len(results)} 通过")
    
    return 0 if success_count == len(results) else 1

if __name__ == '__main__':
    sys.exit(main())

