#!/bin/bash

# 支付链路测试脚本
# 用于测试整个支付流程，包括订单创建、支付回调、状态更新和查询执行

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
API_BASE_URL="${API_BASE_URL:-http://localhost:3003}"
ORDER_ID=""

echo -e "${GREEN}=== 支付链路测试脚本 ===${NC}\n"

# 函数：打印帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help              显示帮助信息"
    echo "  -u, --url URL           设置API基础URL（默认: http://localhost:3003）"
    echo "  -o, --order-id ORDER_ID  直接测试指定订单（跳过创建订单步骤）"
    echo "  -t, --type TYPE         核验类型（consistency, basicInfo, insuranceLog, mobile2Meta, mobile3Meta, mobileOnlineTime, bankCardVerify）"
    echo ""
    echo "示例:"
    echo "  $0                                    # 交互式测试"
    echo "  $0 -o VH2024120112000012345678      # 测试指定订单"
    echo "  $0 -t mobile2Meta                    # 测试手机号二要素核验"
    echo ""
}

# 函数：创建测试订单
create_test_order() {
    local verify_type=$1
    local form_data=$2
    local amount=$3
    
    echo -e "${YELLOW}步骤 1: 创建测试订单...${NC}"
    
    # 根据类型设置表单数据
    case $verify_type in
        mobile2Meta)
            if [ -z "$form_data" ]; then
                form_data='{"mobile":"13800138000","name":"测试用户"}'
            fi
            ;;
        mobile3Meta)
            if [ -z "$form_data" ]; then
                form_data='{"mobile":"13800138000","name":"测试用户","idCard":"110101199001011234"}'
            fi
            ;;
        mobileOnlineTime)
            if [ -z "$form_data" ]; then
                form_data='{"mobile":"13800138000"}'
            fi
            ;;
        consistency)
            if [ -z "$form_data" ]; then
                form_data='{"name":"测试用户","plateNumber":"京A12345"}'
            fi
            ;;
        basicInfo)
            if [ -z "$form_data" ]; then
                form_data='{"plateNumber":"京A12345"}'
            fi
            ;;
        insuranceLog)
            if [ -z "$form_data" ]; then
                form_data='{"plateNumber":"京A12345"}'
            fi
            ;;
        bankCardVerify)
            if [ -z "$form_data" ]; then
                form_data='{"bankCard":"6222021234567890","name":"测试用户","idCard":"110101199001011234"}'
            fi
            ;;
        *)
            echo -e "${RED}不支持的核验类型: $verify_type${NC}"
            exit 1
            ;;
    esac
    
    # 创建订单
    response=$(curl -s -X POST "${API_BASE_URL}/api/vehicle-verify/create-order" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"${verify_type}\",
            \"data\": ${form_data},
            \"amount\": ${amount:-null}
        }")
    
    # 检查响应
    if echo "$response" | grep -q "orderId"; then
        ORDER_ID=$(echo "$response" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✓ 订单创建成功: ${ORDER_ID}${NC}"
        echo "  响应: $response" | head -c 200
        echo ""
        return 0
    else
        echo -e "${RED}✗ 订单创建失败${NC}"
        echo "  响应: $response"
        return 1
    fi
}

# 函数：模拟支付回调
simulate_payment() {
    local order_id=$1
    local trade_status=${2:-TRADE_SUCCESS}
    
    echo -e "${YELLOW}步骤 2: 模拟支付回调...${NC}"
    
    response=$(curl -s -X POST "${API_BASE_URL}/api/test/simulate-payment" \
        -H "Content-Type: application/json" \
        -d "{
            \"order_id\": \"${order_id}\",
            \"trade_no\": \"TEST$(date +%Y%m%d%H%M%S)$(openssl rand -hex 4 | tr '[:lower:]' '[:upper:]')\",
            \"trade_status\": \"${trade_status}\"
        }")
    
    # 检查响应
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ 支付回调模拟成功${NC}"
        echo "  响应: $response" | head -c 300
        echo ""
        
        # 检查查询结果
        if echo "$response" | grep -q '"has_result":true'; then
            echo -e "${GREEN}✓ 查询已自动执行并保存结果${NC}"
        else
            echo -e "${YELLOW}⚠ 查询结果为空（可能是表单数据问题或API调用失败）${NC}"
        fi
        return 0
    else
        echo -e "${RED}✗ 支付回调模拟失败${NC}"
        echo "  响应: $response"
        return 1
    fi
}

