#!/bin/bash

# CuTool 快速启动脚本（简化版）
# 假设依赖已安装，直接启动服务

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT"
BACKEND_DIR="$PROJECT_ROOT/server"

echo "🚀 启动 CuTool 项目..."

# 启动后端
echo "📦 启动后端服务..."
cd "$BACKEND_DIR"
source venv/bin/activate 2>/dev/null || {
    echo "❌ 虚拟环境不存在，请先运行 ./start.sh 安装依赖"
    exit 1
}
python app.py &
BACKEND_PID=$!
echo "✅ 后端已启动 (PID: $BACKEND_PID) - http://localhost:3003"

# 等待后端启动
sleep 2

# 启动前端
echo "🎨 启动前端服务..."
cd "$FRONTEND_DIR"
npm start &
FRONTEND_PID=$!
echo "✅ 前端已启动 (PID: $FRONTEND_PID) - http://localhost:3000"

echo ""
echo "✨ 所有服务已启动！"
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
trap "kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait

