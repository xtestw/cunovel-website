import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './TokenCalculator.css';

function TokenCalculator() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  // 监听语言变化，强制重新渲染
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <div className="token-calculator">
      <div className="token-calculator-nav">
        <NavLink
          to="text"
          className={({ isActive }) =>
            isActive ? 'token-calculator-nav-item active' : 'token-calculator-nav-item'
          }
        >
          {t('tokenCalculator.textTokens')}
        </NavLink>
        <NavLink
          to="image"
          className={({ isActive }) =>
            isActive ? 'token-calculator-nav-item active' : 'token-calculator-nav-item'
          }
        >
          {t('tokenCalculator.imageTokens')}
        </NavLink>
      </div>
      <div className="price-disclaimer">
        <p>{t('tokenCalculator.priceDisclaimer')}</p>
      </div>
      <div className="token-calculator-content">
        <Outlet />
      </div>
    </div>
  );
}

export default TokenCalculator;
