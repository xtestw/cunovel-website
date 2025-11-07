import React, { useEffect, useState } from 'react';
import './AINav.css';
import { useTranslation } from 'react-i18next';

function AINav() {
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

  const aiTools = [
    {
      category: t('nav.tools.aiNav.categories.chat.title'),
      items: [
        { 
          name: t('nav.tools.aiNav.categories.chat.items.chatgpt.name'), 
          url: "https://chat.openai.com", 
          desc: t('nav.tools.aiNav.categories.chat.items.chatgpt.desc')
        },
        { 
          name: t('nav.tools.aiNav.categories.chat.items.claude.name'), 
          url: "https://claude.ai", 
          desc: t('nav.tools.aiNav.categories.chat.items.claude.desc')
        },
        { 
          name: t('nav.tools.aiNav.categories.chat.items.gemini.name'), 
          url: "https://gemini.google.com", 
          desc: t('nav.tools.aiNav.categories.chat.items.gemini.desc')
        }
      ]
    },
    {
      category: t('nav.tools.aiNav.categories.image.title'),
      items: [
        { 
          name: t('nav.tools.aiNav.categories.image.items.midjourney.name'), 
          url: "https://www.midjourney.com", 
          desc: t('nav.tools.aiNav.categories.image.items.midjourney.desc')
        },
        { 
          name: t('nav.tools.aiNav.categories.image.items.stableDiffusion.name'), 
          url: "https://stability.ai", 
          desc: t('nav.tools.aiNav.categories.image.items.stableDiffusion.desc')
        },
        { 
          name: t('nav.tools.aiNav.categories.image.items.dalle.name'), 
          url: "https://openai.com/dall-e-3", 
          desc: t('nav.tools.aiNav.categories.image.items.dalle.desc')
        }
      ]
    }
  ];

  return (
    <div className="ai-nav-page">
      <h1>{t('nav.tools.aiNav.title')}</h1>
      <div className="ai-categories">
        {aiTools.map((category, index) => (
          <div key={index} className="category-section">
            <h2>{category.category}</h2>
            <div className="tools-grid">
              {category.items.map((tool, toolIndex) => (
                <div key={toolIndex} className="tool-card">
                  <h3>{tool.name}</h3>
                  <p>{tool.desc}</p>
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    访问
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AINav; 