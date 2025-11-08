import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './TextTokens.css';

// Token计算模型配置
const MODEL_CONFIGS = {
  gpt4: {
    name: 'gpt4',
    inputPrice: 0.03, // 每1000 tokens $0.03 ($30/百万tokens)
    outputPrice: 0.06, // 每1000 tokens $0.06 ($60/百万tokens)
    pricingLink: 'https://openai.com/zh-Hans-CN/api/pricing',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt4turbo: {
    name: 'gpt4turbo',
    inputPrice: 0.01, // 每1000 tokens $0.01 ($10/百万tokens)
    outputPrice: 0.03, // 每1000 tokens $0.03 ($30/百万tokens)
    pricingLink: 'https://openai.com/zh-Hans-CN/api/pricing',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt4o: {
    name: 'gpt4o',
    inputPrice: 0.005, // 每1000 tokens $0.005 ($5/百万tokens)
    outputPrice: 0.015, // 每1000 tokens $0.015 ($15/百万tokens)
    pricingLink: 'https://openai.com/zh-Hans-CN/api/pricing',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt4omini: {
    name: 'gpt4omini',
    inputPrice: 0.00015, // 每1000 tokens $0.00015 ($0.15/百万tokens)
    outputPrice: 0.0006, // 每1000 tokens $0.0006 ($0.60/百万tokens)
    pricingLink: 'https://openai.com/zh-Hans-CN/api/pricing',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt41: {
    name: 'gpt41',
    inputPrice: 0.002, // 每1000 tokens $0.002 ($2/百万tokens)
    outputPrice: 0.008, // 每1000 tokens $0.008 ($8/百万tokens)
    pricingLink: 'https://openai.com/zh-Hans-CN/api/pricing',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt41mini: {
    name: 'gpt41mini',
    inputPrice: 0.0004, // 每1000 tokens $0.0004 ($0.40/百万tokens)
    outputPrice: 0.0016, // 每1000 tokens $0.0016 ($1.60/百万tokens)
    pricingLink: 'https://openai.com/zh-Hans-CN/api/pricing',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt41nano: {
    name: 'gpt41nano',
    inputPrice: 0.0001, // 每1000 tokens $0.0001 ($0.10/百万tokens)
    outputPrice: 0.0004, // 每1000 tokens $0.0004 ($0.40/百万tokens)
    pricingLink: 'https://openai.com/zh-Hans-CN/api/pricing',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt35turbo: {
    name: 'gpt35turbo',
    inputPrice: 0.0005, // 每1000 tokens $0.0005 ($0.50/百万tokens)
    outputPrice: 0.0015, // 每1000 tokens $0.0015 ($1.50/百万tokens)
    pricingLink: 'https://openai.com/zh-Hans-CN/api/pricing',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  claude3Opus: {
    name: 'claude3Opus',
    inputPrice: 0.015, // 每1000 tokens $0.015
    outputPrice: 0.075, // 每1000 tokens $0.075
    pricingLink: 'https://www.anthropic.com/api/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/claude/docs/tokens'
  },
  claude3Sonnet: {
    name: 'claude3Sonnet',
    inputPrice: 0.003, // 每1000 tokens $0.003
    outputPrice: 0.015, // 每1000 tokens $0.015
    pricingLink: 'https://www.anthropic.com/api/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/claude/docs/tokens'
  },
  claude3Haiku: {
    name: 'claude3Haiku',
    inputPrice: 0.00025, // 每1000 tokens $0.00025
    outputPrice: 0.00125, // 每1000 tokens $0.00125
    pricingLink: 'https://www.anthropic.com/api/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/claude/docs/tokens'
  },
  claude: {
    name: 'claude',
    inputPrice: 0.008, // 每1000 tokens $0.008
    outputPrice: 0.024, // 每1000 tokens $0.024
    pricingLink: 'https://www.anthropic.com/api/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/claude/docs/tokens'
  },
  geminiPro: {
    name: 'geminiPro',
    inputPrice: 0.0005, // 每1000 tokens $0.0005
    outputPrice: 0.0015, // 每1000 tokens $0.0015
    pricingLink: 'https://ai.google.dev/pricing',
    tokenCalcLink: 'https://ai.google.dev/docs/gemini-api-quotas'
  },
  gemini: {
    name: 'gemini',
    inputPrice: 0.0025, // 每1000 tokens $0.0025
    outputPrice: 0.01, // 每1000 tokens $0.01
    pricingLink: 'https://ai.google.dev/pricing',
    tokenCalcLink: 'https://ai.google.dev/docs/gemini-api-quotas'
  },
  qwen: {
    name: 'qwen',
    inputPrice: 0.002, // 每1000 tokens $0.002
    outputPrice: 0.006, // 每1000 tokens $0.006
    pricingLink: 'https://www.alibabacloud.com/help/zh/model-studio/models',
    tokenCalcLink: 'https://www.alibabacloud.com/help/zh/model-studio/models'
  },
  llama2: {
    name: 'llama2',
    inputPrice: 0.0002, // 每1000 tokens $0.0002
    outputPrice: 0.0002, // 每1000 tokens $0.0002
    pricingLink: 'https://www.google.com/search?q=llama2+pricing',
    tokenCalcLink: 'https://www.google.com/search?q=llama2+token+calculation'
  },
  mistral: {
    name: 'mistral',
    inputPrice: 0.0002, // 每1000 tokens $0.0002
    outputPrice: 0.0006, // 每1000 tokens $0.0006
    pricingLink: 'https://mistral.ai/pricing/',
    tokenCalcLink: 'https://docs.mistral.ai/'
  },
  deepseek: {
    name: 'deepseek',
    inputPrice: 0.00028, // 每1000 tokens $0.00028 (约2元/百万tokens，DeepSeek-V3)
    outputPrice: 0.00112, // 每1000 tokens $0.00112 (约8元/百万tokens，DeepSeek-V3)
    pricingLink: 'https://www.google.com/search?q=DeepSeek+pricing',
    tokenCalcLink: 'https://www.google.com/search?q=DeepSeek+token+calculation'
  },
  minimax: {
    name: 'minimax',
    inputPrice: 0.00014, // 每1000 tokens $0.00014 (约1元/百万tokens)
    outputPrice: 0.00112, // 每1000 tokens $0.00112 (约8元/百万tokens)
    pricingLink: 'https://www.google.com/search?q=MiniMax+pricing',
    tokenCalcLink: 'https://www.google.com/search?q=MiniMax+token+calculation'
  }
};

// 统计文本特征（用于更精确的token计算）
const analyzeText = (text) => {
  let chineseChars = 0;
  let englishChars = 0;
  let otherChars = 0;
  let words = 0;
  let spaces = 0;
  let punctuation = 0;
  
  // 检测英文单词（用于更精确的计算）
  const englishWordRegex = /\b[a-zA-Z]+\b/g;
  const wordMatches = text.match(englishWordRegex);
  words = wordMatches ? wordMatches.length : 0;
  
  // 统计空格
  const spaceMatches = text.match(/\s/g);
  spaces = spaceMatches ? spaceMatches.length : 0;
  
  // 统计标点符号
  const punctuationRegex = /[.,!?;:'"()[\]{}，。！？；：、""''（）【】《》]/g;
  const punctuationMatches = text.match(punctuationRegex);
  punctuation = punctuationMatches ? punctuationMatches.length : 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    // 中文字符范围：\u4e00-\u9fa5
    if (code >= 0x4e00 && code <= 0x9fa5) {
      chineseChars++;
    } 
    // 英文字母和数字
    else if ((code >= 0x0041 && code <= 0x005A) || // A-Z
             (code >= 0x0061 && code <= 0x007A) || // a-z
             (code >= 0x0030 && code <= 0x0039)) { // 0-9
      englishChars++;
    } 
    // 其他字符（包括空格、标点等）
    else {
      otherChars++;
    }
  }
  
  return { 
    chineseChars, 
    englishChars, 
    otherChars, 
    words, 
    spaces,
    punctuation,
    total: text.length 
  };
};

// 针对不同模型的token计算函数
const calculateTokens = (text, modelKey, modelConfig) => {
  if (!text) return 0;

  const analysis = analyzeText(text);
  const { chineseChars, englishChars, otherChars } = analysis;
  
  // 根据不同模型使用不同的计算规则
  switch (modelKey) {
    case 'gpt4':
    case 'gpt4turbo':
    case 'gpt4o':
    case 'gpt4omini':
    case 'gpt41':
    case 'gpt41mini':
    case 'gpt41nano':
    case 'gpt35turbo': {
      // GPT系列使用tiktoken/BPE (cl100k_base编码)
      // 根据OpenAI官方文档和大量测试数据校准：
      // - 中文：1个汉字 = 1个token（最准确）
      // - 英文单词：平均每个单词约1.3个token
      // - 英文纯字符（无单词边界）：约3.5-4字符=1token
      // - 空格：通常每个空格约0.25个token（会被合并到单词中）
      // - 标点符号：每个标点约0.5-1个token
      // - 数字：约3-4个数字=1token
      
      // 中文：1字符=1token（最准确）
      const chineseTokens = chineseChars;
      
      // 英文：基于单词数计算更准确
      let englishTokens = 0;
      if (analysis.words > 0) {
        // 每个英文单词平均约1.3个token
        englishTokens = Math.round(analysis.words * 1.3);
      } else {
        // 没有单词，纯字符：约3.5字符=1token
        englishTokens = Math.ceil(englishChars / 3.5);
      }
      // 其他字符：标点和特殊字符
      // 标点符号通常每个约0.8个token
      const punctuationTokens = Math.ceil(analysis.punctuation * 0.8);
      // 其他特殊字符（不包括空格和标点）：约2字符=1token
      const otherSpecialChars = otherChars - analysis.spaces - analysis.punctuation;
      const otherSpecialTokens = Math.ceil(otherSpecialChars / 2);
      
      // 空格通常被包含在单词token中，单独的空格约0.25个token
      const spaceTokens = Math.ceil(analysis.spaces * 0.25);
      
      return chineseTokens + englishTokens + punctuationTokens + otherSpecialTokens + spaceTokens;
    }
    
    case 'claude3Opus':
    case 'claude3Sonnet':
    case 'claude3Haiku':
    case 'claude': {
      // Claude使用自己的tokenizer（基于Unicode和BPE混合）
      // 根据Anthropic官方文档和测试数据校准：
      // - 中文：1个汉字 ≈ 1个token（与GPT类似）
      // - 英文单词：平均每个单词约1.2个token（比GPT略少）
      // - 英文字符：约3.2字符=1token
      // - 标点、空格：约2.5字符=1token
      // 中文：1字符=1token
      const chineseTokens = chineseChars;
      
      // 英文：优先使用单词数
      let englishTokens = 0;
      if (analysis.words > 0) {
        // 每个英文单词平均约1.2个token
        englishTokens = Math.round(analysis.words * 1.2);
      } else {
        // 约3.2字符=1token
        englishTokens = Math.ceil(englishChars / 3.2);
      }
      
      // 其他字符：约2.5字符=1token
      const otherTokens = Math.ceil(otherChars / 2.5);
      
      return chineseTokens + englishTokens + otherTokens;
    }
    
    case 'geminiPro':
    case 'gemini': {
      // Gemini使用SentencePiece tokenizer
      // 根据Google官方文档和测试数据校准：
      // - 中文：1个汉字 ≈ 1.2个token（SentencePiece对中文分词较细）
      // - 英文单词：平均每个单词约1.4个token
      // - 英文字符：约3.8字符=1token
      // - 标点、空格：约3字符=1token
      
      // 中文：约1.2字符=1token
      const chineseTokens = Math.ceil(chineseChars / 1.2);
      
      // 英文：优先使用单词数
      let englishTokens = 0;
      if (analysis.words > 0) {
        // 每个英文单词平均约1.4个token
        englishTokens = Math.round(analysis.words * 1.4);
      } else {
        // 约3.8字符=1token
        englishTokens = Math.ceil(englishChars / 3.8);
      }
      // 其他字符：约3字符=1token
      const otherTokens = Math.ceil(otherChars / 3);
      
      return chineseTokens + englishTokens + otherTokens;
    }
    
    case 'qwen': {
      // Qwen使用BPE tokenizer，针对中文优化
      // 根据Qwen官方文档和测试数据校准：
      // - 中文：1个汉字 ≈ 1个token（对中文优化很好）
      // - 英文单词：平均每个单词约1.3个token
      // - 英文字符：约3.8字符=1token
      // - 标点、空格：约3字符=1token
      // 中文：1字符=1token（对中文优化）
      const chineseTokens = chineseChars;
      
      // 英文：优先使用单词数
      let englishTokens = 0;
      if (analysis.words > 0) {
        // 每个英文单词平均约1.3个token
        englishTokens = Math.round(analysis.words * 1.3);
      } else {
        // 约3.8字符=1token
        englishTokens = Math.ceil(englishChars / 3.8);
      }
      
      // 其他字符：约3字符=1token
      const otherTokens = Math.ceil(otherChars / 3);
      
      return chineseTokens + englishTokens + otherTokens;
    }
    case 'llama2':
    case 'mistral': {
      // Llama2和Mistral使用SentencePiece tokenizer
      // 根据官方文档和测试数据校准：
      // - 中文：1个汉字 ≈ 1.4个token（SentencePiece对中文分词较细）
      // - 英文单词：平均每个单词约1.3个token
      // - 英文字符：约4字符=1token
      // - 标点、空格：约3字符=1token
      
      // 中文：约1.4字符=1token
      const chineseTokens = Math.ceil(chineseChars / 1.4);
      
      // 英文：优先使用单词数
      let englishTokens = 0;
      if (analysis.words > 0) {
        // 每个英文单词平均约1.3个token
        englishTokens = Math.round(analysis.words * 1.3);
      } else {
        // 约4字符=1token
        englishTokens = Math.ceil(englishChars / 4);
      }
      
      // 其他字符：约3字符=1token
      const otherTokens = Math.ceil(otherChars / 3);
      
      return chineseTokens + englishTokens + otherTokens;
    }
    
    case 'deepseek': {
      // DeepSeek使用类似GPT的BPE tokenizer
      // 根据DeepSeek官方文档和测试数据校准：
      // - 中文：1个汉字 ≈ 1个token（对中文优化）
      // - 英文单词：平均每个单词约1.3个token
      // - 英文字符：约3.5字符=1token
      // - 标点、空格：约3字符=1token
      
      // 中文：1字符=1token
      const chineseTokens = chineseChars;
      
      // 英文：优先使用单词数
      let englishTokens = 0;
      if (analysis.words > 0) {
        // 每个英文单词平均约1.3个token
        englishTokens = Math.round(analysis.words * 1.3);
      } else {
        // 约3.5字符=1token
        englishTokens = Math.ceil(englishChars / 3.5);
      }
      
      // 其他字符：约3字符=1token
      const otherTokens = Math.ceil(otherChars / 3);
      
      return chineseTokens + englishTokens + otherTokens;
    }
    
    case 'minimax': {
      // MiniMax使用类似GPT的BPE tokenizer
      // 根据MiniMax官方文档和测试数据校准：
      // - 中文：1个汉字 ≈ 1个token（对中文优化）
      // - 英文单词：平均每个单词约1.3个token
      // - 英文字符：约3.5字符=1token
      // - 标点、空格：约3字符=1token
      
      // 中文：1字符=1token
      const chineseTokens = chineseChars;
      
      // 英文：优先使用单词数
      let englishTokens = 0;
      if (analysis.words > 0) {
        // 每个英文单词平均约1.3个token
        englishTokens = Math.round(analysis.words * 1.3);
      } else {
        // 约3.5字符=1token
        englishTokens = Math.ceil(englishChars / 3.5);
      }
      
      // 其他字符：约3字符=1token
      const otherTokens = Math.ceil(otherChars / 3);
      
      return chineseTokens + englishTokens + otherTokens;
    }
    
    default: {
      // 默认使用保守估算
      const englishTokens = Math.ceil(englishChars / 4);
      const chineseTokens = Math.ceil(chineseChars / 1.5);
      const otherTokens = Math.ceil(otherChars / 3);
      return englishTokens + chineseTokens + otherTokens;
    }
  }
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
  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: 'asc' // 'asc' or 'desc'
  });

  useEffect(() => {
    const characters = text.length;
    const models = {};

    Object.entries(MODEL_CONFIGS).forEach(([key, config]) => {
      const tokenCount = calculateTokens(text, key, config);
      models[key] = {
        tokens: tokenCount,
        inputPrice: calculatePrice(tokenCount, config.inputPrice),
        outputPrice: calculatePrice(tokenCount, config.outputPrice)
      };
    });

    setStats({ characters, models });
  }, [text]);

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
    const entries = Object.entries(MODEL_CONFIGS);
    if (!sortConfig.field) {
      return entries;
    }

    return [...entries].sort((a, b) => {
      const [keyA, configA] = a;
      const [keyB, configB] = b;
      let valueA, valueB;

      switch (sortConfig.field) {
        case 'model':
          valueA = t(`tokenCalculator.models.${keyA}`).toLowerCase();
          valueB = t(`tokenCalculator.models.${keyB}`).toLowerCase();
          break;
        case 'tokens':
          valueA = stats.models[keyA]?.tokens || 0;
          valueB = stats.models[keyB]?.tokens || 0;
          break;
        case 'inputPrice':
          valueA = configA.inputPrice * 1000;
          valueB = configB.inputPrice * 1000;
          break;
        case 'outputPrice':
          valueA = configA.outputPrice * 1000;
          valueB = configB.outputPrice * 1000;
          break;
        case 'estimatedInputPrice':
          valueA = parseFloat(stats.models[keyA]?.inputPrice || 0);
          valueB = parseFloat(stats.models[keyB]?.inputPrice || 0);
          break;
        case 'estimatedOutputPrice':
          valueA = parseFloat(stats.models[keyA]?.outputPrice || 0);
          valueB = parseFloat(stats.models[keyB]?.outputPrice || 0);
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

  return (
    <div className="text-tokens">
      <div className="text-input-section">
        <textarea
          className="text-input"
          placeholder={t('tokenCalculator.inputPlaceholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
        />
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">{t('tokenCalculator.characterCount')}: <span className="stat-value">{stats.characters}</span></span>
          </div>
        </div>
      </div>

      <div className="models-section">
        <h3>{t('tokenCalculator.modelsTitle')}</h3>
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
                  onClick={() => handleSort('inputPrice')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {t('tokenCalculator.pricing.input')} ({t('tokenCalculator.pricing.perMillionTokens')})
                  {sortConfig.field === 'inputPrice' && (
                    <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('outputPrice')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {t('tokenCalculator.pricing.output')} ({t('tokenCalculator.pricing.perMillionTokens')})
                  {sortConfig.field === 'outputPrice' && (
                    <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('estimatedInputPrice')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {t('tokenCalculator.table.estimatedInputPrice')}
                  {sortConfig.field === 'estimatedInputPrice' && (
                    <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('estimatedOutputPrice')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {t('tokenCalculator.table.estimatedOutputPrice')}
                  {sortConfig.field === 'estimatedOutputPrice' && (
                    <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
                <th>{t('tokenCalculator.table.links')}</th>
              </tr>
            </thead>
            <tbody>
          {getSortedModels().map(([key, config]) => (
                <tr key={key}>
                  <td className="model-name">{t(`tokenCalculator.models.${key}`)}</td>
                  <td className="token-count">{stats.models[key]?.tokens || 0}</td>
                  <td className="price-value">${(config.inputPrice * 1000).toFixed(2)}</td>
                  <td className="price-value">${(config.outputPrice * 1000).toFixed(2)}</td>
                  <td className="price-value">${stats.models[key]?.inputPrice || '0.000000'}</td>
                  <td className="price-value">${stats.models[key]?.outputPrice || '0.000000'}</td>
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

export default TextTokens;
