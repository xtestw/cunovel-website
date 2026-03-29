'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginButton from '@/components/LoginButton';
import '@/App.css';

const Content = styled.div`
  margin: 0;
  padding: 0;
`;

export default function AppShell({ children }) {
  const { t, i18n } = useTranslation();
  const pathname = usePathname() || '';
  const feedbackEmail = 'xuwei8091@gmail.com';
  const [hasAds, setHasAds] = useState(false);
  const adInitialized = useRef(false);

  useEffect(() => {
    const initAds = () => {
      if (adInitialized.current) return;
      if (typeof window === 'undefined' || !window.adsbygoogle) return;
      try {
        const adContainers = document.querySelectorAll('.adsbygoogle:not([data-adsbygoogle-status])');
        if (adContainers.length > 0) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adInitialized.current = true;
        }
      } catch (error) {
        if (!error.message || !error.message.includes('already have ads')) {
          console.warn('AdSense initialization error:', error);
        }
      }
    };

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        initAds();
      } else {
        const checkScript = setInterval(() => {
          if (typeof window !== 'undefined' && window.adsbygoogle) {
            initAds();
            clearInterval(checkScript);
          }
        }, 100);
        setTimeout(() => clearInterval(checkScript), 10000);
      }
    }, 500);

    const checkTimer = setTimeout(() => {
      const adContainer = document.querySelector('.adsbygoogle');
      if (adContainer) {
        setHasAds(adContainer.innerHTML.trim().length > 0);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(checkTimer);
    };
  }, []);

  const isTodayDailyActive =
    pathname === '/ai-daily' ||
    pathname.startsWith('/ai-daily/day') ||
    pathname.startsWith('/ai-daily/article');

  return (
    <div className="App">
      <Helmet>
        <meta name="sogou_site_verification" content="0ZZ5kf0BG4" />
        <meta name="360-site-verification" content="6d82a11803ef6749aad7340caf7f9bb4" />
      </Helmet>
      <header className="App-header">
        <div className="tool-container">
          <Link href="/" className="logo-area" title={t('common.home')}>
            <img src="/favicon.ico" alt="CUTool" className="logo-icon" />
            <h1>CUTool</h1>
          </Link>
          <nav className="nav-area">
            <Link
              href="/"
              className="nav-item"
              style={{ color: pathname === '/' ? '#1890ff' : '#595959' }}
            >
              {t('common.home')}
            </Link>
            <Link
              href="/blog/intro"
              className="nav-item"
              style={{ color: pathname.startsWith('/blog') ? '#1890ff' : '#595959' }}
            >
              {t('common.blog')}
            </Link>
            <div className="nav-item nav-item-dropdown">
              <Link
                href="/ai-daily"
                className={`nav-item-link ${pathname.startsWith('/ai-daily') ? 'active' : ''}`}
                style={{
                  color: pathname.startsWith('/ai-daily') ? '#1890ff' : '#595959',
                }}
              >
                {t('common.aiDaily')}
              </Link>
              <div className="nav-dropdown-menu">
                <Link
                  href="/ai-daily"
                  className={`nav-dropdown-item ${isTodayDailyActive ? 'active' : ''}`}
                >
                  {t('common.todayDaily')}
                </Link>
                <Link
                  href="/ai-daily/history"
                  className={`nav-dropdown-item ${pathname === '/ai-daily/history' ? 'active' : ''}`}
                >
                  {t('common.historyDaily')}
                </Link>
              </div>
            </div>
            <div className="nav-item nav-item-dropdown">
              <div
                className={`nav-item-link ${
                  pathname.startsWith('/prompt-tutorial') ||
                  pathname.startsWith('/agent-skill') ||
                  pathname.startsWith('/hello-agents')
                    ? 'active'
                    : ''
                }`}
                style={{
                  color:
                    pathname.startsWith('/prompt-tutorial') ||
                    pathname.startsWith('/agent-skill') ||
                    pathname.startsWith('/hello-agents')
                      ? '#1890ff'
                      : '#595959',
                  cursor: 'pointer',
                }}
              >
                {t('common.aiTutorial')}
              </div>
              <div className="nav-dropdown-menu">
                <Link
                  href="/prompt-tutorial/intro"
                  className={`nav-dropdown-item ${pathname.startsWith('/prompt-tutorial') ? 'active' : ''}`}
                >
                  {t('common.promptTutorial')}
                </Link>
                <div
                  className={`nav-dropdown-nested ${
                    pathname.startsWith('/agent-skill') || pathname.startsWith('/hello-agents')
                      ? 'nav-dropdown-nested-active'
                      : ''
                  }`}
                >
                  <div className="nav-dropdown-nested-label">{t('common.aiAgent')}</div>
                  <div className="nav-dropdown-nested-menu">
                    <Link
                      href="/agent-skill/intro"
                      className={`nav-dropdown-item ${pathname.startsWith('/agent-skill') ? 'active' : ''}`}
                    >
                      {t('common.agentSkill')}
                    </Link>
                    <Link
                      href="/hello-agents/intro"
                      className={`nav-dropdown-item ${pathname.startsWith('/hello-agents') ? 'active' : ''}`}
                    >
                      {t('common.helloAgents')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {i18n.language.startsWith('zh') && (
              <div className="nav-item nav-item-dropdown">
                <Link
                  href="/phone-verify"
                  className={`nav-item-link ${
                    pathname.startsWith('/vehicle-verify') ||
                    pathname.startsWith('/phone-verify') ||
                    pathname.startsWith('/bank-card-verify')
                      ? 'active'
                      : ''
                  }`}
                  style={{
                    color:
                      pathname.startsWith('/vehicle-verify') ||
                      pathname.startsWith('/phone-verify') ||
                      pathname.startsWith('/bank-card-verify')
                        ? '#1890ff'
                        : '#595959',
                  }}
                >
                  {t('common.vehicleVerify')}
                </Link>
                <div className="nav-dropdown-menu">
                  <Link
                    href="/phone-verify"
                    className={`nav-dropdown-item ${pathname.startsWith('/phone-verify') ? 'active' : ''}`}
                  >
                    {t('common.phoneVerify')}
                  </Link>
                  <Link
                    href="/vehicle-verify"
                    className={`nav-dropdown-item ${
                      pathname === '/vehicle-verify' && !pathname.includes('/orders') ? 'active' : ''
                    }`}
                  >
                    {t('common.vehicleInfoVerify')}
                  </Link>
                  <Link
                    href="/bank-card-verify"
                    className={`nav-dropdown-item ${pathname === '/bank-card-verify' ? 'active' : ''}`}
                  >
                    {t('common.bankCardVerify')}
                  </Link>
                  <Link
                    href="/vehicle-verify/orders"
                    className={`nav-dropdown-item ${pathname === '/vehicle-verify/orders' ? 'active' : ''}`}
                  >
                    {t('common.orderHistory')}
                  </Link>
                </div>
              </div>
            )}
            <Link
              href="/tools/json/formatter"
              className="nav-item"
              style={{ color: pathname.startsWith('/tools') ? '#1890ff' : '#595959' }}
            >
              {t('common.toolbox')}
            </Link>
            <div className="nav-item nav-item-dropdown">
              <div
                className={`nav-item-link ${
                  pathname.startsWith('/token-calculator') || pathname.startsWith('/ai-nav') ? 'active' : ''
                }`}
                style={{
                  color:
                    pathname.startsWith('/token-calculator') || pathname.startsWith('/ai-nav')
                      ? '#1890ff'
                      : '#595959',
                  cursor: 'pointer',
                }}
              >
                {t('common.aiTools')}
              </div>
              <div className="nav-dropdown-menu">
                <Link
                  href="/token-calculator/text"
                  className={`nav-dropdown-item ${pathname.startsWith('/token-calculator') ? 'active' : ''}`}
                >
                  {t('common.tokenCalculator')}
                </Link>
                <Link
                  href="/ai-nav"
                  className={`nav-dropdown-item ${pathname.startsWith('/ai-nav') ? 'active' : ''}`}
                >
                  {t('common.aiNav')}
                </Link>
              </div>
            </div>
            <div className="nav-item nav-item-dropdown">
              <div
                className={`nav-item-link ${pathname.startsWith('/chrome-plugin') ? 'active' : ''}`}
                style={{
                  color: pathname.startsWith('/chrome-plugin') ? '#1890ff' : '#595959',
                  cursor: 'pointer',
                }}
              >
                {t('common.plugins')}
              </div>
              <div className="nav-dropdown-menu">
                <a
                  href="https://chromewebstore.google.com/detail/cutool/pnadcjmfdflpblaogepdpeooialeelno?hl=en-US&utm_source=ext_sidebar"
                  className="nav-dropdown-item"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('common.chromePlugin')}
                  <span className="external-link-icon">↗</span>
                </a>
                <a
                  href="https://plugins.jetbrains.com/plugin/26245-cutool?noRedirect=true"
                  className="nav-dropdown-item"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('common.ideaPlugin')}
                  <span className="external-link-icon">↗</span>
                </a>
              </div>
            </div>
          </nav>
          <div className="right-area">
            <LoginButton />
            <LanguageSwitcher />
            <a href={`mailto:${feedbackEmail}`} className="feedback-button" target="_blank" rel="noopener noreferrer">
              反馈
            </a>
          </div>
        </div>
      </header>
      <Content>{children}</Content>
      <footer className={`App-footer ${!hasAds ? 'no-ads' : ''}`}>
        {hasAds && (
          <div className="adsense-container">
            <ins
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-1217509255829092"
              data-ad-slot="2912112137"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        )}
        <div className="footer-links">
          <div className="footer-nav-links">
            <Link href="/about-us">{t('common.aboutUs')}</Link>
            <Link href="/contact-us">{t('common.contactUs')}</Link>
            <Link href="/privacy-policy">{t('common.privacyPolicy')}</Link>
            <Link href="/terms-of-service">{t('common.termsOfService')}</Link>
          </div>
          <div className="beian-info">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
              苏ICP备19065574号-4
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
