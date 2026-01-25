from flask import Flask, jsonify, request, redirect, session, url_for
from flask_cors import CORS
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base, AIDaily, AINews, AITutorial, User
from config import Config
from vehicle_verify_helper import call_aliyun_vehicle_verify
from auth_helper import (
    init_oauth, generate_jwt_token, verify_jwt_token, 
    get_current_user, handle_github_callback, 
    handle_google_callback, handle_wechat_callback
)
import os
import uuid
import hashlib
import json
import urllib.parse
try:
    from alipay.aop.api.DefaultAlipayClient import DefaultAlipayClient
    from alipay.aop.api.request.AlipayTradePagePayRequest import AlipayTradePagePayRequest
    from alipay.aop.api.request.AlipayTradeQueryRequest import AlipayTradeQueryRequest
    from alipay.aop.api.util.SignatureUtils import verify_with_rsa
    ALIPAY_SDK_AVAILABLE = True
except ImportError:
    DefaultAlipayClient = None
    AlipayTradePagePayRequest = None
    AlipayTradeQueryRequest = None
    verify_with_rsa = None
    ALIPAY_SDK_AVAILABLE = False

app = Flask(__name__)
CORS(app, supports_credentials=True)  # 启用跨域支持，允许携带凭证

# 配置
app.config.from_object(Config)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', os.urandom(24).hex())

# 初始化OAuth
oauth = init_oauth(app)

# 创建数据库引擎和会话
engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

