#!/bin/bash

# CuTool 项目启动脚本
# 使用方法: ./start.sh [选项]
# 选项:
#   --frontend-only    只启动前端
#   --backend-only     只启动后端
#   --no-check         跳过依赖检查
#   --help             显示帮助信息

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT"
BACKEND_DIR="$PROJECT_ROOT/server"

# 默认启动模式
START_FRONTEND=true
START_BACKEND=true
CHECK_DEPS=true

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-only)
            START_FRONTEND=true
            START_BACKEND=false
            shift
            ;;
        --backend-only)
            START_FRONTEND=false
            START_BACKEND=true
            shift
            ;;
        --no-check)
            CHECK_DEPS=false
            shift
            ;;
        --help)
            echo "CuTool 项目启动脚本"
            echo ""
            echo "使用方法: ./start.sh [选项]"
            echo ""
            echo "选项:"
            echo "  --frontend-only    只启动前端"
            echo "  --backend-only     只启动后端"
            echo "  --no-check         跳过依赖检查"
            echo "  --help             显示帮助信息"
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            echo "使用 --help 查看帮助信息"
            exit 1
            ;;
    esac
done

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 检查前端依赖
check_frontend_deps() {
    print_info "检查前端依赖..."
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_warning "前端依赖未安装，正在安装..."
        cd "$FRONTEND_DIR"
        if [ -f "package-lock.json" ]; then
            npm install
        elif [ -f "yarn.lock" ]; then
            yarn install
        else
            npm install
        fi
        print_success "前端依赖安装完成"
    else
        print_success "前端依赖已安装"
    fi
}

# 检查后端依赖
check_backend_deps() {
    print_info "检查后端依赖..."
    cd "$BACKEND_DIR"
    
    # 检查虚拟环境
    if [ ! -d "venv" ]; then
        print_warning "Python虚拟环境不存在，正在创建..."
        python3 -m venv venv
        print_success "虚拟环境创建完成"
    fi
    
    # 激活虚拟环境并安装依赖
    source venv/bin/activate
    
    if [ ! -f "venv/.deps_installed" ]; then
        print_warning "后端依赖未安装，正在安装..."
        pip install --upgrade pip
        pip install -r requirements.txt
        touch venv/.deps_installed
        print_success "后端依赖安装完成"
    else
        print_success "后端依赖已安装"
    fi
    
    # 检查.env文件
    if [ ! -f ".env" ]; then
        print_warning ".env 文件不存在"
        if [ -f "env.example" ]; then
            print_info "正在从 env.example 创建 .env 文件..."
            cp env.example .env
            print_warning "请编辑 server/.env 文件，配置必要的环境变量"
        else
            print_error "env.example 文件不存在，请手动创建 .env 文件"
        fi
    fi
}

# 启动前端
start_frontend() {
    print_info "启动前端服务..."
    cd "$FRONTEND_DIR"
    
    # 检查端口是否被占用
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "端口 3000 已被占用，尝试使用其他端口..."
        PORT=3001 npm start &
    else
        npm start &
    fi
    
    FRONTEND_PID=$!
    print_success "前端服务已启动 (PID: $FRONTEND_PID)"
    print_info "前端地址: http://localhost:3000 (或 http://localhost:3001)"
}

# 启动后端
start_backend() {
    print_info "启动后端服务..."
    cd "$BACKEND_DIR"
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 检查端口是否被占用（默认3003）
    if lsof -Pi :3003 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "端口 3003 已被占用"
    fi
    
    # 启动Flask应用
    python app.py &
    BACKEND_PID=$!
    print_success "后端服务已启动 (PID: $BACKEND_PID)"
    print_info "后端地址: http://localhost:3003"
}

# 清理函数（在脚本退出时调用）
cleanup() {
    print_info "正在停止服务..."
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_info "前端服务已停止"
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_info "后端服务已停止"
    fi
    exit 0
}

# 注册清理函数
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    print_info "=========================================="
    print_info "    CuTool 项目启动脚本"
    print_info "=========================================="
    echo ""
    
    # 检查必要的命令
    if [ "$START_FRONTEND" = true ]; then
        check_command node
        check_command npm
    fi
    
    if [ "$START_BACKEND" = true ]; then
        check_command python3
    fi
    
    # 检查依赖
    if [ "$CHECK_DEPS" = true ]; then
        if [ "$START_FRONTEND" = true ]; then
            check_frontend_deps
        fi
        if [ "$START_BACKEND" = true ]; then
            check_backend_deps
        fi
    fi
    
    echo ""
    print_info "=========================================="
    print_info "    启动服务"
    print_info "=========================================="
    echo ""
    
    # 启动服务
    if [ "$START_BACKEND" = true ]; then
        start_backend
        sleep 2  # 等待后端启动
    fi
    
    if [ "$START_FRONTEND" = true ]; then
        start_frontend
    fi
    
    echo ""
    print_success "所有服务已启动！"
    echo ""
    print_info "按 Ctrl+C 停止所有服务"
    echo ""
    
    # 等待用户中断
    wait
}

# 运行主函数
main

