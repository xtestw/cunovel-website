#!/usr/bin/env python3
"""
设置 COS 中 HTML 文件的 Content-Type
使用方法: python3 scripts/set_html_content_type.py
需要环境变量: TENCENT_SECRET_ID, TENCENT_SECRET_KEY, COS_BUCKET_NAME, COS_REGION
"""

import os
import sys
from qcloud_cos import CosConfig
from qcloud_cos import CosS3Client

def main():
    # 从环境变量获取配置
    secret_id = os.environ.get('TENCENT_SECRET_ID')
    secret_key = os.environ.get('TENCENT_SECRET_KEY')
    region = os.environ.get('COS_REGION')
    bucket = os.environ.get('COS_BUCKET_NAME')
    
    if not all([secret_id, secret_key, region, bucket]):
        print("❌ 错误: 缺少必要的环境变量")
        print("需要: TENCENT_SECRET_ID, TENCENT_SECRET_KEY, COS_BUCKET_NAME, COS_REGION")
        sys.exit(1)
    
    # 初始化 COS 客户端
    config = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key)
    client = CosS3Client(config)
    
    # 查找所有 HTML 文件
    build_dir = 'build'
    if not os.path.exists(build_dir):
        build_dir = '.'
    
    html_files = []
    for root, dirs, files in os.walk(build_dir):
        for file in files:
            if file.endswith('.html'):
                local_path = os.path.join(root, file)
                # 转换为 COS 路径
                rel_path = os.path.relpath(local_path, build_dir)
                cos_path = '/' + rel_path.replace('\\', '/')
                html_files.append((local_path, cos_path))
    
    if not html_files:
        print("⚠️  未找到 HTML 文件")
        return
    
    print(f"📤 找到 {len(html_files)} 个 HTML 文件，开始更新 Content-Type...")
    
    # 更新每个 HTML 文件的 Content-Type
    success_count = 0
    for local_path, cos_path in html_files:
        try:
            # 读取文件内容
            with open(local_path, 'rb') as fp:
                file_content = fp.read()
            
            # 使用 put_object 重新上传并设置正确的 Content-Type
            # ContentType 应该作为直接参数，不是 Metadata
            response = client.put_object(
                Bucket=bucket,
                Body=file_content,
                Key=cos_path,
                ContentType='text/html; charset=utf-8'
            )
            print(f"✅ {cos_path}")
            success_count += 1
        except Exception as e:
            print(f"❌ 失败 {cos_path}: {e}")
    
    print(f"\n✅ 完成! 成功更新 {success_count}/{len(html_files)} 个文件")

if __name__ == '__main__':
    main()

