#!/bin/bash

# 403 错误诊断脚本
# 用于快速排查 CDN 403 错误

DOMAIN="cutool.online"
COS_URL="https://cutool-1254002056.cos-website.ap-guangzhou.myqcloud.com"

echo "=== 403 错误诊断：$DOMAIN ==="
echo ""

# 1. 测试直接访问 COS
echo "1. 测试直接访问 COS 静态网站："
echo "----------------------------------------"
COS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$COS_URL" 2>&1)
if [ "$COS_STATUS" = "200" ]; then
    echo "✅ COS 访问正常 (HTTP $COS_STATUS)"
    echo "   说明 COS 配置正确，问题可能在 CDN 配置"
elif [ "$COS_STATUS" = "403" ]; then
    echo "❌ COS 也返回 403 (HTTP $COS_STATUS)"
    echo "   说明是 COS 权限问题，请检查存储桶权限"
elif [ "$COS_STATUS" = "000" ]; then
    echo "⚠️  无法连接到 COS (超时或连接失败)"
else
    echo "⚠️  COS 返回 HTTP $COS_STATUS"
fi
echo ""

# 2. 测试 CDN 访问
echo "2. 测试 CDN 访问："
echo "----------------------------------------"
CDN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "https://$DOMAIN" 2>&1)
CDN_HEADERS=$(curl -sI --connect-timeout 10 "https://$DOMAIN" 2>&1)

if [ "$CDN_STATUS" = "200" ]; then
    echo "✅ CDN 访问正常 (HTTP $CDN_STATUS)"
elif [ "$CDN_STATUS" = "403" ]; then
    echo "❌ CDN 返回 403 Forbidden"
    echo ""
    echo "   响应头信息："
    echo "$CDN_HEADERS" | head -10
    echo ""
    echo "   可能的原因："
    echo "   1. CDN 访问控制规则（IP 黑白名单、Referer 防盗链等）"
    echo "   2. CDN 域名未通过审核或已关闭"
    echo "   3. CDN 回源配置错误"
elif [ "$CDN_STATUS" = "000" ]; then
    echo "⚠️  无法连接到 CDN (超时或连接失败)"
else
    echo "⚠️  CDN 返回 HTTP $CDN_STATUS"
    echo ""
    echo "   响应头信息："
    echo "$CDN_HEADERS" | head -10
fi
echo ""

# 3. 检查 DNS 解析
echo "3. 检查 DNS 解析："
echo "----------------------------------------"
DNS_RESULT=$(nslookup $DOMAIN 2>&1)
echo "$DNS_RESULT" | head -10

if echo "$DNS_RESULT" | grep -qi "cdn\|dnsv1\|qcloud"; then
    echo "✅ DNS 已解析到腾讯云 CDN"
else
    echo "⚠️  DNS 可能未解析到 CDN"
fi
echo ""

# 4. 检查响应头中的 CDN 标识
echo "4. 检查 CDN 响应头："
echo "----------------------------------------"
if echo "$CDN_HEADERS" | grep -qi "server.*Tengine\|x-cache\|cdn"; then
    echo "✅ 检测到 CDN 响应头（CDN 已生效）"
    echo "$CDN_HEADERS" | grep -i "server\|x-cache\|cdn" | head -5
else
    echo "⚠️  未检测到明显的 CDN 响应头"
fi
echo ""

# 5. 诊断建议
echo "=== 诊断建议 ==="
echo ""

if [ "$COS_STATUS" = "200" ] && [ "$CDN_STATUS" = "403" ]; then
    echo "🔍 问题定位：CDN 配置问题"
    echo ""
    echo "请检查以下 CDN 配置："
    echo "1. CDN 控制台 > 访问控制："
    echo "   - 检查 IP 黑白名单是否阻止了访问"
    echo "   - 检查 Referer 防盗链是否配置正确"
    echo "   - 检查地区访问限制"
    echo ""
    echo "2. CDN 控制台 > 基础配置："
    echo "   - 确认域名状态为「已启动」"
    echo "   - 检查源站配置是否正确"
    echo ""
    echo "3. CDN 控制台 > 回源配置："
    echo "   - 检查回源 Host 是否设置为 COS 存储桶地址"
    echo "   - 检查回源协议配置"
    
elif [ "$COS_STATUS" = "403" ]; then
    echo "🔍 问题定位：COS 权限问题"
    echo ""
    echo "请检查 COS 配置："
    echo "1. COS 控制台 > 存储桶 > 权限管理："
    echo "   - 存储桶访问权限必须为「公有读私有写」"
    echo ""
    echo "2. COS 控制台 > 存储桶 > 基础配置："
    echo "   - 确认静态网站托管已开启"
    
else
    echo "🔍 需要进一步排查"
    echo ""
    echo "建议："
    echo "1. 检查 CDN 域名是否已通过审核"
    echo "2. 检查 DNS 解析是否正确"
    echo "3. 等待几分钟后重试（配置可能需要时间生效）"
fi

echo ""
echo "📚 详细排查步骤请参考：docs/COS_ACCESS_DENIED_FIX.md"




