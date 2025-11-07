import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language || 'zh');

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLang(lng);
    };

    setCurrentLang(i18n.language);

    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      <button
        className={currentLang === 'en' ? 'active' : ''}
        onClick={() => changeLanguage('en')}
      >
        EN
      </button>
      <button
        className={currentLang === 'zh' ? 'active' : ''}
        onClick={() => changeLanguage('zh')}
      >
        中文
      </button>
    </div>
  );
}

export default LanguageSwitcher; 