# CuTool 项目启动指南

## 快速开始

### macOS/Linux

```bash
# 给脚本添加执行权限（首次使用）
chmod +x start.sh

# 启动所有服务（前端 + 后端）
./start.sh

# 只启动前端
./start.sh --frontend-only

# 只启动后端
./start.sh --backend-only

# 跳过依赖检查（如果已确认依赖已安装）
./start.sh --no-check
```

### Windows

```cmd
REM 启动所有服务（前端 + 后端）
start.bat

REM 只启动前端
start.bat --frontend-only

REM 只启动后端
start.bat --backend-only

REM 跳过依赖检查
start.bat --no-check
```

## 功能说明

启动脚本会自动：

1. ✅ **检查依赖**
   - 检查 Node.js 和 npm（前端）
   - 检查 Python3（后端）
   - 自动安装缺失的前端依赖（node_modules）
   - 自动创建和配置 Python 虚拟环境
   - 自动安装后端依赖

2. ✅ **环境配置**
   - 检查后端 `.env` 文件
   - 如果不存在，从 `env.example` 创建

3. ✅ **启动服务**
   - 前端：http://localhost:3000
   - 后端：http://localhost:3003

4. ✅ **优雅退出**
   - 按 `Ctrl+C` 停止所有服务

## 手动启动

如果不想使用启动脚本，也可以手动启动：

### 启动前端

```bash
cd /path/to/cutool-web
npm install  # 首次使用
npm start
```

### 启动后端

```bash
cd /path/to/cutool-web/server

# 创建虚拟环境（首次使用）
python3 -m venv venv

# 激活虚拟环境
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 安装依赖（首次使用）
pip install -r requirements.txt

# 配置环境变量
cp env.example .env
# 编辑 .env 文件，配置必要的环境变量

# 启动服务
python app.py
```

## 常见问题

### 1. 端口被占用

如果端口 3000 或 3003 被占用，脚本会提示警告。可以：

- 停止占用端口的进程
- 修改配置文件中的端口号

### 2. 依赖安装失败

如果依赖安装失败：

- **前端**：检查 Node.js 版本（建议 14+）
- **后端**：检查 Python 版本（建议 3.7+）
- 检查网络连接
- 尝试使用国内镜像源

### 3. 后端启动失败

常见原因：

- `.env` 文件配置错误
- 数据库连接失败
- 缺少必要的环境变量

检查 `server/.env` 文件，确保所有必要的配置项都已设置。

### 4. 虚拟环境问题

如果虚拟环境有问题：

```bash
# 删除旧的虚拟环境
rm -rf server/venv

# 重新创建
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 开发模式 vs 生产模式

### 开发模式

使用启动脚本启动的是开发模式：
- 前端：热重载，自动刷新
- 后端：调试模式，详细错误信息

### 生产模式

生产环境部署请参考：
- 前端：`npm run build` 构建静态文件
- 后端：使用 Gunicorn 或 uWSGI 部署

## 服务地址

启动成功后：

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:3003
- **API 文档**: http://localhost:3003/api/health

## 停止服务

- **使用脚本启动**：按 `Ctrl+C` 停止所有服务
- **手动启动**：在对应的终端窗口按 `Ctrl+C`

## 日志

- 前端日志：在启动前端的终端窗口查看
- 后端日志：在启动后端的终端窗口查看
- 后端日志文件：`server/logs/` 目录（如果配置了日志文件）

## 更多帮助

- 后端配置：查看 `server/README.md`
- 前端配置：查看 `package.json`
- 部署指南：查看 `docs/` 目录下的相关文档

