import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Tools from './pages/Tools';
import AINav from './pages/AINav/AINav';
import LanguageSwitcher from './components/LanguageSwitcher';
import JsonFormatter from './pages/tools/JsonFormatter';
import XmlFormatter from './pages/tools/XmlFormatter';
import TextCompare from './pages/tools/TextCompare';
import UrlConverter from './pages/tools/UrlConverter/UrlConverter';
import JsonCompare from './pages/tools/JsonCompare/JsonCompare';
import './App.css';
import styled from 'styled-components';
import './i18n';

const Content = styled.div`
  margin: 0;
  padding: 0;
`;

function App() {
  const { t } = useTranslation();
  const feedbackEmail = 'xuwei8091@gmail.com';

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="tool-container">
            <div className="logo-area">
              <img src="/favicon.ico" alt="logo" className="logo-icon" />
              <h1>CUTool</h1>
            </div>
            <nav className="nav-area">
              <NavLink 
                to="/tools/json/formatter" 
                className={({ isActive }) => 
                  isActive ? 'nav-item active' : 'nav-item'
                }
              >
                {t('common.toolbox')}
              </NavLink>
              <NavLink 
                to="/ai-nav" 
                className={({ isActive }) => 
                  isActive ? 'nav-item active' : 'nav-item'
                }
              >
                {t('common.aiNav')}
              </NavLink>
            </nav>
            <div className="right-area">
              <LanguageSwitcher />
              <div id="feedback-button">
              <a 
                href={`mailto:${feedbackEmail}`}
                className="feedback-button"
                target="_blank"
                rel="noopener noreferrer"
              >
                反馈
              </a>

              </div>
              <div>dfasdf</div>
     
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
            <Route path="/" element={<Navigate to="/tools/json/formatter" replace />} />
            <Route path="*" element={<Navigate to="/tools/json/formatter" replace />} />
          </Routes>
        </Content>
        <footer className="App-footer">
          <div className="adsense-container">
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-1217509255829092"
                data-ad-slot="9011635562"
                data-ad-format="auto"
                data-full-width-responsive="true">
            </ins>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App; 