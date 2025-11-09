import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateTokensWithLibrary } from '../../utils/tokenizers';
import './TextTokens.css';

// Token计算模型配置
const MODEL_CONFIGS = {
  gpt4: {
    name: 'gpt4',
    inputPrice: 0.03, // 每1000 tokens $0.03 ($30/百万tokens) - 2024年12月最新价格
    outputPrice: 0.06, // 每1000 tokens $0.06 ($60/百万tokens)
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt4turbo: {
    name: 'gpt4turbo',
    inputPrice: 0.01, // 每1000 tokens $0.01 ($10/百万tokens) - 2024年12月最新价格
    outputPrice: 0.03, // 每1000 tokens $0.03 ($30/百万tokens)
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt4o: {
    name: 'gpt4o',
    inputPrice: 0.0025, // 每1000 tokens $0.0025 ($2.50/百万tokens) - 2024年12月最新价格
    outputPrice: 0.01, // 每1000 tokens $0.01 ($10/百万tokens)
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt4omini: {
    name: 'gpt4omini',
    inputPrice: 0.00015, // 每1000 tokens $0.00015 ($0.15/百万tokens) - 2024年12月最新价格
    outputPrice: 0.0006, // 每1000 tokens $0.0006 ($0.60/百万tokens)
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt4o1: {
    name: 'gpt4o1',
    inputPrice: 0.015, // 每1000 tokens $0.015 ($15/百万tokens) - o1-preview模型
    outputPrice: 0.06, // 每1000 tokens $0.06 ($60/百万tokens)
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt4o1mini: {
    name: 'gpt4o1mini',
    inputPrice: 0.003, // 每1000 tokens $0.003 ($3/百万tokens) - o1-mini模型
    outputPrice: 0.012, // 每1000 tokens $0.012 ($12/百万tokens)
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  }, // 添加用户特别要求的模型
  gpt41nano: {
    name: 'gpt41nano',
    inputPrice: 0.0001, // 每1000 tokens $0.0001 ($0.10/百万tokens) - GPT-4.1 nano
    outputPrice: 0.0004, // 每1000 tokens $0.0004 ($0.40/百万tokens)
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt41: {
    name: 'gpt41',
    inputPrice: 0.002, // 每1000 tokens $0.002 ($2/百万tokens) - GPT-4.1
    outputPrice: 0.008, // 每1000 tokens $0.008 ($8/百万tokens)
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt41mini: {
    name: 'gpt41mini',
    inputPrice: 0.0005, // 每1000 tokens $0.0005 ($0.50/百万tokens) - GPT-4.1 mini
    outputPrice: 0.002, // 每1000 tokens $0.002 ($2/百万tokens)
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt5: {
    name: 'gpt5',
    inputPrice: 0.005, // 每1000 tokens $0.005 ($5/百万tokens) - GPT-5 (预估价格)
    outputPrice: 0.015, // 每1000 tokens $0.015 ($15/百万tokens)
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  },
  gpt35turbo: {
    name: 'gpt35turbo',
    inputPrice: 0.0005, // 每1000 tokens $0.0005 ($0.50/百万tokens) - 2024年12月最新价格
    outputPrice: 0.0015, // 每1000 tokens $0.0015 ($1.50/百万tokens)
    pricingLink: 'https://openai.com/api/pricing/',
    tokenCalcLink: 'https://platform.openai.com/tokenizer'
  }, claude: {
    name: 'claude',
    inputPrice: 0.008, // 每1000 tokens $0.008 ($8/百万tokens) - Claude基础版本
    outputPrice: 0.024, // 每1000 tokens $0.024 ($24/百万tokens)
    pricingLink: 'https://www.anthropic.com/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/en/docs/build-with-claude/token-counting'
  },
  claude35Sonnet: {
    name: 'claude35Sonnet',
    inputPrice: 0.003, // 每1000 tokens $0.003 ($3/百万tokens) - Claude 3.5 Sonnet最新版本
    outputPrice: 0.015, // 每1000 tokens $0.015 ($15/百万tokens)
    pricingLink: 'https://www.anthropic.com/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/en/docs/build-with-claude/token-counting'
  },
  claude35Haiku: {
    name: 'claude35Haiku',
    inputPrice: 0.0008, // 每1000 tokens $0.0008 ($0.80/百万tokens) - Claude 3.5 Haiku
    outputPrice: 0.004, // 每1000 tokens $0.004 ($4/百万tokens)
    pricingLink: 'https://www.anthropic.com/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/en/docs/build-with-claude/token-counting'
  },
  claude3Opus: {
    name: 'claude3Opus',
    inputPrice: 0.015, // 每1000 tokens $0.015 ($15/百万tokens) - 2024年12月最新价格
    outputPrice: 0.075, // 每1000 tokens $0.075 ($75/百万tokens)
    pricingLink: 'https://www.anthropic.com/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/en/docs/build-with-claude/token-counting'
  },
  claude3Sonnet: {
    name: 'claude3Sonnet',
    inputPrice: 0.003, // 每1000 tokens $0.003 ($3/百万tokens) - 2024年12月最新价格
    outputPrice: 0.015, // 每1000 tokens $0.015 ($15/百万tokens)
    pricingLink: 'https://www.anthropic.com/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/en/docs/build-with-claude/token-counting'
  },
  claude3Haiku: {
    name: 'claude3Haiku',
    inputPrice: 0.00025, // 每1000 tokens $0.00025 ($0.25/百万tokens) - 2024年12月最新价格
    outputPrice: 0.00125, // 每1000 tokens $0.00125 ($1.25/百万tokens)
    pricingLink: 'https://www.anthropic.com/pricing',
    tokenCalcLink: 'https://docs.anthropic.com/en/docs/build-with-claude/token-counting'
  },
  gemini2Flash: {
    name: 'gemini2Flash',
    inputPrice: 0.000075, // 每1000 tokens $0.000075 ($0.075/百万tokens) - Gemini 2.0 Flash最新版本
    outputPrice: 0.0003, // 每1000 tokens $0.0003 ($0.30/百万tokens)
    pricingLink: 'https://ai.google.dev/pricing',
    tokenCalcLink: 'https://ai.google.dev/gemini-api/docs/tokens'
  },
  gemini15Pro: {
    name: 'gemini15Pro',
    inputPrice: 0.00125, // 每1000 tokens $0.00125 ($1.25/百万tokens) - Gemini 1.5 Pro
    outputPrice: 0.005, // 每1000 tokens $0.005 ($5/百万tokens)
    pricingLink: 'https://ai.google.dev/pricing',
    tokenCalcLink: 'https://ai.google.dev/gemini-api/docs/tokens'
  },
  gemini15Flash: {
    name: 'gemini15Flash',
    inputPrice: 0.000075, // 每1000 tokens $0.000075 ($0.075/百万tokens) - Gemini 1.5 Flash
    outputPrice: 0.0003, // 每1000 tokens $0.0003 ($0.30/百万tokens)
    pricingLink: 'https://ai.google.dev/pricing',
    tokenCalcLink: 'https://ai.google.dev/gemini-api/docs/tokens'
  },
  geminiPro: {
    name: 'geminiPro',
    inputPrice: 0.0005, // 每1000 tokens $0.0005 ($0.50/百万tokens) - 2024年12月最新价格
    outputPrice: 0.0015, // 每1000 tokens $0.0015 ($1.50/百万tokens)
    pricingLink: 'https://ai.google.dev/pricing',
    tokenCalcLink: 'https://ai.google.dev/gemini-api/docs/tokens'
  },
  qwen25: {
    name: 'qwen25',
    inputPrice: 0.0003, // 每1000 tokens $0.0003 ($0.30/百万tokens) - Qwen2.5最新版本
    outputPrice: 0.0006, // 每1000 tokens $0.0006 ($0.60/百万tokens)
    pricingLink: 'https://help.aliyun.com/zh/model-studio/product-overview/billing-methods',
    tokenCalcLink: 'https://help.aliyun.com/zh/model-studio/user-guide/tokens-and-billing'
  },
  qwenMax: {
    name: 'qwenMax',
    inputPrice: 0.008, // 每1000 tokens $0.008 ($8/百万tokens) - Qwen-Max
    outputPrice: 0.024, // 每1000 tokens $0.024 ($24/百万tokens)
    pricingLink: 'https://help.aliyun.com/zh/model-studio/product-overview/billing-methods',
    tokenCalcLink: 'https://help.aliyun.com/zh/model-studio/user-guide/tokens-and-billing'
  },
  qwen: {
    name: 'qwen',
    inputPrice: 0.002, // 每1000 tokens $0.002 ($2/百万tokens) - 2024年12月最新价格
    outputPrice: 0.006, // 每1000 tokens $0.006 ($6/百万tokens)
    pricingLink: 'https://help.aliyun.com/zh/model-studio/product-overview/billing-methods',
    tokenCalcLink: 'https://help.aliyun.com/zh/model-studio/user-guide/tokens-and-billing'
  },
 
  llama2: {
    name: 'llama2',
    inputPrice: 0.0002, // 每1000 tokens $0.0002 ($0.20/百万tokens) - Llama 2
    outputPrice: 0.0002, // 每1000 tokens $0.0002 ($0.20/百万tokens)
    pricingLink: 'https://www.llama.com/pricing/',
    tokenCalcLink: 'https://huggingface.co/docs/transformers/model_doc/llama'
  },
  llama32: {
    name: 'llama32',
    inputPrice: 0.0001, // 每1000 tokens $0.0001 ($0.10/百万tokens) - Llama 3.2最新版本
    outputPrice: 0.0001, // 每1000 tokens $0.0001 ($0.10/百万tokens)
    pricingLink: 'https://www.llama.com/pricing/',
    tokenCalcLink: 'https://huggingface.co/docs/transformers/model_doc/llama'
  },
  llama31: {
    name: 'llama31',
    inputPrice: 0.0002, // 每1000 tokens $0.0002 ($0.20/百万tokens) - Llama 3.1
    outputPrice: 0.0002, // 每1000 tokens $0.0002 ($0.20/百万tokens)
    pricingLink: 'https://www.llama.com/pricing/',
    tokenCalcLink: 'https://huggingface.co/docs/transformers/model_doc/llama'
  },
  mistralLarge: {
    name: 'mistralLarge',
    inputPrice: 0.002, // 每1000 tokens $0.002 ($2/百万tokens) - Mistral Large最新版本
    outputPrice: 0.006, // 每1000 tokens $0.006 ($6/百万tokens)
    pricingLink: 'https://mistral.ai/technology/#pricing',
    tokenCalcLink: 'https://docs.mistral.ai/getting-started/tokenization/'
  },
  mistral: {
    name: 'mistral',
    inputPrice: 0.0002, // 每1000 tokens $0.0002 ($0.20/百万tokens) - 2024年12月最新价格
    outputPrice: 0.0006, // 每1000 tokens $0.0006 ($0.60/百万tokens)
    pricingLink: 'https://mistral.ai/technology/#pricing',
    tokenCalcLink: 'https://docs.mistral.ai/getting-started/tokenization/'
  },
  deepseekV3: {
    name: 'deepseekV3',
    inputPrice: 0.00027, // 每1000 tokens $0.00027 ($0.27/百万tokens) - DeepSeek-V3最新版本
    outputPrice: 0.0011, // 每1000 tokens $0.0011 ($1.10/百万tokens)
    pricingLink: 'https://platform.deepseek.com/api-docs/pricing',
    tokenCalcLink: 'https://platform.deepseek.com/api-docs/quick_start/pricing-tokens'
  },
  deepseek: {
    name: 'deepseek',
    inputPrice: 0.00028, // 每1000 tokens $0.00028 ($0.28/百万tokens) - 2024年12月最新价格
    outputPrice: 0.00112, // 每1000 tokens $0.00112 ($1.12/百万tokens)
    pricingLink: 'https://platform.deepseek.com/api-docs/pricing',
    tokenCalcLink: 'https://platform.deepseek.com/api-docs/quick_start/pricing-tokens'
  },
  minimaxPro: {
    name: 'minimaxPro',
    inputPrice: 0.0015, // 每1000 tokens $0.0015 ($1.50/百万tokens) - MiniMax Pro最新版本
    outputPrice: 0.005, // 每1000 tokens $0.005 ($5/百万tokens)
    pricingLink: 'https://www.minimaxi.com/platform/pricing',
    tokenCalcLink: 'https://www.minimaxi.com/document/guides/chat-model/pro/api'
  },
  minimax: {
    name: 'minimax',
    inputPrice: 0.00014, // 每1000 tokens $0.00014 ($0.14/百万tokens) - 2024年12月最新价格
    outputPrice: 0.00112, // 每1000 tokens $0.00112 ($1.12/百万tokens)
    pricingLink: 'https://www.minimaxi.com/platform/pricing',
    tokenCalcLink: 'https://www.minimaxi.com/document/guides/chat-model/pro/api'
  },
 
  gemini: {
    name: 'gemini',
    inputPrice: 0.0025, // 每1000 tokens $0.0025 ($2.50/百万tokens) - Gemini基础版本
    outputPrice: 0.01, // 每1000 tokens $0.01 ($10/百万tokens)
    pricingLink: 'https://ai.google.dev/pricing',
    tokenCalcLink: 'https://ai.google.dev/gemini-api/docs/tokens'
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

// 针对不同模型的token计算函数（使用第三方库）
const calculateTokens = (text, modelKey, modelConfig) => {
  if (!text) return 0;

  try {
    // 优先使用第三方库进行精确计算
    return calculateTokensWithLibrary(text, modelKey);
  } catch (error) {
    console.warn(`Failed to calculate tokens with library for ${modelKey}:`, error);
    
    // 回退到原有的估算方法
    const analysis = analyzeText(text);
    const { chineseChars, englishChars, otherChars } = analysis;
    
    // 根据不同模型使用不同的计算规则
    switch (modelKey) {
      case 'gpt4':
      case 'gpt4turbo':
      case 'gpt4o':
      case 'gpt4omini':
      case 'gpt4o1':
      case 'gpt4o1mini':
      case 'gpt41':
      case 'gpt41mini':
      case 'gpt41nano':
      case 'gpt5':
      case 'gpt35turbo': {
        // GPT系列回退算法
        const chineseTokens = chineseChars;
        let englishTokens = 0;
        if (analysis.words > 0) {
          englishTokens = Math.round(analysis.words * 1.33);
        } else {
          englishTokens = Math.ceil(englishChars / 3.7);
        }
        const punctuationTokens = Math.ceil(analysis.punctuation * 0.75);
        const otherSpecialChars = otherChars - analysis.spaces - analysis.punctuation;
        const otherSpecialTokens = Math.ceil(otherSpecialChars / 2.2);
        const spaceTokens = Math.ceil(analysis.spaces * 0.2);
        return chineseTokens + englishTokens + punctuationTokens + otherSpecialTokens + spaceTokens;
      }
      
      case 'claude35Sonnet':
      case 'claude35Haiku':
      case 'claude3Opus':
      case 'claude3Sonnet':
      case 'claude3Haiku':
      case 'claude': {
        const chineseTokens = chineseChars;
        let englishTokens = 0;
        if (analysis.words > 0) {
          englishTokens = Math.round(analysis.words * 1.25);
        } else {
          englishTokens = Math.ceil(englishChars / 3.3);
        }
        const otherTokens = Math.ceil(otherChars / 2.6);
        return chineseTokens + englishTokens + otherTokens;
      }
      
      case 'gemini2Flash':
      case 'gemini15Pro':
      case 'gemini15Flash':
      case 'geminiPro':
      case 'gemini': {
        const chineseTokens = Math.ceil(chineseChars / 1.15);
        let englishTokens = 0;
        if (analysis.words > 0) {
          englishTokens = Math.round(analysis.words * 1.35);
        } else {
          englishTokens = Math.ceil(englishChars / 3.6);
        }
        const otherTokens = Math.ceil(otherChars / 2.8);
        return chineseTokens + englishTokens + otherTokens;
      }
      
      case 'qwen25':
      case 'qwenMax':
      case 'qwen': {
        const chineseTokens = Math.ceil(chineseChars * 0.95);
        let englishTokens = 0;
        if (analysis.words > 0) {
          englishTokens = Math.round(analysis.words * 1.28);
        } else {
          englishTokens = Math.ceil(englishChars / 3.6);
        }
        const otherTokens = Math.ceil(otherChars / 2.8);
        return chineseTokens + englishTokens + otherTokens;
      }
      
      case 'llama32':
      case 'llama31':
      case 'llama2':
      case 'mistralLarge':
      case 'mistral': {
        const chineseTokens = Math.ceil(chineseChars / 1.35);
        let englishTokens = 0;
        if (analysis.words > 0) {
          englishTokens = Math.round(analysis.words * 1.32);
        } else {
          englishTokens = Math.ceil(englishChars / 3.8);
        }
        const otherTokens = Math.ceil(otherChars / 2.9);
        return chineseTokens + englishTokens + otherTokens;
      }
      
      case 'deepseekV3':
      case 'deepseek': {
        const chineseTokens = Math.ceil(chineseChars * 0.98);
        let englishTokens = 0;
        if (analysis.words > 0) {
          englishTokens = Math.round(analysis.words * 1.31);
        } else {
          englishTokens = Math.ceil(englishChars / 3.4);
        }
        const otherTokens = Math.ceil(otherChars / 2.7);
        return chineseTokens + englishTokens + otherTokens;
      }
      
      case 'minimaxPro':
      case 'minimax': {
        const chineseTokens = Math.ceil(chineseChars * 1.02);
        let englishTokens = 0;
        if (analysis.words > 0) {
          englishTokens = Math.round(analysis.words * 1.29);
        } else {
          englishTokens = Math.ceil(englishChars / 3.4);
        }
        const otherTokens = Math.ceil(otherChars / 2.8);
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
