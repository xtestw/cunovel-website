#!/bin/bash

# 快速修复 HTML 文件 Content-Type 的脚本
# 使用方法：./scripts/fix-html-content-type.sh

set -e

echo "=== 修复 HTML 文件 Content-Type ==="
echo ""

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

echo "📤 重新上传 HTML 文件并设置正确的 Content-Type..."
echo ""

STATIC_DIR="${STATIC_EXPORT_DIR:-out}"
if [ ! -d "$STATIC_DIR" ]; then
    echo "❌ 目录不存在: $STATIC_DIR"
    echo "请先运行: npm run build:static"
    exit 1
fi

cd "$STATIC_DIR"

# 查找所有 HTML 文件并重新上传
find . -name "*.html" -type f | while read file; do
    rel_path="${file#./}"
    echo "  上传: $rel_path"
    coscmd upload "$file" "/$rel_path" --header "Content-Type:text/html; charset=utf-8"
done

echo ""
echo "✅ 修复完成！"
echo ""
echo "📝 现在可以访问网站测试："
echo "   https://cutool-1254002056.cos-website.ap-guangzhou.myqcloud.com"
echo ""




