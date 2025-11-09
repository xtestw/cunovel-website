// Token计算工具库
// 使用第三方库来保证计算准确性

import { encoding_for_model } from 'tiktoken';

// 注意：SentencePiece在浏览器环境中不可用，仅在Node.js环境中使用
// 这里保留接口以便将来可能的服务端实现
let SentencePieceProcessor = null;

// 缓存编码器实例
const encoderCache = new Map();

// 获取编码器实例
const getEncoder = (modelName) => {
  if (encoderCache.has(modelName)) {
    return encoderCache.get(modelName);
  }
  
  try {
    let encoder;
    
    // 根据模型选择合适的编码器
    switch (modelName) {
      case 'gpt4':
      case 'gpt4turbo':
      case 'gpt4o':
      case 'gpt4omini':
      case 'gpt4o1':
      case 'gpt4o1mini':
      case 'gpt41nano':
        encoder = encoding_for_model('gpt-4');
        break;
      case 'gpt35turbo':
        encoder = encoding_for_model('gpt-3.5-turbo');
        break;
      default:
        // 对于其他模型，使用cl100k_base编码（GPT-4的编码方式）
        encoder = encoding_for_model('gpt-4');
    }
    
    encoderCache.set(modelName, encoder);
    return encoder;
  } catch (error) {
    console.warn(`Failed to get encoder for ${modelName}:`, error);
    // 回退到js-tiktoken
    return null;
  }
};

// 使用tiktoken计算GPT系列模型的token数
export const calculateGPTTokens = (text, modelName) => {
  if (!text) return 0;
  
  try {
    const encoder = getEncoder(modelName);
    if (encoder) {
      const tokens = encoder.encode(text);
      return tokens.length;
    } else {
      // 回退到估算方法
      return fallbackTokenCalculation(text);
    }
  } catch (error) {
    console.warn(`Failed to calculate tokens for ${modelName}:`, error);
    // 回退到原有的估算方法
    return fallbackTokenCalculation(text);
  }
};

// Claude模型token计算（使用近似算法）
export const calculateClaudeTokens = (text) => {
  if (!text) return 0;
  
  // Claude的tokenizer与GPT类似，但有细微差别
  // 这里使用经过校准的近似算法
  const analysis = analyzeText(text);
  const { chineseChars, englishChars, otherChars } = analysis;
  
  // Claude对中文的处理与GPT相似
  const chineseTokens = chineseChars;
  
  // 英文单词计算
  let englishTokens = 0;
  if (analysis.words > 0) {
    englishTokens = Math.round(analysis.words * 1.25);
  } else {
    englishTokens = Math.ceil(englishChars / 3.3);
  }
  
  // 其他字符
  const otherTokens = Math.ceil(otherChars / 2.6);
  
  return chineseTokens + englishTokens + otherTokens;
};

// Gemini模型token计算
export const calculateGeminiTokens = (text) => {
  if (!text) return 0;
  
  // 尝试使用SentencePiece进行更精确的计算
  if (SentencePieceProcessor) {
    try {
      // 注意：这里需要Gemini的具体模型文件，暂时使用估算
      // 实际使用时需要下载对应的.model文件
      console.log('SentencePiece available but model file needed for Gemini');
    } catch (error) {
      console.warn('SentencePiece calculation failed:', error);
    }
  }
  
  // 回退到校准的估算算法
  const analysis = analyzeText(text);
  const { chineseChars, englishChars, otherChars } = analysis;
  
  // Gemini使用SentencePiece，对中文分词较细
  const chineseTokens = Math.ceil(chineseChars / 1.15);
  
  let englishTokens = 0;
  if (analysis.words > 0) {
    englishTokens = Math.round(analysis.words * 1.35);
  } else {
    englishTokens = Math.ceil(englishChars / 3.6);
  }
  
  const otherTokens = Math.ceil(otherChars / 2.8);
  
  return chineseTokens + englishTokens + otherTokens;
};

// Qwen模型token计算
export const calculateQwenTokens = (text) => {
  if (!text) return 0;
  
  const analysis = analyzeText(text);
  const { chineseChars, englishChars, otherChars } = analysis;
  
  // Qwen对中文优化最好
  const chineseTokens = Math.ceil(chineseChars * 0.95);
  
  let englishTokens = 0;
  if (analysis.words > 0) {
    englishTokens = Math.round(analysis.words * 1.28);
  } else {
    englishTokens = Math.ceil(englishChars / 3.6);
  }
  
  const otherTokens = Math.ceil(otherChars / 2.8);
  
  return chineseTokens + englishTokens + otherTokens;
};

