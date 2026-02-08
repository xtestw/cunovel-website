#!/bin/bash

# CuTool 项目停止脚本
# 停止所有运行中的前端和后端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 停止前端服务（React开发服务器）
stop_frontend() {
    print_info "正在停止前端服务..."
    
    # 查找并停止运行在3000, 3001, 8080端口的node进程
    for port in 3000 3001 8080; do
        PID=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$PID" ]; then
            print_info "发现端口 $port 上的进程 (PID: $PID)，正在停止..."
            kill $PID 2>/dev/null || true
            sleep 1
            # 如果还在运行，强制杀死
            if kill -0 $PID 2>/dev/null; then
                kill -9 $PID 2>/dev/null || true
            fi
            print_success "端口 $port 上的服务已停止"
        fi
    done
    
    # 查找react-scripts进程
    REACT_PIDS=$(pgrep -f "react-scripts" 2>/dev/null || true)
    if [ ! -z "$REACT_PIDS" ]; then
        print_info "发现 react-scripts 进程，正在停止..."
        echo "$REACT_PIDS" | xargs kill 2>/dev/null || true
        sleep 1
        echo "$REACT_PIDS" | xargs kill -9 2>/dev/null || true
        print_success "react-scripts 进程已停止"
    fi
}

# 停止后端服务（Flask应用）
stop_backend() {
    print_info "正在停止后端服务..."
    
    # 查找并停止运行在3003端口的python进程
    for port in 3003; do
        PID=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$PID" ]; then
            print_info "发现端口 $port 上的进程 (PID: $PID)，正在停止..."
            kill $PID 2>/dev/null || true
            sleep 1
            # 如果还在运行，强制杀死
            if kill -0 $PID 2>/dev/null; then
                kill -9 $PID 2>/dev/null || true
            fi
            print_success "端口 $port 上的服务已停止"
        fi
    done
    
    # 查找app.py进程
    APP_PIDS=$(pgrep -f "python.*app.py" 2>/dev/null || true)
    if [ ! -z "$APP_PIDS" ]; then
        print_info "发现 app.py 进程，正在停止..."
        echo "$APP_PIDS" | xargs kill 2>/dev/null || true
        sleep 1
        echo "$APP_PIDS" | xargs kill -9 2>/dev/null || true
        print_success "app.py 进程已停止"
    fi
}

# 主函数
main() {
    print_info "=========================================="
    print_info "    CuTool 项目停止脚本"
    print_info "=========================================="
    echo ""
    
    stop_frontend
    stop_backend
    
    echo ""
    print_success "所有服务已停止！"
}

# 运行主函数
main