# 函数：检查订单状态
check_order_status() {
    local order_id=$1
    
    echo -e "${YELLOW}步骤 3: 检查订单状态...${NC}"
    
    response=$(curl -s "${API_BASE_URL}/api/vehicle-verify/order/${order_id}")
    
    if echo "$response" | grep -q '"orderId"'; then
        status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        trade_status=$(echo "$response" | grep -o '"tradeStatus":"[^"]*"' | cut -d'"' -f4)
        has_result=$(echo "$response" | grep -o '"resultData":[^,}]*' | grep -v null)
        
        echo -e "${GREEN}✓ 订单状态: ${status}${NC}"
        echo -e "  交易状态: ${trade_status}"
        if [ -n "$has_result" ]; then
            echo -e "${GREEN}✓ 查询结果已保存${NC}"
        else
            echo -e "${YELLOW}⚠ 查询结果为空${NC}"
        fi
        return 0
    else
        echo -e "${RED}✗ 无法获取订单信息${NC}"
        echo "  响应: $response"
        return 1
    fi
}

# 主函数
main() {
    local verify_type=""
    local skip_create=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -u|--url)
                API_BASE_URL="$2"
                shift 2
                ;;
            -o|--order-id)
                ORDER_ID="$2"
                skip_create=true
                shift 2
                ;;
            -t|--type)
                verify_type="$2"
                shift 2
                ;;
            *)
                echo -e "${RED}未知参数: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 如果指定了订单ID，直接测试
    if [ -n "$ORDER_ID" ]; then
        echo -e "${GREEN}使用指定订单: ${ORDER_ID}${NC}\n"
        simulate_payment "$ORDER_ID"
        check_order_status "$ORDER_ID"
        exit $?
    fi
    
    # 交互式选择核验类型
    if [ -z "$verify_type" ]; then
        echo "请选择核验类型:"
        echo "  1) 手机号二要素核验 (mobile2Meta)"
        echo "  2) 手机号三要素核验 (mobile3Meta)"
        echo "  3) 手机号在网状态查询 (mobileOnlineTime)"
        echo "  4) 车辆信息一致性核验 (consistency)"
        echo "  5) 车辆基本信息查询 (basicInfo)"
        echo "  6) 车辆投保日志查询 (insuranceLog)"
        echo "  7) 银行卡核验 (bankCardVerify)"
        echo -n "请输入选项 (1-7): "
        read choice
        
        case $choice in
            1) verify_type="mobile2Meta" ;;
            2) verify_type="mobile3Meta" ;;
            3) verify_type="mobileOnlineTime" ;;
            4) verify_type="consistency" ;;
            5) verify_type="basicInfo" ;;
            6) verify_type="insuranceLog" ;;
            7) verify_type="bankCardVerify" ;;
            *)
                echo -e "${RED}无效选项${NC}"
                exit 1
                ;;
        esac
    fi
    
    echo -e "\n${GREEN}开始测试: ${verify_type}${NC}\n"
    
    # 创建订单
    if ! create_test_order "$verify_type" "" ""; then
        exit 1
    fi
    
    # 等待一下
    sleep 1
    
    # 模拟支付回调
    if ! simulate_payment "$ORDER_ID"; then
        exit 1
    fi
    
    # 等待一下
    sleep 1
    
    # 检查订单状态
    check_order_status "$ORDER_ID"
    
    echo -e "\n${GREEN}=== 测试完成 ===${NC}"
    echo -e "订单ID: ${ORDER_ID}"
    echo -e "查看订单详情: ${API_BASE_URL}/api/vehicle-verify/order/${ORDER_ID}"
}

# 运行主函数
main "$@"

