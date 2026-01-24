#!/usr/bin/env python3
"""
转换私钥格式：将 PKCS8 格式的私钥转换为 PKCS1 格式（支付宝 SDK 需要）
"""
import os
import subprocess
import tempfile
from dotenv import load_dotenv

def convert_private_key():
    """转换 .env 文件中的私钥格式"""
    load_dotenv(override=True)
    
    private_key = os.getenv('ALIPAY_APP_PRIVATE_KEY', '')
    
    if not private_key:
        print("❌ 无法从 .env 文件读取私钥")
        return False
    
    print(f"原始私钥长度: {len(private_key)} 字符")
    
    # 使用 OpenSSL 转换为 PKCS1 格式
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False) as tmp_in:
            tmp_in.write(private_key)
            tmp_in_path = tmp_in.name
        
        with tempfile.NamedTemporaryFile(mode='r', suffix='.pem', delete=False) as tmp_out:
            tmp_out_path = tmp_out.name
        
        # 使用 -traditional 选项强制输出 PKCS1 格式
        result = subprocess.run(
            ['openssl', 'rsa', '-traditional', '-in', tmp_in_path, '-out', tmp_out_path],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            with open(tmp_out_path, 'r') as f:
                converted_key = f.read()
            
            # 验证转换后的格式
            try:
                import rsa
                rsa.PrivateKey.load_pkcs1(converted_key.encode('utf-8'), format='PEM')
                print("✓ 私钥转换成功，格式验证通过（PKCS1）")
                
                # 更新 .env 文件
                env_file = '.env'
                if os.path.exists(env_file):
                    # 读取文件内容
                    with open(env_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 转义私钥内容用于 .env 文件
                    escaped_key = converted_key.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
                    
                    # 替换私钥配置
                    import re
                    pattern = r'ALIPAY_APP_PRIVATE_KEY="[^"]*"'
                    replacement = f'ALIPAY_APP_PRIVATE_KEY="{escaped_key}"'
                    
                    if re.search(pattern, content):
                        content = re.sub(pattern, replacement, content)
                    else:
                        # 如果没有找到，尝试添加引号
                        pattern2 = r'ALIPAY_APP_PRIVATE_KEY=.*?(?=\nALIPAY_|$)'
                        content = re.sub(pattern2, f'ALIPAY_APP_PRIVATE_KEY="{escaped_key}"', content, flags=re.DOTALL)
                    
                    # 写入文件
                    with open(env_file, 'w', encoding='utf-8') as f:
                        f.write(content)
                    
                    print(f"✓ 已更新 {env_file} 文件")
                    print("请重新启动服务器以加载新的私钥配置")
                    return True
                else:
                    print("✗ 转换后的私钥格式验证失败")
                    return False
            except ImportError:
                print("⚠️  rsa 库未安装，跳过格式验证")
                print("转换后的私钥已准备就绪，但无法验证格式")
                return True
            except Exception as e:
                print(f"✗ 转换后的私钥验证失败: {str(e)}")
                return False
        else:
            print(f"✗ OpenSSL 转换失败:")
            print(f"错误信息: {result.stderr}")
            return False
        
        # 清理临时文件
        os.unlink(tmp_in_path)
        os.unlink(tmp_out_path)
        
    except FileNotFoundError:
        print("✗ OpenSSL 未安装或不在 PATH 中")
        print("请安装 OpenSSL 或手动转换私钥格式")
        return False
    except Exception as e:
        print(f"✗ 转换过程出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    convert_private_key()