# 创建数据库表（如果不存在）
Base.metadata.create_all(engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # 注意：这里不关闭session，让调用者负责关闭

# AI日报接口 - 获取今天的日报
@app.route('/api/ai-daily/today', methods=['GET'])
def get_today_daily():
    db = get_db()
    try:
        today = datetime.now().date()
        # 获取语言参数，默认为中文
        language = request.args.get('lang', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'
        
        # 查询今天的日报
        daily = db.query(AIDaily).filter(
            AIDaily.date == today,
            AIDaily.language == language
        ).first()
        
        if not daily:
            # 如果没有今天的日报，返回空数据
            return jsonify({
                'date': today.strftime('%Y-%m-%d'),
                'summary': None,
                'news': []
            })
        
        # 根据语言参数决定查询哪些新闻
        # 中文模式：显示中文和英文所有新闻
        # 英文模式：只显示英文新闻
        if language == 'zh':
            # 查询中文和英文的新闻
            # 需要分别查询中文和英文的日报
            daily_en = db.query(AIDaily).filter(
                AIDaily.date == today,
                AIDaily.language == 'en'
            ).first()
            
            news_list = []
            # 先添加中文新闻
            news_zh = db.query(AINews).filter(
                AINews.daily_id == daily.id,
                AINews.language == 'zh'
            ).order_by(AINews.order_index).all()
            news_list.extend(news_zh)
            
            # 再添加英文新闻（如果存在英文日报）
            if daily_en:
                news_en = db.query(AINews).filter(
                    AINews.daily_id == daily_en.id,
                    AINews.language == 'en'
                ).order_by(AINews.order_index).all()
                news_list.extend(news_en)
        else:
            # 只查询英文新闻
            news_list = db.query(AINews).filter(
                AINews.daily_id == daily.id,
                AINews.language == 'en'
            ).order_by(AINews.order_index).all()
        
        # 构建返回数据
        result = {
            'date': daily.date.strftime('%Y-%m-%d'),
            'summary': daily.summary,
            'news': []
        }
        
        for news in news_list:
            result['news'].append({
                'id': news.id,
                'title': news.title,
                'summary': news.summary,
                'link': news.link
            })
        
        return jsonify(result)
    except Exception as e:
        app.logger.error(f'Error fetching today daily: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 历史日报接口
@app.route('/api/ai-daily/history', methods=['GET'])
def get_history_dailies():
    db = get_db()
    try:
        # 获取语言参数，默认为中文
        language = request.args.get('lang', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'
        
        # 获取分页参数
        page = request.args.get('page', '1')
        page_size = request.args.get('pageSize', '20')
        try:
            page = int(page)
            page_size = int(page_size)
            if page < 1:
                page = 1
            if page_size < 1 or page_size > 100:
                page_size = 20
        except ValueError:
            page = 1
            page_size = 20
        
        # 获取日期范围参数
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # 构建查询
        query = db.query(AIDaily).filter(AIDaily.language == language)
        
        # 应用日期范围过滤
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(AIDaily.date >= start_date_obj)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                query = query.filter(AIDaily.date <= end_date_obj)
            except ValueError:
                pass
        
        # 按日期降序排序（最新的在前）
        query = query.order_by(AIDaily.date.desc())
        
        # 获取总数
        total = query.count()
        
        # 分页查询
        offset = (page - 1) * page_size
        dailies = query.offset(offset).limit(page_size).all()
        
        # 构建返回数据
        history = []
        for daily in dailies:
            # 统计新闻数量（同语言）
            news_count = db.query(AINews).filter(
                AINews.daily_id == daily.id,
                AINews.language == language
            ).count()
            
            history.append({
                'date': daily.date.strftime('%Y-%m-%d'),
                'summary': daily.summary,
                'news': [{'title': '...'} for _ in range(news_count)] if news_count > 0 else []
            })
        
        # 计算总页数
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        
        return jsonify({
            'data': history,
            'pagination': {
                'page': page,
                'pageSize': page_size,
                'total': total,
                'totalPages': total_pages
            }
        })
    except Exception as e:
        app.logger.error(f'Error fetching history dailies: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 特定日期的日报接口
@app.route('/api/ai-daily/<date>', methods=['GET'])
def get_daily_by_date(date):
    db = get_db()
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        # 获取语言参数，默认为中文
        language = request.args.get('lang', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'
        
        # 查询指定日期的日报
        daily = db.query(AIDaily).filter(
            AIDaily.date == date_obj,
            AIDaily.language == language
        ).first()
        
        if not daily:
            return jsonify({'error': 'Daily not found'}), 404
        
        # 查询关联的新闻（同语言）
        news_list = db.query(AINews).filter(
            AINews.daily_id == daily.id,
            AINews.language == language
        ).order_by(AINews.order_index).all()
        
        result = {
            'date': daily.date.strftime('%Y-%m-%d'),
            'summary': daily.summary,
            'news': []
        }
        
        for news in news_list:
            result['news'].append({
                'id': news.id,
                'title': news.title,
                'summary': news.summary,
                'link': news.link
            })
        
        return jsonify(result)
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    except Exception as e:
        app.logger.error(f'Error fetching daily by date: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 新闻详情接口
@app.route('/api/ai-daily/<date>/news/<int:news_id>', methods=['GET'])
def get_news_detail(date, news_id):
    db = get_db()
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        # 获取语言参数，默认为中文
        language = request.args.get('lang', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'
        
        # 查询日报
        daily = db.query(AIDaily).filter(
            AIDaily.date == date_obj,
            AIDaily.language == language
        ).first()
        
        if not daily:
            return jsonify({'error': 'Daily not found'}), 404
        
        # 查询该日报下的所有新闻（同语言），按排序索引排序
        news_list = db.query(AINews).filter(
            AINews.daily_id == daily.id,
            AINews.language == language
        ).order_by(AINews.order_index).all()
        
        # news_id 是数组索引，检查是否有效
        if news_id < 0 or news_id >= len(news_list):
            return jsonify({'error': 'News not found'}), 404
        
        # 获取对应索引的新闻
        news = news_list[news_id]
        
        # 构建返回数据
        result = {
            'date': daily.date.strftime('%Y-%m-%d'),
            'title': news.title,
            'summary': news.summary,
            'content': news.content,
            'source': news.source,
            'sourceLink': news.source_link,
            'link': news.link,
            'tags': news.tags if news.tags else []
        }
        
        return jsonify(result)
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    except Exception as e:
        app.logger.error(f'Error fetching news detail: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# AI教程接口
@app.route('/api/ai-tutorial', methods=['GET'])
def get_ai_tutorials():
    db = get_db()
    try:
        # 获取语言参数，默认为中文
        language = request.args.get('lang', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'
        
        # 查询所有教程（指定语言），按分类和排序索引排序
        tutorials = db.query(AITutorial).filter(
            AITutorial.language == language
        ).order_by(AITutorial.category, AITutorial.order_index).all()
        
        result = []
        for tutorial in tutorials:
            result.append({
                'id': tutorial.id,
                'category': tutorial.category,
                'title': tutorial.title,
                'description': tutorial.description,
                'content': tutorial.content,
                'link': tutorial.link,
                'tags': tutorial.tags if tutorial.tags else []
            })
        
        return jsonify(result)
    except Exception as e:
        app.logger.error(f'Error fetching tutorials: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 健康检查接口
@app.route('/api/health', methods=['GET'])
def health_check():
    db = get_db()
    try:
        # 测试数据库连接
        db.execute(text('SELECT 1'))
        db_status = 'ok'
    except Exception as e:
        db_status = f'error: {str(e)}'
    finally:
        db.close()
    
    return jsonify({
        'status': 'ok',
        'database': db_status,
        'timestamp': datetime.now().isoformat()
    })

# ========== 车辆信息核验相关接口 ==========

# 初始化支付宝客户端
def init_alipay_client():
    """初始化支付宝客户端"""
    # 检查SDK是否可用
    if not ALIPAY_SDK_AVAILABLE:
        return None
    
    # 从环境变量获取配置
    app_id = os.getenv('ALIPAY_APP_ID', '').strip()
    app_private_key = os.getenv('ALIPAY_APP_PRIVATE_KEY', '').strip()
    alipay_public_key = os.getenv('ALIPAY_PUBLIC_KEY', '').strip()
    sign_type = os.getenv('ALIPAY_SIGN_TYPE', 'RSA2').strip()
    debug = os.getenv('ALIPAY_DEBUG', 'False').lower() == 'true'
    
    # 检查必要的配置
    if not app_id or not app_private_key or not alipay_public_key:
        return None
    
    # 处理私钥格式（支持换行符和清理格式）
    def clean_key(key_str, is_private_key=False):
        """清理密钥格式"""
        if not key_str:
            return key_str
        
        # 移除首尾空白
        key_str = key_str.strip()
        
        # 移除可能的引号包装（单引号、双引号）
        while (key_str.startswith('"') and key_str.endswith('"')) or \
              (key_str.startswith("'") and key_str.endswith("'")):
            key_str = key_str[1:-1].strip()
        
        # 处理字节字符串表示（如果包含 b'...' 格式）
        if key_str.startswith("b'") and key_str.endswith("'"):
            key_str = key_str[2:-1]
        if key_str.startswith('b"') and key_str.endswith('"'):
            key_str = key_str[2:-1]
        
        # 处理换行符
        if '\\n' in key_str:
            key_str = key_str.replace('\\n', '\n')
        if '\\r\\n' in key_str:
            key_str = key_str.replace('\\r\\n', '\n')
        if '\\r' in key_str:
            key_str = key_str.replace('\\r', '\n')
        
        # 按行分割并清理
        lines = key_str.split('\n')
        cleaned_lines = []
        begin_found = False
        end_found = False
        in_key = False
        key_type = None
        begin_marker = None
        end_marker = None
        
        for line in lines:
            original_line = line
            line = line.strip()
            if not line:
                # 保留空行（在密钥块内）
                if in_key:
                    continue
                else:
                    continue
            
            # 检查是否是开始标记
            if '-----BEGIN' in line:
                if not begin_found:
                    # 检测密钥类型和标记
                    if 'RSA PRIVATE KEY' in line:
                        key_type = 'RSA'
                        begin_marker = '-----BEGIN RSA PRIVATE KEY-----'
                        end_marker = '-----END RSA PRIVATE KEY-----'
                    elif 'PRIVATE KEY' in line and 'RSA' not in line:
                        key_type = 'PKCS8'
                        begin_marker = '-----BEGIN PRIVATE KEY-----'
                        end_marker = '-----END PRIVATE KEY-----'
                    elif 'PUBLIC KEY' in line:
                        key_type = 'PUBLIC'
                        begin_marker = '-----BEGIN PUBLIC KEY-----'
                        end_marker = '-----END PUBLIC KEY-----'
                    
                    cleaned_lines.append(begin_marker)
                    begin_found = True
                    in_key = True
                # 如果已经找到开始标记，忽略重复的开始标记
            # 检查是否是结束标记
            elif '-----END' in line:
                if not end_found and in_key:
                    # 确保结束标记匹配开始标记
                    if end_marker and end_marker in line:
                        cleaned_lines.append(end_marker)
                        end_found = True
                        in_key = False
                    elif not end_marker:
                        # 如果没有检测到类型，使用实际的结束标记
                        cleaned_lines.append(line)
                        end_found = True
                        in_key = False
            # 中间的内容（只保留在密钥块内的内容）
            elif in_key:
                # 过滤掉可能的重复标记和无效内容
                if '-----BEGIN' not in line and '-----END' not in line:
                    # 如果私钥内容是一行很长的字符串，尝试按64字符分割（标准PEM格式）
                    if is_private_key and len(line) > 64 and key_type == 'RSA':
                        # 将长行按64字符分割
                        for i in range(0, len(line), 64):
                            cleaned_lines.append(line[i:i+64])
                    else:
                        cleaned_lines.append(line)
        
        # 如果找到了开始标记但没有结束标记，尝试添加
        if begin_found and not end_found and end_marker:
            cleaned_lines.append(end_marker)
            end_found = True
        
        # 如果清理后没有找到有效的密钥，返回原始值
        if not cleaned_lines or not begin_found:
            return key_str
        
        cleaned_key = '\n'.join(cleaned_lines)
        
        # 如果是私钥，尝试检测并转换格式（需要 cryptography 库）
        if is_private_key:
            try:
                from cryptography.hazmat.primitives import serialization
                from cryptography.hazmat.backends import default_backend
                from cryptography.hazmat.primitives.asymmetric import rsa
                import subprocess
                import tempfile
                
                # 首先尝试使用 rsa 库验证（支付宝 SDK 使用的库）
                try:
                    import rsa
                    rsa.PrivateKey.load_pkcs1(cleaned_key.encode('utf-8'), format='PEM')
                    # 如果成功，说明已经是正确的 PKCS1 格式
                    app.logger.debug('私钥格式验证通过（PKCS1）')
                except Exception as rsa_error:
                    # rsa 库无法解析，可能是 PKCS8 格式，尝试转换
                    error_msg = str(rsa_error)
                    if 'Sequence' in error_msg or 'ASN.1' in error_msg or 'Tag' in error_msg:
                        app.logger.warning('检测到私钥格式问题，可能是 PKCS8 格式编码')
                        app.logger.info('正在尝试使用 OpenSSL 转换为 PKCS1 格式...')
                        
                        # 使用 OpenSSL 命令转换
                        try:
                            # 创建临时文件
                            with tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False) as tmp_in:
                                tmp_in.write(cleaned_key)
                                tmp_in_path = tmp_in.name
                            
                            with tempfile.NamedTemporaryFile(mode='r', suffix='.pem', delete=False) as tmp_out:
                                tmp_out_path = tmp_out.name
                            
                            # 使用 OpenSSL 转换为 PKCS1 格式（使用 -traditional 选项）
                            result = subprocess.run(
                                ['openssl', 'rsa', '-traditional', '-in', tmp_in_path, '-out', tmp_out_path],
                                capture_output=True,
                                text=True,
                                timeout=5
                            )
                            
                            if result.returncode == 0:
                                with open(tmp_out_path, 'r') as f:
                                    cleaned_key = f.read()
                                app.logger.info('✓ 已成功将私钥转换为 PKCS1 格式')
                                
                                # 验证转换后的格式
                                try:
                                    rsa.PrivateKey.load_pkcs1(cleaned_key.encode('utf-8'), format='PEM')
                                    app.logger.debug('转换后的私钥格式验证通过')
                                except Exception as verify_error:
                                    app.logger.warning(f'转换后的私钥验证失败: {str(verify_error)}')
                            else:
                                app.logger.error(f'OpenSSL 转换失败: {result.stderr}')
                                app.logger.error('请手动使用以下命令转换私钥格式：')
                                app.logger.error('openssl rsa -in private_key.pem -out rsa_private_key.pem')
                                raise Exception('OpenSSL conversion failed')
                            
                            # 清理临时文件
                            try:
                                os.unlink(tmp_in_path)
                                os.unlink(tmp_out_path)
                            except:
                                pass
                            
                        except (FileNotFoundError, subprocess.TimeoutExpired) as e:
                            app.logger.error(f'无法使用 OpenSSL 转换: {str(e)}')
                            app.logger.error('请手动使用以下命令转换私钥格式：')
                            app.logger.error('openssl rsa -in private_key.pem -out rsa_private_key.pem')
                            app.logger.error('或者从支付宝开放平台重新生成 PKCS1 格式的私钥')
                            raise Exception('PKCS8 to RSA conversion required')
                        except Exception as e:
                            app.logger.error(f'转换私钥格式时出错: {str(e)}')
                            raise
                    else:
                        # 其他错误，记录但不阻止
                        app.logger.warning(f'私钥格式验证警告: {error_msg}')
                        
            except Exception as e:
                error_msg = str(e)
                if 'PKCS8' in error_msg or 'conversion' in error_msg:
                    # 转换相关的错误，已经记录过了
                    pass
                else:
                    app.logger.warning(f'私钥格式处理过程出错: {error_msg}')
        
        return cleaned_key
    
    app_private_key = clean_key(app_private_key, is_private_key=True)
    
    # 处理公钥格式（使用相同的清理函数）
    alipay_public_key = clean_key(alipay_public_key, is_private_key=False)
    
    # 验证私钥格式（调试用）
    if app_private_key:
        begin_count = app_private_key.count('-----BEGIN')
        end_count = app_private_key.count('-----END')
        rsa_begin_count = app_private_key.count('-----BEGIN RSA PRIVATE KEY-----')
        rsa_end_count = app_private_key.count('-----END RSA PRIVATE KEY-----')
        
        if begin_count != 1 or end_count != 1:
            app.logger.warning(f'私钥格式可能有问题: BEGIN标记数量={begin_count}, END标记数量={end_count}')
            app.logger.warning(f'RSA BEGIN标记数量={rsa_begin_count}, RSA END标记数量={rsa_end_count}')
            # 输出私钥的前200字符和后100字符用于调试
            key_preview = app_private_key[:200] if len(app_private_key) > 200 else app_private_key
            key_suffix = app_private_key[-100:] if len(app_private_key) > 100 else ''
            app.logger.debug(f'私钥前200字符: {key_preview}')
            if key_suffix:
                app.logger.debug(f'私钥后100字符: {key_suffix}')
            app.logger.debug(f'私钥总长度: {len(app_private_key)} 字符')
        
        # 检查是否是 PKCS8 格式
        if '-----BEGIN PRIVATE KEY-----' in app_private_key and '-----BEGIN RSA PRIVATE KEY-----' not in app_private_key:
            app.logger.error('检测到 PKCS8 格式私钥，支付宝 SDK 需要 RSA 格式（PKCS1）')
            app.logger.error('请使用以下命令转换私钥格式：')
            app.logger.error('openssl rsa -in private_key.pem -out rsa_private_key.pem')
            app.logger.error('或者使用在线工具转换：https://8gwifi.org/PemParserFunctions.jsp')
        
        # 检查是否缺少结束标记
        if '-----BEGIN RSA PRIVATE KEY-----' in app_private_key and '-----END RSA PRIVATE KEY-----' not in app_private_key:
            app.logger.error('私钥缺少结束标记 -----END RSA PRIVATE KEY-----')
            app.logger.error('请检查 .env 文件中的 ALIPAY_APP_PRIVATE_KEY 配置，确保包含完整的私钥内容')
            app.logger.error('私钥应该以 -----BEGIN RSA PRIVATE KEY----- 开头，以 -----END RSA PRIVATE KEY----- 结尾')
    
    try:
        # 确定网关地址
        if debug:
            gateway = 'https://openapi.alipaydev.com/gateway.do'
        else:
            gateway = 'https://openapi.alipay.com/gateway.do'
        
        # 创建支付宝客户端配置
        from alipay.aop.api.AlipayClientConfig import AlipayClientConfig
        config = AlipayClientConfig()
        config.app_id = app_id
        config.app_private_key = app_private_key
        config.alipay_public_key = alipay_public_key
        config.sign_type = sign_type
        config.server_url = gateway
        config.charset = 'utf-8'
        config.format = 'JSON'
        
        # 创建支付宝客户端
        client = DefaultAlipayClient(alipay_client_config=config)
        
        # 测试私钥格式（尝试加载私钥以验证）
        try:
            # 首先使用 cryptography 库验证私钥
            try:
                from cryptography.hazmat.primitives import serialization
                from cryptography.hazmat.backends import default_backend
                
                # 尝试加载私钥
                private_key_obj = serialization.load_pem_private_key(
                    app_private_key.encode('utf-8'),
                    password=None,
                    backend=default_backend()
                )
                app.logger.debug('私钥格式验证通过（使用 cryptography 库）')
            except Exception as crypto_error:
                app.logger.warning(f'使用 cryptography 库验证私钥失败: {str(crypto_error)}')
                # 继续尝试使用 rsa 库验证
                try:
                    import rsa
                    rsa.PrivateKey.load_pkcs1(app_private_key.encode('utf-8'), format='PEM')
                    app.logger.debug('私钥格式验证通过（使用 rsa 库）')
                except Exception as rsa_error:
                    error_msg = str(rsa_error)
                    if 'Sequence' in error_msg:
                        app.logger.error('私钥内容可能有问题，无法解析')
                        app.logger.error('请检查私钥是否完整，是否从支付宝开放平台正确复制')
                        app.logger.error('私钥应该以 -----BEGIN RSA PRIVATE KEY----- 开头')
                        app.logger.error('以 -----END RSA PRIVATE KEY----- 结尾')
                        app.logger.error('如果是支付宝沙箱环境，请确保使用沙箱环境的应用私钥')
                        app.logger.error('获取方式：支付宝开放平台 > 开发助手 > 沙箱环境 > 查看应用私钥')
                        app.logger.error(f'详细错误: {error_msg}')
                    else:
                        app.logger.warning(f'私钥格式验证警告: {error_msg}')
        except Exception as e:
            app.logger.warning(f'私钥验证过程出错: {str(e)}')
        
        return client
    except Exception as e:
        error_msg = str(e)
        if 'Sequence' in error_msg:
            app.logger.error('私钥格式错误：可能是 PKCS8 格式，需要转换为 RSA 格式（PKCS1）')
            app.logger.error('转换命令：openssl rsa -in private_key.pem -out rsa_private_key.pem')
        app.logger.error(f'初始化支付宝客户端失败: {error_msg}')
        return None


# 核验类型价格配置（单位：元）
VERIFY_TYPE_PRICES = {
    'consistency': {
        '2': 19.90,  # 二要素核验价格
        '3': 19.90  # 三要素核验价格
    },
    'basicInfo': 29.90,      # 基本信息查询价格
    'insuranceLog': 29.90    # 投保日志查询价格
}

def get_verify_price(verify_type, form_data=None):
    """
    根据核验类型获取价格
    verify_type: consistency, basicInfo, insuranceLog
    form_data: 表单数据，用于判断一致性核验是二要素还是三要素
    """
    if verify_type == 'consistency':
        # 一致性核验：根据是否有身份证号判断是二要素还是三要素
        if form_data and form_data.get('idCard') and form_data.get('idCard').strip():
            return VERIFY_TYPE_PRICES['consistency']['3']  # 三要素
        else:
            return VERIFY_TYPE_PRICES['consistency']['2']  # 二要素
    elif verify_type == 'basicInfo':
        return VERIFY_TYPE_PRICES['basicInfo']
    elif verify_type == 'insuranceLog':
        return VERIFY_TYPE_PRICES['insuranceLog']
    else:
        return 1.00  # 默认价格

# 获取核验价格接口
@app.route('/api/vehicle-verify/price', methods=['POST'])
def get_verify_price_endpoint():
    """获取核验价格"""
    try:
        data = request.json
        verify_type = data.get('type')
        form_data = data.get('data')
        
        if not verify_type:
            return jsonify({'error': '参数不完整'}), 400
        
        price = get_verify_price(verify_type, form_data)
        
        # 获取价格说明
        price_description = ''
        if verify_type == 'consistency':
            if form_data and form_data.get('idCard') and form_data.get('idCard').strip():
                price_description = '三要素核验'
            else:
                price_description = '二要素核验'
        elif verify_type == 'basicInfo':
            price_description = '基本信息查询'
        elif verify_type == 'insuranceLog':
            price_description = '投保日志查询'
        
        return jsonify({
            'price': price,
            'type': verify_type,
            'description': price_description
        })
    except Exception as e:
        app.logger.error(f'获取价格错误: {str(e)}', exc_info=True)
        return jsonify({'error': str(e)}), 500

# 创建支付订单
@app.route('/api/vehicle-verify/create-order', methods=['POST'])
def create_vehicle_verify_order():
    """创建车辆核验支付订单"""
    try:
        data = request.json
        verify_type = data.get('type')
        form_data = data.get('data')
        # 如果前端传了金额，使用前端金额；否则根据核验类型自动计算
        amount = data.get('amount')
        if amount is None:
            amount = get_verify_price(verify_type, form_data)
        
        if not verify_type or not form_data:
            return jsonify({'error': '参数不完整'}), 400
        
        # 检查支付宝SDK是否可用
        if not ALIPAY_SDK_AVAILABLE:
            app.logger.error('支付宝SDK未安装，请运行: pip install alipay-sdk-python')
            return jsonify({
                'error': '支付宝SDK未安装',
                'message': '请安装支付宝SDK: pip install alipay-sdk-python'
            }), 500
        
        # 生成订单号
        order_id = f'VH{datetime.now().strftime("%Y%m%d%H%M%S")}{uuid.uuid4().hex[:8].upper()}'
        
        # 初始化支付宝客户端
        alipay_client = init_alipay_client()
        if not alipay_client:
            app.logger.error('支付宝配置未设置或配置错误')
            # 检查具体缺少哪些配置
            missing_configs = []
            if not os.getenv('ALIPAY_APP_ID'):
                missing_configs.append('ALIPAY_APP_ID')
            if not os.getenv('ALIPAY_APP_PRIVATE_KEY'):
                missing_configs.append('ALIPAY_APP_PRIVATE_KEY')
            if not os.getenv('ALIPAY_PUBLIC_KEY'):
                missing_configs.append('ALIPAY_PUBLIC_KEY')
            
            return jsonify({
                'error': '支付宝配置未设置',
                'message': f'缺少配置项: {", ".join(missing_configs)}',
                'hint': '请参考 server/ALIPAY_CONFIG_GUIDE.md 配置支付宝'
            }), 500
        
        # 创建支付订单
        subject = '车辆信息核验'
        if verify_type == 'consistency':
            subject = '车辆信息一致性核验'
        elif verify_type == 'basicInfo':
            subject = '车辆基本信息查询'
        elif verify_type == 'insuranceLog':
            subject = '车辆投保日志查询'
        
        # 获取回调URL
        return_url = os.getenv('ALIPAY_RETURN_URL', '')
        notify_url = os.getenv('ALIPAY_NOTIFY_URL', '')
        
        # 构建支付请求
        try:
            pay_request = AlipayTradePagePayRequest()
            # 设置业务参数（直接传入字典，SDK会自动处理）
            biz_content = {
                'out_trade_no': order_id,
                'total_amount': str(amount),
                'subject': subject,
                'product_code': 'FAST_INSTANT_TRADE_PAY'
            }
            pay_request.biz_content = biz_content
            pay_request.return_url = return_url
            pay_request.notify_url = notify_url
            
            # 调用API，使用GET方法生成支付URL
            response = alipay_client.page_execute(pay_request, http_method='GET')
            
            # response 已经是完整的URL字符串，直接使用
            payment_url = response
        except Exception as e:
            app.logger.error(f'调用支付宝API失败: {str(e)}', exc_info=True)
            return jsonify({
                'error': '创建支付订单失败',
                'message': str(e),
                'hint': '请检查支付宝配置是否正确，特别是私钥和公钥格式'
            }), 500
        
        # 这里应该将订单信息保存到数据库，暂时返回
        return jsonify({
            'orderId': order_id,
            'paymentUrl': payment_url,
            'amount': amount
        })
        
    except Exception as e:
        app.logger.error(f'创建订单错误: {str(e)}', exc_info=True)
        return jsonify({
            'error': '服务器内部错误',
            'message': str(e)
        }), 500

# 检查支付状态
@app.route('/api/vehicle-verify/check-payment/<order_id>', methods=['GET'])
def check_payment_status(order_id):
    """检查支付状态"""
    try:
        if not ALIPAY_SDK_AVAILABLE:
            return jsonify({'error': '支付宝SDK未安装'}), 500
        
        alipay_client = init_alipay_client()
        if not alipay_client:
            return jsonify({'error': '支付宝配置未设置'}), 500
        
        # 创建查询请求
        query_request = AlipayTradeQueryRequest()
        biz_content = {
            'out_trade_no': order_id
        }
        query_request.biz_content = biz_content
        
        # 调用API
        response = alipay_client.execute(query_request)
        
        # 解析响应
        if response and hasattr(response, 'code') and response.code == '10000':
            trade_status = getattr(response, 'trade_status', None)
            if trade_status == 'TRADE_SUCCESS' or trade_status == 'TRADE_FINISHED':
                return jsonify({
                    'status': 'paid',
                    'orderId': order_id
                })
            elif trade_status == 'WAIT_BUYER_PAY':
                return jsonify({
                    'status': 'pending',
                    'orderId': order_id
                })
            else:
                return jsonify({
                    'status': 'failed',
                    'orderId': order_id
                })
        else:
            return jsonify({
                'status': 'pending',
                'orderId': order_id
            })
            
    except Exception as e:
        app.logger.error(f'查询支付状态错误: {str(e)}', exc_info=True)
        return jsonify({'error': str(e)}), 500

# 车辆核验接口
@app.route('/api/vehicle-verify/verify', methods=['POST'])
def vehicle_verify():
    """车辆信息核验接口"""
    try:
        data = request.json
        verify_type = data.get('type')
        form_data = data.get('data')
        order_id = data.get('orderId')
        
        if not verify_type or not form_data or not order_id:
            return jsonify({'error': '参数不完整'}), 400
        
        # 验证订单是否已支付（这里应该从数据库查询，暂时简化）
        # 实际应该检查订单状态
        
        # 调用阿里云API
        result = call_aliyun_vehicle_verify(verify_type, form_data)
        
        return jsonify(result)
        
    except Exception as e:
        app.logger.error(f'车辆核验错误: {str(e)}')
        return jsonify({'error': str(e)}), 500

# 支付宝回调接口
@app.route('/api/vehicle-verify/alipay/notify', methods=['POST'])
def alipay_notify():
    """支付宝异步通知接口"""
    try:
        if not ALIPAY_SDK_AVAILABLE or verify_with_rsa is None:
            return 'fail'
        
        # 获取通知数据
        data = request.form.to_dict()
        signature = data.get('sign', '')
        sign_type = data.get('sign_type', 'RSA2')
        
        # 移除签名相关字段
        data_for_verify = {k: v for k, v in data.items() if k not in ['sign', 'sign_type']}
        
        # 获取支付宝公钥
        alipay_public_key = os.getenv('ALIPAY_PUBLIC_KEY', '').strip()
        if '\\n' in alipay_public_key:
            alipay_public_key = alipay_public_key.replace('\\n', '\n')
        
        # 构建待签名字符串
        sorted_items = sorted(data_for_verify.items())
        sign_content = '&'.join([f'{k}={v}' for k, v in sorted_items])
        
        # 验证签名
        is_valid = verify_with_rsa(alipay_public_key, sign_content, signature, sign_type)
        
        if not is_valid:
            app.logger.error('支付宝回调签名验证失败')
            return 'fail'
        
        # 处理支付成功逻辑
        trade_status = data.get('trade_status')
        out_trade_no = data.get('out_trade_no')
        
        if trade_status == 'TRADE_SUCCESS' or trade_status == 'TRADE_FINISHED':
            # 更新订单状态为已支付
            # 这里应该更新数据库中的订单状态
            app.logger.info(f'订单 {out_trade_no} 支付成功')
            return 'success'
        
        return 'success'
        
    except Exception as e:
        app.logger.error(f'支付宝回调错误: {str(e)}', exc_info=True)
        return 'fail'

# ========== 第三方登录相关接口 ==========

@app.route('/api/auth/login/github', methods=['GET'])
def github_login():
    """GitHub登录入口"""
    try:
        # 前端最终跳转地址（用于登录成功后跳转回前端）
        frontend_redirect_uri = request.args.get('redirect_uri', '')
        
        # GitHub回调地址：优先使用环境变量配置，否则自动生成
        backend_callback_uri = os.getenv('GITHUB_CALLBACK_URI', '')
        if not backend_callback_uri:
            backend_callback_uri = url_for('github_callback', _external=True)
            # 生产环境建议使用 HTTPS
            # 如果自动生成的地址是 http，且不是 localhost，强制改为 https
            if backend_callback_uri.startswith('http://') and 'localhost' not in backend_callback_uri:
                backend_callback_uri = backend_callback_uri.replace('http://', 'https://')
        
        # 保存前端跳转地址到session，用于登录成功后跳转
        if frontend_redirect_uri:
            session['oauth_redirect_uri'] = frontend_redirect_uri
        
        # 使用后端回调地址进行GitHub授权
        return oauth.github.authorize_redirect(backend_callback_uri)
    except Exception as e:
        app.logger.error(f'GitHub登录失败: {str(e)}')
        return jsonify({'error': 'GitHub登录配置错误'}), 500

@app.route('/api/auth/callback/github', methods=['GET'])
def github_callback():
    """GitHub OAuth回调"""
    db = get_db()
    try:
        user, token = handle_github_callback(oauth, db)
        jwt_token = generate_jwt_token(user.id)
        
        redirect_uri = session.pop('oauth_redirect_uri', None) or request.args.get('redirect_uri', '')
        if redirect_uri:
            # 如果指定了前端回调地址，重定向到前端
            separator = '&' if '?' in redirect_uri else '?'
            return redirect(f"{redirect_uri}{separator}token={jwt_token}")
        else:
            # 返回JSON响应
            return jsonify({
                'success': True,
                'token': jwt_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'display_name': user.display_name,
                    'avatar_url': user.avatar_url,
                    'provider': user.provider
                }
            })
    except Exception as e:
        app.logger.error(f'GitHub回调处理失败: {str(e)}', exc_info=True)
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/auth/login/google', methods=['GET'])
def google_login():
    """Google登录入口"""
    try:
        # 前端最终跳转地址（用于登录成功后跳转回前端）
        frontend_redirect_uri = request.args.get('redirect_uri', '')
        
        # Google回调地址：优先使用环境变量配置，否则自动生成
        backend_callback_uri = os.getenv('GOOGLE_CALLBACK_URI', '')
        if not backend_callback_uri:
            backend_callback_uri = url_for('google_callback', _external=True)
            # 生产环境建议使用 HTTPS
            # 如果自动生成的地址是 http，且不是 localhost，强制改为 https
            if backend_callback_uri.startswith('http://') and 'localhost' not in backend_callback_uri:
                backend_callback_uri = backend_callback_uri.replace('http://', 'https://')
        
        # 保存前端跳转地址到session，用于登录成功后跳转
        if frontend_redirect_uri:
            session['oauth_redirect_uri'] = frontend_redirect_uri
        
        # 使用后端回调地址进行Google授权
        return oauth.google.authorize_redirect(backend_callback_uri)
    except Exception as e:
        app.logger.error(f'Google登录失败: {str(e)}')
        return jsonify({'error': 'Google登录配置错误'}), 500

@app.route('/api/auth/callback/google', methods=['GET'])
def google_callback():
    """Google OAuth回调"""
    db = get_db()
    try:
        user, token = handle_google_callback(oauth, db)
        jwt_token = generate_jwt_token(user.id)
        
        redirect_uri = session.pop('oauth_redirect_uri', None) or request.args.get('redirect_uri', '')
        if redirect_uri:
            separator = '&' if '?' in redirect_uri else '?'
            return redirect(f"{redirect_uri}{separator}token={jwt_token}")
        else:
            return jsonify({
                'success': True,
                'token': jwt_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'display_name': user.display_name,
                    'avatar_url': user.avatar_url,
                    'provider': user.provider
                }
            })
    except Exception as e:
        app.logger.error(f'Google回调处理失败: {str(e)}', exc_info=True)
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/auth/login/wechat', methods=['GET'])
def wechat_login():
    """微信登录入口"""
    try:
        wechat_client_id = os.getenv('WECHAT_CLIENT_ID', '')
        if not wechat_client_id:
            return jsonify({'error': '微信登录未配置'}), 500
        
        # 前端最终跳转地址（用于登录成功后跳转回前端）
        frontend_redirect_uri = request.args.get('redirect_uri', '')
        
        # 微信回调地址：优先使用环境变量配置，否则自动生成
        backend_callback_uri = os.getenv('WECHAT_CALLBACK_URI', '')
        if not backend_callback_uri:
            backend_callback_uri = url_for('wechat_callback', _external=True)
            # 微信要求生产环境必须使用 HTTPS
            # 如果自动生成的地址是 http，且不是 localhost，强制改为 https
            if backend_callback_uri.startswith('http://') and 'localhost' not in backend_callback_uri:
                backend_callback_uri = backend_callback_uri.replace('http://', 'https://')
        
        # 保存前端跳转地址到session，用于登录成功后跳转
        if frontend_redirect_uri:
            session['oauth_redirect_uri'] = frontend_redirect_uri
        
        # 对微信回调地址进行URL编码（微信要求）
        encoded_callback_uri = urllib.parse.quote(backend_callback_uri, safe='')
        
        # 微信OAuth URL（redirect_uri必须编码）
        wechat_auth_url = f"https://open.weixin.qq.com/connect/qrconnect?appid={wechat_client_id}&redirect_uri={encoded_callback_uri}&response_type=code&scope=snsapi_login&state=STATE#wechat_redirect"
        
        return redirect(wechat_auth_url)
    except Exception as e:
        app.logger.error(f'微信登录失败: {str(e)}')
        return jsonify({'error': '微信登录配置错误'}), 500

@app.route('/api/auth/callback/wechat', methods=['GET'])
def wechat_callback():
    """微信OAuth回调"""
    db = get_db()
    try:
        code = request.args.get('code')
        if not code:
            return jsonify({'error': '缺少授权码'}), 400
        
        user, token = handle_wechat_callback(oauth, db, code)
        jwt_token = generate_jwt_token(user.id)
        
        redirect_uri = session.pop('oauth_redirect_uri', None) or request.args.get('redirect_uri', '')
        if redirect_uri:
            separator = '&' if '?' in redirect_uri else '?'
            return redirect(f"{redirect_uri}{separator}token={jwt_token}")
        else:
            return jsonify({
                'success': True,
                'token': jwt_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'display_name': user.display_name,
                    'avatar_url': user.avatar_url,
                    'provider': user.provider
                }
            })
    except Exception as e:
        app.logger.error(f'微信回调处理失败: {str(e)}', exc_info=True)
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/auth/me', methods=['GET'])
def get_current_user_info():
    """获取当前登录用户信息"""
    db = get_db()
    try:
        user = get_current_user(db)
        if not user:
            # 记录详细的错误信息用于调试
            auth_header = request.headers.get('Authorization', '')
            # 只记录前50个字符，避免记录完整的token
            header_preview = str(auth_header[:50]) if auth_header else 'None'
            app.logger.warning(f'获取用户信息失败: Authorization header = {header_preview}...')
            return jsonify({'error': '未登录或token无效'}), 401
        
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'display_name': user.display_name,
            'avatar_url': user.avatar_url,
            'provider': user.provider,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None
        })
    except Exception as e:
        app.logger.error(f'获取用户信息失败: {str(e)}', exc_info=True)
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """登出"""
    # JWT是无状态的，前端删除token即可
    return jsonify({'success': True, 'message': '登出成功'})

if __name__ == '__main__':
    port = app.config['PORT']
    app.run(host='0.0.0.0', port=port, debug=True)