// DeepSeek模型token计算
export const calculateDeepSeekTokens = (text) => {
  if (!text) return 0;
  
  const analysis = analyzeText(text);
  const { chineseChars, englishChars, otherChars } = analysis;
  
  const chineseTokens = Math.ceil(chineseChars * 0.98);
  
  let englishTokens = 0;
  if (analysis.words > 0) {
    englishTokens = Math.round(analysis.words * 1.31);
  } else {
    englishTokens = Math.ceil(englishChars / 3.4);
  }
  
  const otherTokens = Math.ceil(otherChars / 2.7);
  
  return chineseTokens + englishTokens + otherTokens;
};

// MiniMax模型token计算
export const calculateMinimaxTokens = (text) => {
  if (!text) return 0;
  
  const analysis = analyzeText(text);
  const { chineseChars, englishChars, otherChars } = analysis;
  
  const chineseTokens = Math.ceil(chineseChars * 1.02);
  
  let englishTokens = 0;
  if (analysis.words > 0) {
    englishTokens = Math.round(analysis.words * 1.29);
  } else {
    englishTokens = Math.ceil(englishChars / 3.4);
  }
  
  const otherTokens = Math.ceil(otherChars / 2.8);
  
  return chineseTokens + englishTokens + otherTokens;
};

// Llama/Mistral模型token计算
export const calculateLlamaTokens = (text) => {
  if (!text) return 0;
  
  // 尝试使用SentencePiece进行更精确的计算
  if (SentencePieceProcessor) {
    try {
      // 注意：这里需要Llama的具体模型文件，暂时使用估算
      // 实际使用时需要下载对应的.model文件
      console.log('SentencePiece available but model file needed for Llama');
    } catch (error) {
      console.warn('SentencePiece calculation failed:', error);
    }
  }
  
  // 回退到校准的估算算法
  const analysis = analyzeText(text);
  const { chineseChars, englishChars, otherChars } = analysis;
  
  const chineseTokens = Math.ceil(chineseChars / 1.35);
  
  let englishTokens = 0;
  if (analysis.words > 0) {
    englishTokens = Math.round(analysis.words * 1.32);
  } else {
    englishTokens = Math.ceil(englishChars / 3.8);
  }
  
  const otherTokens = Math.ceil(otherChars / 2.9);
  
  return chineseTokens + englishTokens + otherTokens;
};

// 文本分析函数
const analyzeText = (text) => {
  let chineseChars = 0;
  let englishChars = 0;
  let otherChars = 0;
  let words = 0;
  let spaces = 0;
  let punctuation = 0;
  
  // 检测英文单词
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
    
    // 中文字符范围
    if (code >= 0x4e00 && code <= 0x9fa5) {
      chineseChars++;
    } 
    // 英文字母和数字
    else if ((code >= 0x0041 && code <= 0x005A) || 
             (code >= 0x0061 && code <= 0x007A) || 
             (code >= 0x0030 && code <= 0x0039)) {
      englishChars++;
    } 
    // 其他字符
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

// 回退的token计算方法
const fallbackTokenCalculation = (text) => {
  const analysis = analyzeText(text);
  const { chineseChars, englishChars, otherChars } = analysis;
  
  // 使用保守的估算
  const englishTokens = Math.ceil(englishChars / 4);
  const chineseTokens = Math.ceil(chineseChars / 1.5);
  const otherTokens = Math.ceil(otherChars / 3);
  
  return englishTokens + chineseTokens + otherTokens;
};

// 主要的token计算函数
export const calculateTokensWithLibrary = (text, modelKey) => {
  if (!text) return 0;
  
  try {
    switch (modelKey) {
      case 'gpt4':
      case 'gpt4turbo':
      case 'gpt4o':
      case 'gpt4omini':
      case 'gpt4o1':
      case 'gpt4o1mini':
      case 'gpt41nano':
      case 'gpt35turbo':
        return calculateGPTTokens(text, modelKey);
        
      case 'claude35Sonnet':
      case 'claude35Haiku':
      case 'claude3Opus':
      case 'claude3Sonnet':
      case 'claude3Haiku':
      case 'claude':
        return calculateClaudeTokens(text);
        
      case 'gemini2Flash':
      case 'gemini15Pro':
      case 'gemini15Flash':
      case 'geminiPro':
      case 'gemini':
        return calculateGeminiTokens(text);
        
      case 'qwen25':
      case 'qwenMax':
      case 'qwen':
        return calculateQwenTokens(text);
        
      case 'deepseekV3':
      case 'deepseek':
        return calculateDeepSeekTokens(text);
        
      case 'minimaxPro':
      case 'minimax':
        return calculateMinimaxTokens(text);
        
      case 'llama32':
      case 'llama31':
      case 'llama2':
      case 'mistralLarge':
      case 'mistral':
        return calculateLlamaTokens(text);
        
      default:
        return fallbackTokenCalculation(text);
    }
  } catch (error) {
    console.warn(`Token calculation failed for ${modelKey}:`, error);
    return fallbackTokenCalculation(text);
  }
};