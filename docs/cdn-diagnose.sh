#!/bin/bash

# CDN 配置诊断脚本
# 用于检查腾讯云 CDN 配置是否正确

DOMAIN="cutool.online"
echo "=== CDN 配置诊断：$DOMAIN ==="
echo ""

# 1. 检查 DNS 解析
echo "1. 检查 DNS 解析："
echo "----------------------------------------"
DNS_RESULT=$(nslookup $DOMAIN 2>&1)
echo "$DNS_RESULT"
echo ""

# 检查是否解析到 CDN
if echo "$DNS_RESULT" | grep -qi "cdn\|dnsv1\|qcloud"; then
    echo "✅ DNS 已解析到腾讯云 CDN"
else
    echo "❌ DNS 可能未解析到 CDN，请检查 DNS 配置"
fi
echo ""

# 2. 检查 HTTP 访问
echo "2. 检查 HTTP 访问："
echo "----------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://$DOMAIN 2>&1)
if [ "$HTTP_CODE" = "000" ]; then
    echo "❌ 无法连接到 $DOMAIN (超时或连接失败)"
elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ HTTP 返回 $HTTP_CODE (重定向到 HTTPS，正常)"
else
    echo "⚠️  HTTP 返回状态码: $HTTP_CODE"
fi
echo ""

# 3. 检查 HTTPS 访问
echo "3. 检查 HTTPS 访问："
echo "----------------------------------------"
HTTPS_RESPONSE=$(curl -sI --connect-timeout 10 https://$DOMAIN 2>&1)
HTTPS_CODE=$(echo "$HTTPS_RESPONSE" | head -1 | grep -oP '\d{3}')

if [ -z "$HTTPS_CODE" ]; then
    echo "❌ 无法连接到 HTTPS (可能是证书问题或连接超时)"
    echo "错误信息："
    echo "$HTTPS_RESPONSE" | head -5
else
    echo "✅ HTTPS 返回状态码: $HTTPS_CODE"
    
    # 检查响应头
    echo ""
    echo "响应头信息："
    echo "$HTTPS_RESPONSE" | head -15
    echo ""
    
    # 检查 CDN 标识
    if echo "$HTTPS_RESPONSE" | grep -qi "server.*Tengine\|x-cache\|cdn"; then
        echo "✅ 检测到 CDN 响应头（CDN 可能已生效）"
    else
        echo "⚠️  未检测到明显的 CDN 响应头"
    fi
fi
echo ""

# 4. 检查 SSL 证书
echo "4. 检查 SSL 证书："
echo "----------------------------------------"
CERT_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ -n "$CERT_INFO" ]; then
    echo "✅ SSL 证书信息："
    echo "$CERT_INFO"
else
    echo "❌ 无法获取 SSL 证书信息"
fi
echo ""

# 5. 检查响应时间
echo "5. 检查响应时间："
echo "----------------------------------------"
TIME_TOTAL=$(curl -s -o /dev/null -w "%{time_total}" --connect-timeout 10 https://$DOMAIN 2>&1)
if [ "$TIME_TOTAL" != "0.000" ] && [ -n "$TIME_TOTAL" ]; then
    echo "响应时间: ${TIME_TOTAL} 秒"
    TIME_MS=$(echo "$TIME_TOTAL * 1000" | bc | cut -d. -f1)
    if [ "$TIME_MS" -lt 500 ]; then
        echo "✅ 响应速度良好"
    elif [ "$TIME_MS" -lt 2000 ]; then
        echo "⚠️  响应速度一般"
    else
        echo "❌ 响应速度较慢"
    fi
else
    echo "❌ 无法测试响应时间"
fi
echo ""

# 6. 总结和建议
echo "=== 诊断总结 ==="
echo ""
echo "请检查以下配置："
echo "1. DNS 解析是否指向腾讯云 CDN 的 CNAME"
echo "2. 腾讯云 CDN 控制台中："
echo "   - 源站地址是否填写了 Vercel 项目域名（xxx.vercel.app）"
echo "   - 回源 Host 是否与源站地址一致"
echo "   - 回源协议是否设置为 HTTPS"
echo "   - HTTPS 证书是否已配置"
echo "   - 域名状态是否为「已启动」"
echo ""
echo "如果问题仍然存在，请查看 docs/CDN_SETUP_GUIDE.md 中的详细故障排查指南"

