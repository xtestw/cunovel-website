import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './TextTokens.css';

// Token计算模型配置
const MODEL_CONFIGS = {
  gpt4: {
    name: 'gpt4',
    inputPrice: 0.03, // 每1000 tokens $0.03
    outputPrice: 0.06, // 每1000 tokens $0.06
    tokenRatio: 0.25 // 英文字符:token比例
  },
  gpt35turbo: {
    name: 'gpt35turbo',
    inputPrice: 0.002, // 每1000 tokens $0.002
    outputPrice: 0.002, // 每1000 tokens $0.002
    tokenRatio: 0.25
  },
  claude: {
    name: 'claude',
    inputPrice: 0.008, // 每1000 tokens $0.008
    outputPrice: 0.024, // 每1000 tokens $0.024
    tokenRatio: 0.25
  },
  gemini: {
    name: 'gemini',
    inputPrice: 0.0025, // 每1000 tokens $0.0025
    outputPrice: 0.01, // 每1000 tokens $0.01
    tokenRatio: 0.25
  },
  qwen: {
    name: 'qwen',
    inputPrice: 0.002, // 每1000 tokens $0.002
    outputPrice: 0.006, // 每1000 tokens $0.006
    tokenRatio: 0.5 // 中文更保守的估算
  }
};

// 计算token数的函数
const calculateTokens = (text, modelConfig) => {
  if (!text) return 0;

  // 检查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const ratio = hasChinese ? modelConfig.tokenRatio * 2 : modelConfig.tokenRatio;

  return Math.ceil(text.length * ratio);
};

// 计算价格的函数
const calculatePrice = (tokenCount, pricePerThousand) => {
  return (tokenCount * pricePerThousand / 1000).toFixed(6);
};

function TextTokens() {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState('');
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
  const [stats, setStats] = useState({
    characters: 0,
    models: {}
  });

  useEffect(() => {
    const characters = text.length;
    const models = {};

    Object.entries(MODEL_CONFIGS).forEach(([key, config]) => {
      const tokenCount = calculateTokens(text, config);
      models[key] = {
        tokens: tokenCount,
        inputPrice: calculatePrice(tokenCount, config.inputPrice),
        outputPrice: calculatePrice(tokenCount, config.outputPrice)
      };
    });

    setStats({ characters, models });
  }, [text]);

  return (
    <div className="text-tokens">
      <div className="text-input-section">
        <h2>{t('tokenCalculator.textTokens')}</h2>
        <textarea
          className="text-input"
          placeholder={t('tokenCalculator.inputPlaceholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
        />
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">{t('tokenCalculator.characterCount')}:</span>
            <span className="stat-value">{stats.characters}</span>
          </div>
        </div>
      </div>

      <div className="models-section">
        <h3>{t('tokenCalculator.modelsTitle')}</h3>
        <div className="models-grid">
          {Object.entries(MODEL_CONFIGS).map(([key, config]) => (
            <div key={key} className="model-card">
              <div className="model-header">
                <h4>{t(`tokenCalculator.models.${key}`)}</h4>
                <div className="token-count">
                  {stats.models[key]?.tokens || 0} {t('tokenCalculator.tokenCount')}
                </div>
              </div>
              <div className="pricing-info">
                <div className="price-row">
                  <span className="price-label">{t('tokenCalculator.pricing.input')}:</span>
                  <span className="price-value">${stats.models[key]?.inputPrice || '0.000000'}</span>
                </div>
                <div className="price-row">
                  <span className="price-label">{t('tokenCalculator.pricing.output')}:</span>
                  <span className="price-value">${stats.models[key]?.outputPrice || '0.000000'}</span>
                </div>
                <div className="price-note">
                  ({t('tokenCalculator.pricing.perMillionTokens')})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TextTokens;
