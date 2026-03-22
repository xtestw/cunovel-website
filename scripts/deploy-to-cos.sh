#!/bin/bash

# 腾讯云 COS 部署脚本
# 使用方法：
# 1. 安装 coscmd: pip install coscmd
# 2. 配置 coscmd: coscmd config -a <SecretId> -s <SecretKey> -b <BucketName> -r <Region>
# 3. 运行脚本: ./scripts/deploy-to-cos.sh

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== 开始部署到腾讯云 COS ==="
echo ""

# 检查是否已静态导出（Next.js → out/）
if [ ! -d "out" ]; then
    echo "❌ out 目录不存在，开始执行静态构建..."
    npm run build:static
fi
STATIC_DIR="out"

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

echo "📦 上传 $STATIC_DIR 目录到 COS..."
echo ""

cd "$STATIC_DIR"

# 上传所有文件到根目录，并设置正确的 Content-Type
# -r: 递归上传
# -s: 同步上传（跳过已存在的相同文件）
# --header: 设置 HTTP 头，确保 HTML 文件正确显示
# ./ : 当前目录
# / : COS 根目录

# 先上传 HTML 文件，设置正确的 Content-Type
echo "📤 上传 HTML 文件..."
find . -name "*.html" -type f | while read file; do
    rel_path="${file#./}"
    coscmd upload "$file" "/$rel_path" --header "Content-Type:text/html; charset=utf-8"
done

# 其余文件：先 wasm 再大文件易触发 UserNetworkTooSlow，见 scripts/cos-sync-out.sh
echo "📤 同步其余文件（含重试）..."
bash "$REPO_ROOT/scripts/cos-sync-out.sh"

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 下一步："
echo "1. 在腾讯云 CDN 控制台刷新缓存"
echo "2. 访问网站检查是否正常"
echo ""

