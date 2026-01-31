import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LoginButton.css';
import { API_BASE_URL } from '../config/api';

const LoginButton = ({ onLoginSuccess }) => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWechatQR, setShowWechatQR] = useState(false);
  const [wechatAuthUrl, setWechatAuthUrl] = useState('');

  useEffect(() => {
    // 如果不是在iframe中，保存当前地址作为主窗口地址
    try {
      if (window.top === window.self) {
        // 不在iframe中，保存当前地址
        const currentPath = window.location.pathname + window.location.search;
        const mainUrl = `${window.location.origin}${currentPath}`;
        localStorage.setItem('main_window_url', mainUrl);
      }
    } catch (e) {
      // 跨域限制，忽略
    }

    // 检查URL中是否有token（OAuth回调）
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // 保存token
      localStorage.setItem('auth_token', token);
      // 清除URL中的token
      window.history.replaceState({}, document.title, window.location.pathname);
      // 获取用户信息
      fetchUserInfo(token);
    } else {
      // 检查本地存储的token
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        fetchUserInfo(savedToken);
      }
    }

    // 监听postMessage，处理iframe中的登录成功回调
    const handleMessage = async (event) => {
      // 验证消息来源（可以根据需要添加更严格的验证）
      if (event.data && event.data.type === 'wechat_login_success') {
        const { token: messageToken, redirect_url } = event.data;
        if (messageToken) {
          // 保存token
          localStorage.setItem('auth_token', messageToken);
          // 获取用户信息
          await fetchUserInfo(messageToken);
          // 如果提供了redirect_url，跳转到该地址
          if (redirect_url) {
            window.location.href = redirect_url;
          } else {
            // 清除URL中的token（如果有）
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showModal && event.target.classList.contains('login-modal-overlay')) {
        setShowModal(false);
      }
      if (showWechatQR && event.target.classList.contains('login-modal-overlay')) {
        setShowWechatQR(false);
      }
    };

    if (showModal || showWechatQR) {
      document.addEventListener('click', handleClickOutside);
      // 阻止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showWechatQR]);

  // ESC键关闭弹窗
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (showModal) {
          setShowModal(false);
        }
        if (showWechatQR) {
          setShowWechatQR(false);
        }
      }
    };

    if (showModal || showWechatQR) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showModal, showWechatQR]);

  // 监听微信登录iframe的加载，检测登录成功
  useEffect(() => {
    if (!showWechatQR || !wechatAuthUrl) return;

    const checkLoginSuccess = async () => {
      try {
        const iframe = document.querySelector('.wechat-qr-iframe');
        if (iframe && iframe.contentWindow) {
          try {
            const iframeUrl = iframe.contentWindow.location.href;
            
            // 检查URL中是否有token参数（直接跳转的情况）
            if (iframeUrl.includes('token=')) {
              const urlParams = new URLSearchParams(iframeUrl.split('?')[1] || iframeUrl.split('#')[1]);
              const token = urlParams.get('token');
              
              if (token) {
                // 登录成功
                localStorage.setItem('auth_token', token);
                setShowWechatQR(false);
                await fetchUserInfo(token);
                return;
              }
            }
            
            // 检查URL是否包含回调地址（说明已经跳转回来了）
            if (iframeUrl.includes('/api/auth/callback/wechat')) {
              // 尝试从URL中提取token
              const urlParams = new URLSearchParams(iframeUrl.split('?')[1] || '');
              const token = urlParams.get('token');
              if (token) {
                localStorage.setItem('auth_token', token);
                setShowWechatQR(false);
                await fetchUserInfo(token);
                return;
              }
            }
            
            // 尝试读取iframe内容（可能是JSON响应或HTML页面）
            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              const bodyText = iframeDoc.body?.innerText || iframeDoc.body?.textContent || '';
              
              // 检查是否是JSON响应
              if (bodyText.trim().startsWith('{')) {
                try {
                  const jsonData = JSON.parse(bodyText);
                  if (jsonData.token) {
                    // 登录成功，从JSON中获取token
                    localStorage.setItem('auth_token', jsonData.token);
                    setShowWechatQR(false);
                    await fetchUserInfo(jsonData.token);
                    return;
                  }
                } catch (e) {
                  // JSON解析失败，忽略
                }
              }
              
              // 检查是否是HTML页面（后端返回的登录成功页面）
              if (bodyText.includes('登录成功') || bodyText.includes('正在跳转')) {
                // 后端会通过JavaScript处理跳转，这里只需要等待
                // 如果后端使用了postMessage，会被上面的message监听器处理
                return;
              }
            } catch (e) {
              // 跨域错误，忽略（后端会通过postMessage或直接跳转处理）
            }
          } catch (e) {
            // 跨域错误，忽略
          }
        }
      } catch (error) {
        // 忽略错误
      }
    };

    // 定期检查iframe URL和内容（因为跨域限制，可能无法直接访问）
    const interval = setInterval(checkLoginSuccess, 1000);

    // 监听iframe的load事件
    const iframe = document.querySelector('.wechat-qr-iframe');
    if (iframe) {
      iframe.addEventListener('load', checkLoginSuccess);
    }

    return () => {
      clearInterval(interval);
      if (iframe) {
        iframe.removeEventListener('load', checkLoginSuccess);
      }
    };
  }, [showWechatQR, wechatAuthUrl]);

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }
      } else {
        // Token无效，清除
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const handleLogin = async (provider) => {
    setLoading(true);
    
    if (provider === 'wechat') {
      // 微信登录：显示浮窗二维码
      try {
        // 获取主窗口地址（如果是在iframe中，需要获取top window的地址）
        let redirectUri;
        let isInIframe = false;
        try {
          // 尝试获取主窗口地址
          if (window.top && window.top !== window.self) {
            // 在iframe中，尝试获取主窗口地址
            isInIframe = true;
            try {
              const topLocation = window.top.location;
              const currentPath = topLocation.pathname + topLocation.search;
              redirectUri = `${topLocation.origin}${currentPath}`;
            } catch (e) {
              // 跨域限制，无法访问top window
              // 使用document.referrer或从localStorage获取之前保存的地址
              const referrer = document.referrer;
              if (referrer && !referrer.includes('open.weixin.qq.com')) {
                // 使用referrer作为主窗口地址
                redirectUri = referrer;
              } else {
                // 尝试从localStorage获取之前保存的主窗口地址
                const savedMainUrl = localStorage.getItem('main_window_url');
                if (savedMainUrl) {
                  redirectUri = savedMainUrl;
                } else {
                  // 最后使用当前窗口地址（虽然可能不准确，但总比localhost好）
                  const currentPath = window.location.pathname + window.location.search;
                  redirectUri = `${window.location.origin}${currentPath}`;
                }
              }
            }
          } else {
            // 不在iframe中，使用当前窗口地址
            const currentPath = window.location.pathname + window.location.search;
            redirectUri = `${window.location.origin}${currentPath}`;
            // 保存主窗口地址到localStorage，供iframe场景使用
            localStorage.setItem('main_window_url', redirectUri);
          }
        } catch (e) {
          // 出错时，尝试从localStorage获取
          const savedMainUrl = localStorage.getItem('main_window_url');
          if (savedMainUrl) {
            redirectUri = savedMainUrl;
          } else {
            const currentPath = window.location.pathname + window.location.search;
            redirectUri = `${window.location.origin}${currentPath}`;
          }
        }
        
        const response = await fetch(
          `${API_BASE_URL}/auth/login/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}&return_url=true&in_iframe=${isInIframe}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.auth_url) {
            setWechatAuthUrl(data.auth_url);
            setShowModal(false);
            setShowWechatQR(true);
            setLoading(false);
          } else {
            throw new Error('获取微信授权URL失败');
          }
        } else {
          throw new Error('获取微信授权URL失败');
        }
      } catch (error) {
        console.error('微信登录失败:', error);
        alert(i18n.language.startsWith('zh') ? '获取微信登录二维码失败，请稍后重试' : 'Failed to get WeChat QR code, please try again later');
        setLoading(false);
      }
    } else {
      // GitHub和Google登录：直接跳转
      setShowModal(false);
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const loginUrl = `${API_BASE_URL}/auth/login/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
      window.location.href = loginUrl;
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      localStorage.removeItem('auth_token');
      setUser(null);
      if (onLoginSuccess) {
        onLoginSuccess(null);
      }
    } catch (error) {
      console.error('登出失败:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  if (user) {
    return (
      <div className="user-menu-container">
        <div 
          className="user-info" 
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{ cursor: 'pointer' }}
        >
          {user.avatar_url && (
            <img src={user.avatar_url} alt={user.display_name || user.username} className="user-avatar" />
          )}
          <span className="user-name">{user.display_name || user.username || user.email}</span>
          <span className="user-menu-arrow">{showUserMenu ? '▲' : '▼'}</span>
        </div>
        
        {showUserMenu && (
          <div className="user-dropdown-menu">
            <div className="user-dropdown-header">
              <div className="user-dropdown-avatar">
                {user.avatar_url && (
                  <img src={user.avatar_url} alt={user.display_name || user.username} />
                )}
              </div>
              <div className="user-dropdown-info">
                <div className="user-dropdown-name">{user.display_name || user.username || user.email}</div>
                {user.email && user.email !== (user.display_name || user.username) && (
                  <div className="user-dropdown-email">{user.email}</div>
                )}
                <div className="user-dropdown-provider">
                  {user.provider === 'github' && 'GitHub'}
                  {user.provider === 'google' && 'Google'}
                  {user.provider === 'wechat' && '微信'}
                </div>
              </div>
            </div>
            <div className="user-dropdown-divider"></div>
            <button 
              className="user-dropdown-item logout-item" 
              onClick={handleLogout}
            >
              <span>{i18n.language.startsWith('zh') ? '登出' : 'Logout'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button 
        className="login-trigger-button" 
        onClick={() => setShowModal(true)}
      >
        {i18n.language.startsWith('zh') ? '登录' : 'Login'}
      </button>

      {showModal && (
        <div className="login-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="login-modal">
            <div className="login-modal-header">
              <h2>{i18n.language.startsWith('zh') ? '选择登录方式' : 'Choose Login Method'}</h2>
              <button 
                className="login-modal-close" 
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <div className="login-modal-content">
              <p className="login-modal-description">
                {i18n.language.startsWith('zh') 
                  ? '请选择以下方式之一登录' 
                  : 'Please choose one of the following methods to login'}
              </p>
              
              <div className="login-options">
                {i18n.language.startsWith('zh') && (
                  <button 
                    className="login-option wechat-option" 
                    onClick={() => handleLogin('wechat')}
                    disabled={loading}
                  >
                    <div className="login-option-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.042-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.35-8.597-6.35zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 3.336c-1.693 0-3.001.932-3.001 2.064 0 1.132 1.308 2.063 3 2.063 1.692 0 3.001-.931 3.001-2.063 0-1.132-1.309-2.064-3-2.064zm-1.08 2.408c-.33 0-.598-.272-.598-.607 0-.336.268-.608.598-.608.33 0 .599.272.599.608 0 .335-.269.607-.599.607zm-2.16-1.214c-.33 0-.598-.272-.598-.607 0-.336.268-.608.598-.608.33 0 .599.272.599.608 0 .335-.269.607-.599.607zm5.34 1.214c-.33 0-.598-.272-.598-.607 0-.336.268-.608.598-.608.33 0 .599.272.599.608 0 .335-.269.607-.599.607zm-2.16-1.214c-.33 0-.598-.272-.598-.607 0-.336.268-.608.598-.608.33 0 .599.272.599.608 0 .335-.269.607-.599.607z"/>
                      </svg>
                    </div>
                    <div className="login-option-content">
                      <div className="login-option-name">微信</div>
                      <div className="login-option-desc">使用微信账号登录</div>
                    </div>
                    <div className="login-option-arrow">→</div>
                  </button>
                )}

                <button 
                  className="login-option github-option" 
                  onClick={() => handleLogin('github')}
                  disabled={loading}
                >
                  <div className="login-option-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <div className="login-option-content">
                    <div className="login-option-name">GitHub</div>
                    <div className="login-option-desc">
                      {i18n.language.startsWith('zh') ? '使用GitHub账号登录' : 'Login with GitHub'}
                    </div>
                  </div>
                  <div className="login-option-arrow">→</div>
                </button>

                <button 
                  className="login-option google-option" 
                  onClick={() => handleLogin('google')}
                  disabled={loading}
                >
                  <div className="login-option-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div className="login-option-content">
                    <div className="login-option-name">Google</div>
                    <div className="login-option-desc">
                      {i18n.language.startsWith('zh') ? '使用Google账号登录' : 'Login with Google'}
                    </div>
                  </div>
                  <div className="login-option-arrow">→</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 微信登录二维码浮窗 */}
      {showWechatQR && (
        <div className="login-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowWechatQR(false)}>
          <div className="wechat-qr-modal">
            <div className="wechat-qr-modal-header">
              <h2>{i18n.language.startsWith('zh') ? '微信扫码登录' : 'WeChat QR Code Login'}</h2>
              <button 
                className="login-modal-close" 
                onClick={() => setShowWechatQR(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="wechat-qr-modal-content">
              <p className="wechat-qr-tip">
                {i18n.language.startsWith('zh') 
                  ? '请使用微信扫描下方二维码完成登录' 
                  : 'Please scan the QR code below with WeChat to complete login'}
              </p>
              <div className="wechat-qr-iframe-container">
                <iframe
                  src={wechatAuthUrl}
                  title="WeChat QR Code"
                  className="wechat-qr-iframe"
                  allow="camera"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginButton;

