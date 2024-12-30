import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      <button 
        className={i18n.language === 'en' ? 'active' : ''} 
        onClick={() => changeLanguage('en')}
      >
        EN
      </button>
      <button 
        className={i18n.language === 'zh' ? 'active' : ''} 
        onClick={() => changeLanguage('zh')}
      >
        中文
      </button>
    </div>
  );
}

export default LanguageSwitcher; 