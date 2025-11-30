import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SpeedInsights } from '@vercel/speed-insights/react';
import i18n from './i18n';
import Tools from './pages/Tools';
import AINav from './pages/AINav/AINav';
import LanguageSwitcher from './components/LanguageSwitcher';
import TokenCalculator from './pages/TokenCalculator/TokenCalculator';
import TextTokens from './pages/TokenCalculator/TextTokens';
import ImageTokens from './pages/TokenCalculator/ImageTokens';
import AIDaily from './pages/AIDaily/AIDaily';
import AIDailyDetail from './pages/AIDaily/AIDailyDetail';
import AIDailyHistory from './pages/AIDaily/AIDailyHistory';
import NewsDetail from './pages/AIDaily/NewsDetail';
import AITutorial from './pages/AITutorial/AITutorial';
import './App.css';
import styled from 'styled-components';
import './i18n';
import ChromePlugin from './pages/ChromePlugin';

const Content = styled.div`
  margin: 0;
  padding: 0;
`;

function AppContent() {
  const { t } = useTranslation();
  const location = useLocation();
  const feedbackEmail = 'xuwei8091@gmail.com';
  const [hasAds, setHasAds] = useState(false);
  const adInitialized = useRef(false);

  // Language change is handled by App component's Router key

  // 初始化广告并检查是否加载
  useEffect(() => {
    const initAds = () => {
      // 检查是否已经初始化过
      if (adInitialized.current) {
        return;
      }

      // 等待 adsbygoogle 脚本加载
      if (typeof window === 'undefined' || !window.adsbygoogle) {
        return;
      }

      try {
        // 查找所有未初始化的广告容器
        const adContainers = document.querySelectorAll('.adsbygoogle:not([data-adsbygoogle-status])');
        
        // 如果有未初始化的容器，才调用 push
        if (adContainers.length > 0) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adInitialized.current = true;
        }
      } catch (error) {
        // 忽略重复初始化的错误
        if (!error.message || !error.message.includes('already have ads')) {
          console.warn('AdSense initialization error:', error);
        }
      }
    };

    // 延迟初始化，确保 DOM 已渲染且脚本已加载
    const timer = setTimeout(() => {
      // 如果脚本还没加载，等待一下
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        initAds();
      } else {
        // 等待脚本加载
        const checkScript = setInterval(() => {
          if (typeof window !== 'undefined' && window.adsbygoogle) {
            initAds();
            clearInterval(checkScript);
          }
        }, 100);
        
        // 10秒后停止检查
        setTimeout(() => clearInterval(checkScript), 10000);
      }
    }, 500);

    // 检查广告是否加载
    const checkAdsLoaded = () => {
      const adContainer = document.querySelector('.adsbygoogle');
      if (adContainer) {
        const hasContent = adContainer.innerHTML.trim().length > 0;
        setHasAds(hasContent);
      }
    };

    // 广告加载可能需要一点时间
    const checkTimer = setTimeout(checkAdsLoaded, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(checkTimer);
    };
  }, []);

  return (
    <div className="App">
        <Helmet>
          <meta name="sogou_site_verification" content="0ZZ5kf0BG4" />
          <meta name="360-site-verification" content="6d82a11803ef6749aad7340caf7f9bb4" />
        </Helmet>
        <header className="App-header">
          <div className="tool-container">
            <div className="logo-area">
              <img src="/favicon.ico" alt="logo" className="logo-icon" />
              <h1>CUTool</h1>
            </div>
            <nav className="nav-area">
              <NavLink
                to="/tools/json/formatter"
                className="nav-item"
                style={({ isActive }) => ({
                  color: isActive ? '#1890ff' : '#595959'
                })}
              >
                {t('common.toolbox')}
              </NavLink>
              <NavLink
                to="/ai-nav"
                className="nav-item"
                style={({ isActive }) => ({
                  color: isActive ? '#1890ff' : '#595959'
                })}
              >
                {t('common.aiNav')}
              </NavLink>
              <div className="nav-item nav-item-dropdown">
                <NavLink
                  to="/ai-daily"
                  className={`nav-item-link ${location.pathname.startsWith('/ai-daily') ? 'active' : ''}`}
                  style={{
                    color: location.pathname.startsWith('/ai-daily') ? '#1890ff' : '#595959'
                  }}
                >
                  {t('common.aiDaily')}
                </NavLink>
                <div className="nav-dropdown-menu">
                  <NavLink
                    to="/ai-daily"
                    end={false}
                    className={({ isActive }) => {
                      // 完全自定义激活判断，忽略 NavLink 的默认 isActive
                      const isTodayActive = location.pathname === '/ai-daily' || 
                        (location.pathname.startsWith('/ai-daily/') && 
                         location.pathname !== '/ai-daily/history' &&
                         location.pathname.match(/^\/ai-daily\/\d{4}-\d{2}-\d{2}/));
                      return `nav-dropdown-item ${isTodayActive ? 'active' : ''}`;
                    }}
                  >
                    {t('common.todayDaily')}
                  </NavLink>
                  <NavLink
                    to="/ai-daily/history"
                    className={({ isActive }) => {
                      // 完全自定义激活判断
                      const isHistoryActive = location.pathname === '/ai-daily/history';
                      return `nav-dropdown-item ${isHistoryActive ? 'active' : ''}`;
                    }}
                  >
                    {t('common.historyDaily')}
                  </NavLink>
                </div>
              </div>
              <NavLink
                to="/token-calculator/text"
                className="nav-item"
                style={({ isActive }) => ({
                  color: isActive ? '#1890ff' : '#595959'
                })}
              >
                {t('common.tokenCalculator')}
              </NavLink>
              <a 
                href="https://chromewebstore.google.com/detail/cutool/pnadcjmfdflpblaogepdpeooialeelno?hl=en-US&utm_source=ext_sidebar"
                className="nav-item chrome-plugin"
                target="_blank"
                rel="noopener noreferrer"
              >
                Chrome 插件
                <span className="external-link-icon">↗</span>
              </a>
              <a 
                href="https://plugins.jetbrains.com/plugin/26245-cutool?noRedirect=true"
                className="nav-item idea-plugin"
                target="_blank"
                rel="noopener noreferrer"
              >
                IDEA 插件
                <span className="external-link-icon">↗</span>
              </a>
            </nav>
            <div className="right-area">
              <LanguageSwitcher />
              <a 
                href={`mailto:${feedbackEmail}`}
                className="feedback-button"
                target="_blank"
                rel="noopener noreferrer"
              >
                反馈
              </a>
            </div>
          </div>
        </header>
        <Content>
          <Routes>
            <Route path="/tools" element={<Tools />}>
              <Route path=":category/:tool" element={<Tools />} />
              <Route index element={<Navigate to="/tools/json/formatter" replace />} />
            </Route>
            <Route path="/ai-nav" element={<AINav />} />
          <Route path="/ai-daily" element={<AIDaily />} />
          <Route path="/ai-daily/history" element={<AIDailyHistory />} />
          <Route path="/ai-daily/:date" element={<AIDailyDetail />} />
          <Route path="/ai-daily/:date/news/:newsId" element={<NewsDetail />} />
          <Route path="/ai-tutorial" element={<AITutorial />} />
            <Route path="/token-calculator" element={<TokenCalculator />}>
              <Route path="text" element={<TextTokens />} />
              <Route path="image" element={<ImageTokens />} />
              <Route index element={<Navigate to="/token-calculator/text" replace />} />
            </Route>
            <Route path="/" element={<Navigate to="/tools/json/formatter" replace />} />
            <Route path="/chrome-plugin" element={<ChromePlugin />} />
            <Route path="*" element={<Navigate to="/tools/json/formatter" replace />} />
          </Routes>
        </Content>
        <footer className={`App-footer ${!hasAds ? 'no-ads' : ''}`}>
          {hasAds && (
            <div className="adsense-container">
              {/* cutool-banner */}
              <ins className="adsbygoogle"
                  style={{ display: 'block' }}
                  data-ad-client="ca-pub-1217509255829092"
                  data-ad-slot="2912112137"
                  data-ad-format="auto"
                  data-full-width-responsive="true">
              </ins>
            </div>
          )}
          <div className="beian-info">
            <a 
              href="https://beian.miit.gov.cn/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              苏ICP备19065574号-2
            </a>
          </div>
        </footer>
        <SpeedInsights />
      </div>
  );
}

function App() {
  const languageKey = i18n.language;

  return (
    <Router key={languageKey}>
      <AppContent />
    </Router>
  );
}

export default App; 