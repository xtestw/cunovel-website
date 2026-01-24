#!/bin/bash
# 测试车辆核验 API 端点
# 需要先启动服务器: python3 app.py

API_BASE="http://localhost:3003/api/vehicle-verify"

echo "=========================================="
echo "测试车辆核验 API 端点"
echo "=========================================="
echo ""

# 检查服务器是否运行
if ! curl -s "$API_BASE/../health" > /dev/null 2>&1; then
    echo "❌ 服务器未运行，请先启动服务器:"
    echo "   cd server && python3 app.py"
    exit 1
fi

echo "✓ 服务器运行中"
echo ""

# 测试1: 一致性核验（二要素）
echo "=========================================="
echo "测试1: 一致性核验（二要素）"
echo "=========================================="
curl -X POST "$API_BASE/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "consistency",
    "data": {
      "name": "张三",
      "idCard": "",
      "plateNumber": "京A12345",
      "vehicleType": "02"
    },
    "orderId": "TEST_ORDER_001"
  }' | jq .
echo ""

# 测试2: 一致性核验（三要素）
echo "=========================================="
echo "测试2: 一致性核验（三要素）"
echo "=========================================="
curl -X POST "$API_BASE/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "consistency",
    "data": {
      "name": "张三",
      "idCard": "110101199001011234",
      "plateNumber": "京A12345",
      "vehicleType": "02"
    },
    "orderId": "TEST_ORDER_002"
  }' | jq .
echo ""

# 测试3: 基本信息查询
echo "=========================================="
echo "测试3: 基本信息查询"
echo "=========================================="
curl -X POST "$API_BASE/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "basicInfo",
    "data": {
      "plateNumber": "京A12345",
      "vehicleType": "02"
    },
    "orderId": "TEST_ORDER_003"
  }' | jq .
echo ""

# 测试4: 投保日志查询
echo "=========================================="
echo "测试4: 投保日志查询"
echo "=========================================="
curl -X POST "$API_BASE/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "insuranceLog",
    "data": {
      "plateNumber": "京A12345",
      "vehicleType": "02",
      "vin": "LSGBF53M8DS123456"
    },
    "orderId": "TEST_ORDER_004"
  }' | jq .
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="

