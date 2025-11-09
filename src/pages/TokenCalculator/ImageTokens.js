import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ImageTokens.css';

// 图片token计算模型配置
const IMAGE_MODEL_CONFIGS = {
  gpt4v: {
    name: 'GPT-4 Vision',
    baseTokens: 85,
    pricePerImage: 0.001275, // 每张图片的固定价格 - 2024年12月最新价格
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/docs/guides/vision',
    calculateTokens: (width, height) => {
      // GPT-4 Vision: 根据OpenAI官方公式校准
      // 规则：图片会被resize到最大边不超过2048px，短边不超过768px
      // 然后计算Tiles = ceil(width/512) × ceil(height/512)
      // Tokens = 85 + 170 × Tiles
      const maxDimension = 2048;
      const maxShortSide = 768;
      
      let w = width;
      let h = height;
      
      // 计算缩放比例
      const scaleLong = Math.max(width, height) > maxDimension ? maxDimension / Math.max(width, height) : 1;
      const scaleShort = Math.min(width, height) > maxShortSide ? maxShortSide / Math.min(width, height) : 1;
      const scale = Math.min(scaleLong, scaleShort);
      
      w = Math.floor(w * scale);
      h = Math.floor(h * scale);
      
      // 计算Tiles：ceil(width/512) × ceil(height/512)
      const tilesW = Math.ceil(w / 512);
      const tilesH = Math.ceil(h / 512);
      const tiles = tilesW * tilesH;
      
      // 官方公式：85 + 170 × Tiles
      return 85 + 170 * tiles;
    }
  },
  gpt4oVision: {
    name: 'GPT-4o Vision',
    baseTokens: 85,
    pricePerImage: 0.001275, // 每张图片的价格 - 2024年12月最新价格
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/docs/guides/vision',
    calculateTokens: (width, height) => {
      // GPT-4o Vision: 使用与GPT-4 Vision相同的公式
      // 规则：最大边不超过2048px，短边不超过768px
      // Tiles = ceil(width/512) × ceil(height/512)
      // Tokens = 85 + 170 × Tiles
      const maxDimension = 2048;
      const maxShortSide = 768;
      
      let w = width;
      let h = height;
      
      // 计算缩放比例
      const scaleLong = Math.max(width, height) > maxDimension ? maxDimension / Math.max(width, height) : 1;
      const scaleShort = Math.min(width, height) > maxShortSide ? maxShortSide / Math.min(width, height) : 1;
      const scale = Math.min(scaleLong, scaleShort);
      
      w = Math.floor(w * scale);
      h = Math.floor(h * scale);
      
      // 计算Tiles
      const tilesW = Math.ceil(w / 512);
      const tilesH = Math.ceil(h / 512);
      const tiles = tilesW * tilesH;
      
      // 官方公式：85 + 170 × Tiles
      return 85 + 170 * tiles;
    }
  },
  claude35SonnetVision: {
    name: 'Claude 3.5 Sonnet Vision',
    baseTokens: 85,
    pricePerImage: 0.003, // 每张图片的价格 - Claude 3.5 Sonnet最新版本
    pricingLink: 'https://www.anthropic.com/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/en/docs/build-with-claude/vision',
    calculateTokens: (width, height) => {
      // Claude 3.5 Sonnet: 图片会被resize到最大边4096px
      // 然后按像素数计算tokens
      const maxDimension = 4096;
      let w = width;
      let h = height;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        w = Math.floor(width * scale);
        h = Math.floor(height * scale);
      }
      
      const pixels = w * h;
      // Claude 3.5: 每256x256像素块约85 tokens
      if (pixels <= 65536) return 85; // <= 256x256
      if (pixels <= 262144) return 170; // <= 512x512
      if (pixels <= 1048576) return 340; // <= 1024x1024
      // 更大的图片：每增加约393216像素（约768x512）增加170 tokens
      const extraPixels = pixels - 1048576;
      const extraBlocks = Math.ceil(extraPixels / 393216);
      return 340 + (extraBlocks * 170);
    }
  },
  claude3OpusVision: {
    name: 'Claude 3 Opus Vision',
    baseTokens: 85,
    pricePerImage: 0.015, // 每张图片的价格 - 2024年12月最新价格
    pricingLink: 'https://www.anthropic.com/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/en/docs/build-with-claude/vision',
    calculateTokens: (width, height) => {
      // Claude 3: 图片会被resize到最大边4096px
      // 然后按像素数计算tokens
      const maxDimension = 4096;
      let w = width;
      let h = height;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        w = Math.floor(width * scale);
        h = Math.floor(height * scale);
      }
      
      const pixels = w * h;
      // Claude 3: 每256x256像素块约85 tokens
      // 更精确的计算：基于像素数
      if (pixels <= 65536) return 85; // <= 256x256
      if (pixels <= 262144) return 170; // <= 512x512
      if (pixels <= 1048576) return 340; // <= 1024x1024
      // 更大的图片：每增加约393216像素（约768x512）增加170 tokens
      const extraPixels = pixels - 1048576;
      const extraBlocks = Math.ceil(extraPixels / 393216);
      return 340 + (extraBlocks * 170);
    }
  },
  claude3SonnetVision: {
    name: 'Claude 3 Sonnet Vision',
    baseTokens: 85,
    pricePerImage: 0.003, // 每张图片的价格 - 2024年12月最新价格
    pricingLink: 'https://www.anthropic.com/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/en/docs/build-with-claude/vision',
    calculateTokens: (width, height) => {
      // Claude 3 Sonnet: 与Opus相同的计算方式
      const maxDimension = 4096;
      let w = width;
      let h = height;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        w = Math.floor(width * scale);
        h = Math.floor(height * scale);
      }
      
      const pixels = w * h;
      if (pixels <= 65536) return 85;
      if (pixels <= 262144) return 170;
      if (pixels <= 1048576) return 340;
      const extraPixels = pixels - 1048576;
      const extraBlocks = Math.ceil(extraPixels / 393216);
      return 340 + (extraBlocks * 170);
    }
  },
  claude3HaikuVision: {
    name: 'Claude 3 Haiku Vision',
    baseTokens: 85,
    pricePerImage: 0.00025, // 每张图片的价格 - Claude 3 Haiku最新版本
    pricingLink: 'https://www.anthropic.com/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/en/docs/build-with-claude/vision',
    calculateTokens: (width, height) => {
      // Claude 3 Haiku: 与其他Claude 3模型相同的计算方式
      const maxDimension = 4096;
      let w = width;
      let h = height;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        w = Math.floor(width * scale);
        h = Math.floor(height * scale);
      }
      
      const pixels = w * h;
      if (pixels <= 65536) return 85;
      if (pixels <= 262144) return 170;
      if (pixels <= 1048576) return 340;
      const extraPixels = pixels - 1048576;
      const extraBlocks = Math.ceil(extraPixels / 393216);
      return 340 + (extraBlocks * 170);
    }
  },
  gemini2FlashVision: {
    name: 'Gemini 2.0 Flash Vision',
    baseTokens: 85,
    pricePerImage: 0.000075, // 每张图片的价格 - Gemini 2.0 Flash最新版本
    pricingLink: 'https://ai.google.dev/pricing',
    tokenCalcLink: 'https://ai.google.dev/gemini-api/docs/vision',
    calculateTokens: (width, height) => {
      // Gemini 2.0 Flash: 图片会被resize，最大边4096px
      // 然后按像素数计算tokens
      const maxDimension = 4096;
      let w = width;
      let h = height;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        w = Math.floor(width * scale);
        h = Math.floor(height * scale);
      }
      
      const pixels = w * h;
      // Gemini 2.0: 每256x256像素块约85 tokens
      if (pixels <= 65536) return 85; // <= 256x256
      if (pixels <= 262144) return 170; // <= 512x512
      if (pixels <= 1048576) return 340; // <= 1024x1024
      // 更大的图片：每增加约393216像素增加170 tokens
      const extraPixels = pixels - 1048576;
      const extraBlocks = Math.ceil(extraPixels / 393216);
      return 340 + (extraBlocks * 170);
    }
  },
  gemini15ProVision: {
    name: 'Gemini 1.5 Pro Vision',
    baseTokens: 85,
    pricePerImage: 0.00125, // 每张图片的价格 - Gemini 1.5 Pro
    pricingLink: 'https://ai.google.dev/pricing',
    tokenCalcLink: 'https://ai.google.dev/gemini-api/docs/vision',
    calculateTokens: (width, height) => {
      // Gemini 1.5 Pro: 图片会被resize，最大边4096px
      const maxDimension = 4096;
      let w = width;
      let h = height;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        w = Math.floor(width * scale);
        h = Math.floor(height * scale);
      }
      
      const pixels = w * h;
      if (pixels <= 65536) return 85; // <= 256x256
      if (pixels <= 262144) return 170; // <= 512x512
      if (pixels <= 1048576) return 340; // <= 1024x1024
      const extraPixels = pixels - 1048576;
      const extraBlocks = Math.ceil(extraPixels / 393216);
      return 340 + (extraBlocks * 170);
    }
  },
  geminiProVision: {
    name: 'Gemini Pro Vision',
    baseTokens: 85,
    pricePerImage: 0.000125, // 每张图片的价格 - 2024年12月最新价格
    pricingLink: 'https://ai.google.dev/pricing',
    tokenCalcLink: 'https://ai.google.dev/gemini-api/docs/vision',
    calculateTokens: (width, height) => {
      // Gemini: 图片会被resize，最大边3072px
      // 然后按像素数计算tokens
      const maxDimension = 3072;
      let w = width;
      let h = height;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        w = Math.floor(width * scale);
        h = Math.floor(height * scale);
      }
      
      const pixels = w * h;
      // Gemini: 每256x256像素块约85 tokens
      if (pixels <= 65536) return 85; // <= 256x256
      if (pixels <= 262144) return 170; // <= 512x512
      if (pixels <= 1048576) return 340; // <= 1024x1024
      // 更大的图片：每增加约393216像素增加170 tokens
      const extraPixels = pixels - 1048576;
      const extraBlocks = Math.ceil(extraPixels / 393216);
      return 340 + (extraBlocks * 170);
    }
  },
  
  qwen2VL: {
    name: 'Qwen2-VL',
    baseTokens: 85,
    pricePerImage: 0.0008, // 每张图片的价格（估算）
    pricingLink: 'https://www.google.com/search?q=Qwen2-VL+pricing',
    tokenCalcLink: 'https://www.google.com/search?q=Qwen2-VL+token+calculation',
    calculateTokens: (width, height) => {
      // Qwen2-VL: 基于Qwen的视觉模型
      // 通常支持最大边4480px，使用patch-based计算
      // 类似GPT Vision的tiles方式，但patch大小为448x448
      const maxDimension = 4480;
      let w = width;
      let h = height;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        w = Math.floor(width * scale);
        h = Math.floor(height * scale);
      }
      
      // Qwen2-VL使用448x448的patch
      // 计算patches：ceil(width/448) × ceil(height/448)
      const patchesW = Math.ceil(w / 448);
      const patchesH = Math.ceil(h / 448);
      const patches = patchesW * patchesH;
      
      // 基础token + 每个patch约85 tokens
      return 85 + patches * 85;
    }
  },
  qwenVL: {
    name: 'Qwen-VL',
    baseTokens: 85,
    pricePerImage: 0.001, // 每张图片的价格（估算）
    pricingLink: 'https://www.google.com/search?q=Qwen-VL+pricing',
    tokenCalcLink: 'https://www.google.com/search?q=Qwen-VL+token+calculation',
    calculateTokens: (width, height) => {
      // Qwen-VL: 第一代Qwen视觉模型
      // 通常支持最大边2048px，使用patch-based计算
      const maxDimension = 2048;
      let w = width;
      let h = height;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        w = Math.floor(width * scale);
        h = Math.floor(height * scale);
      }
      
      // Qwen-VL使用448x448的patch
      const patchesW = Math.ceil(w / 448);
      const patchesH = Math.ceil(h / 448);
      const patches = patchesW * patchesH;
      
      // 基础token + 每个patch约85 tokens
      return 85 + patches * 85;
    }
  },
  qwenVLMax: {
    name: 'Qwen-VL-Max',
    baseTokens: 4,
    pricePerImage: 0.0012, // 每张图片的价格（估算）
    pricingLink: 'https://www.alibabacloud.com/help/en/model-studio',
    tokenCalcLink: 'https://help.aliyun.com/zh/model-studio/vision/',
    calculateTokens: (width, height) => {
      // Qwen-VL-Max: 根据阿里云官方文档
      // 规则：每28×28像素对应1个Token（标准版本）
      // 注意：qwen-vl-max-0813及之后版本、qwen-vl-plus-0710及之后版本使用32×32
      // 单张图片最少4个Token，最多1280个Token
      // 需要将宽高调整为28的整数倍（向上取整）
      
      // 将宽高调整为28的整数倍（向上取整）
      const wAdjusted = Math.ceil(width / 28) * 28;
      const hAdjusted = Math.ceil(height / 28) * 28;
      
      // 计算Token数量：每28×28像素 = 1个Token
      let tokenCount = (wAdjusted * hAdjusted) / (28 * 28);
      
      // 应用最小和最大限制
      // 最小4个Token，最大1280个Token
      tokenCount = Math.max(4, Math.min(1280, tokenCount));
      
      return Math.ceil(tokenCount);
    }
  },
  deepseekVision: {
    name: 'DeepSeek Vision',
    baseTokens: 85,
    pricePerImage: 0.0008, // 每张图片的价格（估算）
    pricingLink: 'https://www.google.com/search?q=DeepSeek+Vision+pricing',
    tokenCalcLink: 'https://www.google.com/search?q=DeepSeek+Vision+token+calculation',
    calculateTokens: (width, height) => {
      // DeepSeek Vision: 基于类似GPT Vision的计算方式
      // 规则：图片会被resize到最大边不超过2048px
      // 使用类似GPT的tiles方式，但具体规则可能不同
      // 估算：每32×32像素 = 1个Token（基于搜索结果）
      const maxDimension = 2048;
      let w = width;
      let h = height;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        w = Math.floor(width * scale);
        h = Math.floor(height * scale);
      }
      
      // 每32×32像素 = 1个Token
      const patchesW = Math.ceil(w / 32);
      const patchesH = Math.ceil(h / 32);
      const patches = patchesW * patchesH;
      
      // 基础token + 每个patch 1个token
      return Math.max(85, patches);
    }
  },
  minimaxVision: {
    name: 'MiniMax Vision',
    baseTokens: 85,
    pricePerImage: 0.0006, // 每张图片的价格（估算）
    pricingLink: 'https://www.google.com/search?q=MiniMax+Vision+pricing',
    tokenCalcLink: 'https://www.google.com/search?q=MiniMax+Vision+token+calculation',
    calculateTokens: (width, height) => {
      // MiniMax Vision: 基于类似GPT Vision的计算方式
      // 规则：图片会被resize到最大边不超过2048px
      // 使用类似GPT的tiles方式，但具体规则可能不同
      // 估算：每32×32像素 = 1个Token（基于搜索结果）
      const maxDimension = 2048;
      let w = width;
      let h = height;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        w = Math.floor(width * scale);
        h = Math.floor(height * scale);
      }
      
      // 每32×32像素 = 1个Token
      const patchesW = Math.ceil(w / 32);
      const patchesH = Math.ceil(h / 32);
      const patches = patchesW * patchesH;
      
      // 基础token + 每个patch 1个token
      return Math.max(85, patches);
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
  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: 'asc' // 'asc' or 'desc'
  });

  useEffect(() => {
    const models = {};

    Object.entries(IMAGE_MODEL_CONFIGS).forEach(([key, config]) => {
      const tokenCount = config.calculateTokens(dimensions.width, dimensions.height);
      // 计算每百万tokens的价格：pricePerImage / tokenCount * 1000000
      // 官方定价：每百万tokens的价格（基于当前图片的token数转换）
      const pricePerMillionTokens = tokenCount > 0 
        ? (config.pricePerImage / tokenCount * 1000000).toFixed(2)
        : '0.00';
      // 预估价格：基于当前token数计算的价格
      // 每token价格 = pricePerImage / tokenCount
      // 预估价格 = tokenCount * (pricePerImage / tokenCount) = pricePerImage
      const estimatedPrice = config.pricePerImage.toFixed(6);
      models[key] = {
        tokens: tokenCount,
        pricePerMillionTokens: pricePerMillionTokens,
        estimatedPrice: estimatedPrice
      };
    });

    setStats({ models });
  }, [dimensions]);

  const handleSort = (field) => {
    setSortConfig(prevConfig => {
      if (prevConfig.field === field) {
        return {
          field,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        field,
        direction: 'asc'
      };
    });
  };

  const getSortedModels = () => {
    const entries = Object.entries(IMAGE_MODEL_CONFIGS);
    if (!sortConfig.field) {
      return entries;
    }

    return [...entries].sort((a, b) => {
      const [keyA, configA] = a;
      const [keyB, configB] = b;
      let valueA, valueB;

      switch (sortConfig.field) {
        case 'model':
          valueA = configA.name.toLowerCase();
          valueB = configB.name.toLowerCase();
          break;
        case 'tokens':
          valueA = stats.models[keyA]?.tokens || 0;
          valueB = stats.models[keyB]?.tokens || 0;
          break;
        case 'officialPrice':
          valueA = parseFloat(stats.models[keyA]?.pricePerMillionTokens || 0);
          valueB = parseFloat(stats.models[keyB]?.pricePerMillionTokens || 0);
          break;
        case 'estimatedPrice':
          valueA = parseFloat(stats.models[keyA]?.estimatedPrice || 0);
          valueB = parseFloat(stats.models[keyB]?.estimatedPrice || 0);
          break;
        default:
          return 0;
      }

      if (typeof valueA === 'string') {
        return sortConfig.direction === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else {
        return sortConfig.direction === 'asc' 
          ? valueA - valueB
          : valueB - valueA;
      }
    });
  };

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
        <h3>{t('tokenCalculator.visionModelsTitle')}</h3>
        <div className="models-table-container">
          <table className="models-table">
            <thead>
              <tr>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('model')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {t('tokenCalculator.table.model')}
                  {sortConfig.field === 'model' && (
                    <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('tokens')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {t('tokenCalculator.tokenCount')}
                  {sortConfig.field === 'tokens' && (
                    <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('officialPrice')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {t('tokenCalculator.table.officialPrice')} ({t('tokenCalculator.pricing.perMillionTokens')})
                  {sortConfig.field === 'officialPrice' && (
                    <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('estimatedPrice')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {t('tokenCalculator.table.estimatedPrice')}
                  {sortConfig.field === 'estimatedPrice' && (
                    <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
                <th>{t('tokenCalculator.table.links')}</th>
              </tr>
            </thead>
            <tbody>
              {getSortedModels().map(([key, config]) => (
                <tr key={key}>
                  <td className="model-name">{config.name}</td>
                  <td className="token-count">{stats.models[key]?.tokens || 0}</td>
                  <td className="price-value">${stats.models[key]?.pricePerMillionTokens || '0.00'}</td>
                  <td className="price-value">${stats.models[key]?.estimatedPrice || '0.000000'}</td>
                  <td className="links-cell">
                    <div className="links-group">
                      <a 
                        href={config.pricingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link-item"
                        title={t('tokenCalculator.table.pricingLink')}
                      >
                        {t('tokenCalculator.table.pricing')}
                      </a>
                      <a 
                        href={config.tokenCalcLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link-item"
                        title={t('tokenCalculator.table.tokenCalcLink')}
                      >
                        {t('tokenCalculator.table.tokenCalc')}
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ImageTokens;
