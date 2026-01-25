"""
第三方登录认证辅助函数
支持微信、Gmail、GitHub登录
"""
import os
import jwt
import secrets
import time
from datetime import datetime, timedelta
from flask import request
from authlib.integrations.flask_client import OAuth
from sqlalchemy.orm import Session
from models import User
import requests

# JWT配置
# 优先使用 JWT_SECRET_KEY，如果没有则使用 SECRET_KEY，最后才使用随机生成
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') or os.getenv('SECRET_KEY') or secrets.token_urlsafe(32)
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7天

def init_oauth(app):
    """初始化OAuth客户端"""
    oauth = OAuth(app)
    
    # 配置代理（如果设置了环境变量）
    http_proxy = os.getenv('HTTP_PROXY', '') or os.getenv('http_proxy', '')
    https_proxy = os.getenv('HTTPS_PROXY', '') or os.getenv('https_proxy', '')
    proxies = None
    if http_proxy or https_proxy:
        proxies = {
            'http': http_proxy,
            'https': https_proxy or http_proxy
        }
        # 为 requests 设置默认代理
        if proxies['http'] or proxies['https']:
            import requests
            requests.Session().proxies.update(proxies)
    
    # GitHub OAuth配置
    github_client_id = os.getenv('GITHUB_CLIENT_ID', '')
    github_client_secret = os.getenv('GITHUB_CLIENT_SECRET', '')
    if github_client_id and github_client_secret:
        oauth.register(
            name='github',
            client_id=github_client_id,
            client_secret=github_client_secret,
            client_kwargs={
                'scope': 'user:email'
            },
            authorize_url='https://github.com/login/oauth/authorize',
            access_token_url='https://github.com/login/oauth/access_token',
            api_base_url='https://api.github.com/',
        )
    
    # Google OAuth配置
    google_client_id = os.getenv('GOOGLE_CLIENT_ID', '')
    google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET', '')
    if google_client_id and google_client_secret:
        oauth.register(
            name='google',
            client_id=google_client_id,
            client_secret=google_client_secret,
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={
                'scope': 'openid email profile'
            }
        )
    
    # 微信OAuth配置（需要企业认证，这里提供基础配置）
    wechat_client_id = os.getenv('WECHAT_CLIENT_ID', '')
    wechat_client_secret = os.getenv('WECHAT_CLIENT_SECRET', '')
    if wechat_client_id and wechat_client_secret:
        # 微信登录需要特殊处理，这里先预留接口
        pass
    
    return oauth

