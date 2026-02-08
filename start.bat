@echo off
REM CuTool 项目启动脚本 (Windows)
REM 使用方法: start.bat [选项]
REM 选项:
REM   --frontend-only    只启动前端
REM   --backend-only     只启动后端
REM   --no-check         跳过依赖检查

setlocal enabledelayedexpansion

REM 项目根目录
set "PROJECT_ROOT=%~dp0"
set "FRONTEND_DIR=%PROJECT_ROOT%"
set "BACKEND_DIR=%PROJECT_ROOT%server"

REM 默认启动模式
set "START_FRONTEND=true"
set "START_BACKEND=true"
set "CHECK_DEPS=true"

REM 解析命令行参数
:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--frontend-only" (
    set "START_FRONTEND=true"
    set "START_BACKEND=false"
    shift
    goto parse_args
)
if "%~1"=="--backend-only" (
    set "START_FRONTEND=false"
    set "START_BACKEND=true"
    shift
    goto parse_args
)
if "%~1"=="--no-check" (
    set "CHECK_DEPS=false"
    shift
    goto parse_args
)
if "%~1"=="--help" (
    echo CuTool 项目启动脚本
    echo.
    echo 使用方法: start.bat [选项]
    echo.
    echo 选项:
    echo   --frontend-only    只启动前端
    echo   --backend-only     只启动后端
    echo   --no-check         跳过依赖检查
    echo   --help             显示帮助信息
    exit /b 0
)
shift
goto parse_args
:end_parse

echo ==========================================
echo     CuTool 项目启动脚本
echo ==========================================
echo.

REM 检查必要的命令
if "%START_FRONTEND%"=="true" (
    where node >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Node.js 未安装，请先安装 Node.js
        exit /b 1
    )
    where npm >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] npm 未安装，请先安装 npm
        exit /b 1
    )
)

if "%START_BACKEND%"=="true" (
    where python >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python 未安装，请先安装 Python
        exit /b 1
    )
)

REM 检查依赖
if "%CHECK_DEPS%"=="true" (
    if "%START_FRONTEND%"=="true" (
        echo [INFO] 检查前端依赖...
        if not exist "%FRONTEND_DIR%\node_modules" (
            echo [WARNING] 前端依赖未安装，正在安装...
            cd /d "%FRONTEND_DIR%"
            call npm install
            echo [SUCCESS] 前端依赖安装完成
        ) else (
            echo [SUCCESS] 前端依赖已安装
        )
    )
    
    if "%START_BACKEND%"=="true" (
        echo [INFO] 检查后端依赖...
        cd /d "%BACKEND_DIR%"
        
        REM 检查虚拟环境
        if not exist "venv" (
            echo [WARNING] Python虚拟环境不存在，正在创建...
            python -m venv venv
            echo [SUCCESS] 虚拟环境创建完成
        )
        
        REM 激活虚拟环境并安装依赖
        call venv\Scripts\activate.bat
        
        if not exist "venv\.deps_installed" (
            echo [WARNING] 后端依赖未安装，正在安装...
            python -m pip install --upgrade pip
            pip install -r requirements.txt
            type nul > venv\.deps_installed
            echo [SUCCESS] 后端依赖安装完成
        ) else (
            echo [SUCCESS] 后端依赖已安装
        )
        
        REM 检查.env文件
        if not exist ".env" (
            echo [WARNING] .env 文件不存在
            if exist "env.example" (
                echo [INFO] 正在从 env.example 创建 .env 文件...
                copy env.example .env >nul
                echo [WARNING] 请编辑 server\.env 文件，配置必要的环境变量
            ) else (
                echo [ERROR] env.example 文件不存在，请手动创建 .env 文件
            )
        )
    )
)

echo.
echo ==========================================
echo     启动服务
echo ==========================================
echo.

REM 启动服务
if "%START_BACKEND%"=="true" (
    echo [INFO] 启动后端服务...
    cd /d "%BACKEND_DIR%"
    start "CuTool Backend" cmd /k "venv\Scripts\activate.bat && python app.py"
    echo [SUCCESS] 后端服务已启动
    echo [INFO] 后端地址: http://localhost:3003
    timeout /t 2 /nobreak >nul
)

if "%START_FRONTEND%"=="true" (
    echo [INFO] 启动前端服务...
    cd /d "%FRONTEND_DIR%"
    start "CuTool Frontend" cmd /k "npm start"
    echo [SUCCESS] 前端服务已启动
    echo [INFO] 前端地址: http://localhost:3000
)

echo.
echo [SUCCESS] 所有服务已启动！
echo.
echo 关闭此窗口不会停止服务，请在对应的服务窗口中按 Ctrl+C 停止服务
echo.

pause

