#!/bin/bash

# 阿里云 OSS 部署脚本
# 使用方法：
# 1. 安装 ossutil: https://help.aliyun.com/document_detail/120075.html
# 2. 配置 ossutil: ossutil config
# 3. 运行脚本: ./scripts/deploy-to-oss.sh

set -e

echo "=== 开始部署到阿里云 OSS ==="
echo ""

# 检查是否已构建
if [ ! -d "build" ]; then
    echo "❌ build 目录不存在，开始构建..."
    npm run build
fi

# 检查 ossutil 是否安装
if ! command -v ossutil &> /dev/null; then
    echo "❌ ossutil 未安装"
    echo "请访问: https://help.aliyun.com/document_detail/120075.html"
    exit 1
fi

# 检查环境变量
if [ -z "$OSS_BUCKET_NAME" ]; then
    echo "❌ 请设置环境变量 OSS_BUCKET_NAME"
    echo "例如: export OSS_BUCKET_NAME=cutool-web"
    exit 1
fi

echo "📦 上传 build 目录到 OSS..."
echo ""

# 同步上传
# -r: 递归上传
# --update: 只上传更新的文件
# build/: 本地目录
# oss://bucket-name/: OSS 路径
ossutil cp -r --update build/ oss://$OSS_BUCKET_NAME/

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 下一步："
echo "1. 在阿里云 CDN 控制台刷新缓存"
echo "2. 访问网站检查是否正常"
echo ""

