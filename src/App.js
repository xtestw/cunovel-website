import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SpeedInsights } from '@vercel/speed-insights/react';
import i18n from './i18n';
import Tools from './pages/Tools';
import AINav from './pages/AINav/AINav';
import LanguageSwitcher from './components/LanguageSwitcher';
import TokenCalculator from './pages/TokenCalculator/TokenCalculator';
import TextTokens from './pages/TokenCalculator/TextTokens';
import ImageTokens from './pages/TokenCalculator/ImageTokens';
import './App.css';
import styled from 'styled-components';
import './i18n';
import ChromePlugin from './pages/ChromePlugin';

const Content = styled.div`
  margin: 0;
  padding: 0;
`;

function App() {
  const { t } = useTranslation();
  const feedbackEmail = 'xuwei8091@gmail.com';
  const [hasAds, setHasAds] = useState(false);
  const [languageKey, setLanguageKey] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguageKey(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, []);

  // 检查广告是否加载
  useEffect(() => {
    const checkAdsLoaded = () => {
      const adContainer = document.querySelector('.adsbygoogle');
      if (adContainer) {
        const hasContent = adContainer.innerHTML.trim().length > 0;
        setHasAds(hasContent);
      }
    };

    // 广告加载可能需要一点时间
    setTimeout(checkAdsLoaded, 1000);
  }, []);

  return (
    <Router key={languageKey}>
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
    </Router>
  );
}

export default App; 