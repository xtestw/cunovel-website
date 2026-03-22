import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import './TokenCalculator.css';

function TokenCalculator({ children }) {
  const { t, i18n } = useTranslation();
  const pathname = usePathname() || '';
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
        <Link
          href="/token-calculator/text"
          className={
            pathname.endsWith('/text') || pathname === '/token-calculator'
              ? 'token-calculator-nav-item active'
              : 'token-calculator-nav-item'
          }
        >
          {t('tokenCalculator.textTokens')}
        </Link>
        <Link
          href="/token-calculator/image"
          className={
            pathname.endsWith('/image')
              ? 'token-calculator-nav-item active'
              : 'token-calculator-nav-item'
          }
        >
          {t('tokenCalculator.imageTokens')}
        </Link>
      </div>
      <div className="price-disclaimer">
        <p>{t('tokenCalculator.priceDisclaimer')}</p>
      </div>
      <div className="token-calculator-content">{children}</div>
    </div>
  );
}

export default TokenCalculator;
