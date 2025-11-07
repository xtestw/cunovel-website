import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ImageTokens.css';

// 图片token计算模型配置
const IMAGE_MODEL_CONFIGS = {
  gpt4v: {
    name: 'GPT-4 Vision',
    baseTokens: 85,
    pricePerImage: 0.0013, // 每张图片的固定价格
    calculateTokens: (width, height) => {
      const shortSide = Math.min(width, height);
      const longSide = Math.max(width, height);
      const ratio = longSide / shortSide;

      let tokens = 85; // 基础token

      if (shortSide <= 512 && longSide <= 512) {
        tokens = 85;
      } else if (shortSide <= 512) {
        if (longSide <= 1024) tokens = 170;
        else tokens = 340;
      } else if (shortSide <= 1024) {
        if (longSide <= 1024) tokens = 170;
        else tokens = 340;
      } else {
        tokens = 340;
      }

      return tokens;
    }
  },
  claudeVision: {
    name: 'Claude Vision',
    baseTokens: 85,
    pricePerImage: 0.0048, // 每张图片的价格
    calculateTokens: (width, height) => {
      // Claude的图片token计算相对简单
      const pixels = width * height;
      if (pixels <= 65536) return 85; // 256x256 or smaller
      if (pixels <= 262144) return 170; // 512x512 or smaller
      return 340; // larger images
    }
  },
  geminiVision: {
    name: 'Gemini Vision',
    baseTokens: 85,
    pricePerImage: 0.00025, // 每张图片的价格
    calculateTokens: (width, height) => {
      // Gemini的token计算
      const pixels = width * height;
      if (pixels <= 65536) return 85;
      if (pixels <= 262144) return 170;
      return 340;
    }
  }
};

function ImageTokens() {
  const { t, i18n } = useTranslation();
  const [dimensions, setDimensions] = useState({
    width: 1024,
    height: 1024
  });
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
    models: {}
  });

  useEffect(() => {
    const models = {};

    Object.entries(IMAGE_MODEL_CONFIGS).forEach(([key, config]) => {
      const tokenCount = config.calculateTokens(dimensions.width, dimensions.height);
      models[key] = {
        tokens: tokenCount,
        price: config.pricePerImage.toFixed(6)
      };
    });

    setStats({ models });
  }, [dimensions]);

  const handleDimensionChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    setDimensions(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const getAspectRatio = () => {
    if (dimensions.width === 0 || dimensions.height === 0) return '1:1';
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(dimensions.width, dimensions.height);
    return `${dimensions.width / divisor}:${dimensions.height / divisor}`;
  };

  return (
    <div className="image-tokens">
      <div className="image-input-section">
        <h2>{t('tokenCalculator.imageTokens')}</h2>
        <div className="dimension-inputs">
          <div className="input-group">
            <label htmlFor="width">Width (px)</label>
            <input
              id="width"
              type="number"
              min="1"
              max="4096"
              value={dimensions.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              className="dimension-input"
            />
          </div>
          <span className="dimension-separator">×</span>
          <div className="input-group">
            <label htmlFor="height">Height (px)</label>
            <input
              id="height"
              type="number"
              min="1"
              max="4096"
              value={dimensions.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              className="dimension-input"
            />
          </div>
        </div>
        <div className="image-info">
          <div className="info-item">
            <span className="info-label">Resolution:</span>
            <span className="info-value">{dimensions.width} × {dimensions.height} px</span>
          </div>
          <div className="info-item">
            <span className="info-label">Aspect Ratio:</span>
            <span className="info-value">{getAspectRatio()}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Pixels:</span>
            <span className="info-value">{(dimensions.width * dimensions.height).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="models-section">
        <h3>AI Vision Models</h3>
        <div className="models-grid">
          {Object.entries(IMAGE_MODEL_CONFIGS).map(([key, config]) => (
            <div key={key} className="model-card">
              <div className="model-header">
                <h4>{config.name}</h4>
                <div className="token-count">
                  {stats.models[key]?.tokens || 0} {t('tokenCalculator.tokenCount')}
                </div>
              </div>
              <div className="pricing-info">
                <div className="price-row">
                  <span className="price-label">Price per image:</span>
                  <span className="price-value">${stats.models[key]?.price || '0.000000'}</span>
                </div>
                <div className="price-note">
                  (Fixed price per image)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageTokens;
