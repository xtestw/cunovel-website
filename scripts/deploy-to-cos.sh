#!/bin/bash

# 腾讯云 COS 部署脚本
# 使用方法：
# 1. 安装 coscmd: pip install coscmd
# 2. 配置 coscmd: coscmd config -a <SecretId> -s <SecretKey> -b <BucketName> -r <Region>
# 3. 运行脚本: ./scripts/deploy-to-cos.sh

set -e

echo "=== 开始部署到腾讯云 COS ==="
echo ""

# 检查是否已构建
if [ ! -d "build" ]; then
    echo "❌ build 目录不存在，开始构建..."
    npm run build
fi

# 检查 coscmd 是否安装
if ! command -v coscmd &> /dev/null; then
    echo "❌ coscmd 未安装"
    echo "请运行: pip install coscmd"
    exit 1
fi

# 检查是否已配置
if ! coscmd info &> /dev/null; then
    echo "❌ coscmd 未配置"
    echo "请运行: coscmd config -a <SecretId> -s <SecretKey> -b <BucketName> -r <Region>"
    exit 1
fi

echo "📦 上传 build 目录到 COS..."
echo ""

# 进入 build 目录
cd build

# 上传所有文件到根目录
# -r: 递归上传
# -s: 同步上传（跳过已存在的相同文件）
# ./ : 当前目录
# / : COS 根目录
coscmd upload -rs ./ /

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 下一步："
echo "1. 在腾讯云 CDN 控制台刷新缓存"
echo "2. 访问网站检查是否正常"
echo ""

