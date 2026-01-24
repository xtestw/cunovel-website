#!/usr/bin/env python3
"""
修复 .env 文件中的密钥格式
将多行密钥转换为单行格式（使用 \n 转义符）
"""
import os
import re
import shutil
from datetime import datetime

def fix_env_keys():
    """修复 .env 文件中的密钥格式"""
    env_file = '.env'
    backup_file = f'.env.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    
    if not os.path.exists(env_file):
        print(f"错误: {env_file} 文件不存在")
        return False
    
    # 备份原文件
    shutil.copy(env_file, backup_file)
    print(f"已备份原文件到: {backup_file}")
    
    # 读取文件内容
    with open(env_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取私钥内容（多行）
    private_key_match = re.search(
        r'ALIPAY_APP_PRIVATE_KEY=(.*?)(?=ALIPAY_PUBLIC_KEY=|$)',
        content,
        re.DOTALL
    )
    
    # 提取公钥内容（多行）
    public_key_match = re.search(
        r'ALIPAY_PUBLIC_KEY=(.*?)(?=ALIPAY_|$)',
        content,
        re.DOTALL
    )
    
    # 处理私钥
    if private_key_match:
        private_key_raw = private_key_match.group(1).strip()
        # 清理私钥内容
        private_key_lines = []
        for line in private_key_raw.split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                private_key_lines.append(line)
        
        private_key_content = '\n'.join(private_key_lines)
        # 转义换行符和引号
        private_key_escaped = private_key_content.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
        # 替换为单行格式
        content = re.sub(
            r'ALIPAY_APP_PRIVATE_KEY=.*?(?=ALIPAY_PUBLIC_KEY=|$)',
            f'ALIPAY_APP_PRIVATE_KEY="{private_key_escaped}"',
            content,
            flags=re.DOTALL
        )
        print(f"✓ 已修复私钥格式（长度: {len(private_key_content)} 字符）")
    
    # 处理公钥
    if public_key_match:
        public_key_raw = public_key_match.group(1).strip()
        # 清理公钥内容
        public_key_lines = []
        for line in public_key_raw.split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                public_key_lines.append(line)
        
        public_key_content = '\n'.join(public_key_lines)
        # 转义换行符和引号
        public_key_escaped = public_key_content.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
        # 替换为单行格式
        content = re.sub(
            r'ALIPAY_PUBLIC_KEY=.*?(?=ALIPAY_|$)',
            f'ALIPAY_PUBLIC_KEY="{public_key_escaped}"',
            content,
            flags=re.DOTALL
        )
        print(f"✓ 已修复公钥格式（长度: {len(public_key_content)} 字符）")
    
    # 写入修复后的内容
    with open(env_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✓ 已修复 {env_file} 文件")
    print("请重新启动服务器以加载新的配置")
    return True

if __name__ == '__main__':
    fix_env_keys()