def generate_jwt_token(user_id):
    """生成JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    # 确保返回字符串类型（PyJWT 2.x 返回字符串，但为了兼容性确保是字符串）
    if isinstance(token, bytes):
        return token.decode('utf-8')
    return token

def verify_jwt_token(token):
    """验证JWT token"""
    try:
        # 确保 token 是字符串
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user(db: Session, token: str = None):
    """获取当前登录用户"""
    if not token:
        # 从请求头获取token
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
        else:
            return None
    
    # 确保 token 是字符串（处理可能的 bytes 类型）
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    
    # 清理 token（移除可能的引号或其他字符）
    token = token.strip().strip('"').strip("'")
    
    user_id = verify_jwt_token(token)
    if not user_id:
        return None
    
    return db.query(User).filter(User.id == user_id).first()

def create_or_update_user(db: Session, provider: str, provider_user_id: str, 
                          email: str = None, username: str = None, 
                          display_name: str = None, avatar_url: str = None):
    """创建或更新用户"""
    user = db.query(User).filter(
        User.provider == provider,
        User.provider_user_id == provider_user_id
    ).first()
    
    if user:
        # 更新用户信息
        if email:
            user.email = email
        if username:
            user.username = username
        if display_name:
            user.display_name = display_name
        if avatar_url:
            user.avatar_url = avatar_url
        user.last_login_at = datetime.now()
        user.updated_at = datetime.now()
    else:
        # 创建新用户
        user = User(
            provider=provider,
            provider_user_id=provider_user_id,
            email=email,
            username=username,
            display_name=display_name,
            avatar_url=avatar_url,
            last_login_at=datetime.now()
        )
        db.add(user)
    
    db.commit()
    db.refresh(user)
    return user

def handle_github_callback(oauth, db: Session):
    """处理GitHub OAuth回调"""
    max_retries = 3
    retry_delay = 1  # 秒
    
    for attempt in range(max_retries):
        try:
            # 获取 access token（带重试）
            token = None
            try:
                token = oauth.github.authorize_access_token()
            except requests.exceptions.ConnectionError as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise Exception(f'无法连接到GitHub服务器，请检查网络连接或稍后重试: {str(e)}')
            except requests.exceptions.Timeout as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise Exception(f'GitHub API请求超时，请稍后重试: {str(e)}')
            
            # 获取用户信息（带重试）
            resp = None
            try:
                resp = oauth.github.get('user', token=token, timeout=10)
                user_info = resp.json()
            except requests.exceptions.ConnectionError as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise Exception(f'无法连接到GitHub API，请检查网络连接或稍后重试: {str(e)}')
            except requests.exceptions.Timeout as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise Exception(f'GitHub API请求超时，请稍后重试: {str(e)}')
            
            # 获取邮箱（可能需要额外请求）
            email = user_info.get('email', '')
            if not email:
                # 尝试获取用户邮箱列表
                try:
                    emails_resp = oauth.github.get('user/emails', token=token, timeout=10)
                    emails = emails_resp.json()
                    if emails and len(emails) > 0:
                        # 使用主邮箱
                        email = emails[0].get('email', '')
                except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
                    # 邮箱获取失败不影响登录
                    pass
                except Exception:
                    pass
            
            user = create_or_update_user(
                db=db,
                provider='github',
                provider_user_id=str(user_info.get('id', '')),
                email=email,
                username=user_info.get('login', ''),
                display_name=user_info.get('name', user_info.get('login', '')),
                avatar_url=user_info.get('avatar_url', '')
            )
            
            return user, token
            
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))
                continue
            else:
                raise Exception(f'GitHub登录失败: {str(e)}')

def handle_google_callback(oauth, db: Session):
    """处理Google OAuth回调"""
    max_retries = 3
    retry_delay = 1  # 秒
    
    # 获取代理配置
    http_proxy = os.getenv('HTTP_PROXY', '') or os.getenv('http_proxy', '')
    https_proxy = os.getenv('HTTPS_PROXY', '') or os.getenv('https_proxy', '')
    proxies = None
    if http_proxy or https_proxy:
        proxies = {
            'http': http_proxy,
            'https': https_proxy or http_proxy
        }
    
    for attempt in range(max_retries):
        try:
            # 获取 access token（带重试）
            token = None
            try:
                token = oauth.google.authorize_access_token()
            except requests.exceptions.ConnectionError as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise Exception(f'无法连接到Google服务器，请检查网络连接或配置代理后重试: {str(e)}')
            except requests.exceptions.Timeout as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise Exception(f'Google服务器响应超时，请检查网络连接或配置代理后重试: {str(e)}')
            
            user_info = token.get('userinfo')
            
            if not user_info:
                # 如果token中没有userinfo，需要单独获取
                try:
                    resp = oauth.google.get('userinfo', token=token, timeout=15)
                    user_info = resp.json()
                except requests.exceptions.ConnectionError as e:
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay * (attempt + 1))
                        continue
                    else:
                        raise Exception(f'无法连接到Google API，请检查网络连接或配置代理后重试: {str(e)}')
                except requests.exceptions.Timeout as e:
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay * (attempt + 1))
                        continue
                    else:
                        raise Exception(f'Google API请求超时，请检查网络连接或配置代理后重试: {str(e)}')
            
            user = create_or_update_user(
                db=db,
                provider='google',
                provider_user_id=user_info.get('sub', ''),
                email=user_info.get('email', ''),
                username=user_info.get('email', '').split('@')[0] if user_info.get('email') else None,
                display_name=user_info.get('name', ''),
                avatar_url=user_info.get('picture', '')
            )
            
            return user, token
            
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))
                continue
            else:
                raise Exception(f'Google登录失败: {str(e)}')

def handle_wechat_callback(oauth, db: Session, code: str):
    """处理微信OAuth回调"""
    max_retries = 3
    retry_delay = 1  # 秒
    
    wechat_client_id = os.getenv('WECHAT_CLIENT_ID', '')
    wechat_client_secret = os.getenv('WECHAT_CLIENT_SECRET', '')
    
    if not wechat_client_id or not wechat_client_secret:
        raise Exception('微信登录未配置')
    
    # 获取代理配置
    http_proxy = os.getenv('HTTP_PROXY', '') or os.getenv('http_proxy', '')
    https_proxy = os.getenv('HTTPS_PROXY', '') or os.getenv('https_proxy', '')
    proxies = None
    if http_proxy or https_proxy:
        proxies = {
            'http': http_proxy,
            'https': https_proxy or http_proxy
        }
    
    for attempt in range(max_retries):
        try:
            # 获取access_token（带重试）
            token_url = 'https://api.weixin.qq.com/sns/oauth2/access_token'
            token_params = {
                'appid': wechat_client_id,
                'secret': wechat_client_secret,
                'code': code,
                'grant_type': 'authorization_code'
            }
            
            try:
                token_resp = requests.get(token_url, params=token_params, timeout=10, proxies=proxies)
                token_data = token_resp.json()
            except requests.exceptions.ConnectionError as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise Exception(f'无法连接到微信服务器，请检查网络连接或稍后重试: {str(e)}')
            except requests.exceptions.Timeout as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise Exception(f'微信API请求超时，请稍后重试: {str(e)}')
            
            if 'errcode' in token_data:
                raise Exception(f'微信登录失败: {token_data.get("errmsg", "未知错误")}')
            
            access_token = token_data.get('access_token')
            openid = token_data.get('openid')
            
            # 获取用户信息（带重试）
            userinfo_url = 'https://api.weixin.qq.com/sns/userinfo'
            userinfo_params = {
                'access_token': access_token,
                'openid': openid,
                'lang': 'zh_CN'
            }
            
            try:
                userinfo_resp = requests.get(userinfo_url, params=userinfo_params, timeout=10, proxies=proxies)
                user_info = userinfo_resp.json()
            except requests.exceptions.ConnectionError as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise Exception(f'无法连接到微信API，请检查网络连接或稍后重试: {str(e)}')
            except requests.exceptions.Timeout as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise Exception(f'微信API请求超时，请稍后重试: {str(e)}')
            
            if 'errcode' in user_info:
                raise Exception(f'获取微信用户信息失败: {user_info.get("errmsg", "未知错误")}')
            
            user = create_or_update_user(
                db=db,
                provider='wechat',
                provider_user_id=openid,
                username=user_info.get('nickname', ''),
                display_name=user_info.get('nickname', ''),
                avatar_url=user_info.get('headimgurl', '')
            )
            
            return user, {'access_token': access_token, 'openid': openid}
            
        except Exception as e:
            # 如果是业务错误（如errcode），直接抛出
            if 'errcode' in str(e) or '微信登录未配置' in str(e):
                raise
            # 如果是网络错误，进行重试
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))
                continue
            else:
                raise Exception(f'微信登录失败: {str(e)}')

