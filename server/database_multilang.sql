-- CUTool 数据库表结构设计（支持多语言）

-- 创建数据库
CREATE DATABASE IF NOT EXISTS cutool_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cutool_db;

-- AI日报表（支持多语言）
CREATE TABLE IF NOT EXISTS `ai_daily` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '日报ID',
  `date` DATE NOT NULL COMMENT '日期',
  `language` VARCHAR(10) NOT NULL DEFAULT 'zh' COMMENT '语言代码：zh-中文，en-英文',
  `summary` TEXT COMMENT '日报概要',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_date_lang` (`date`, `language`),
  KEY `idx_date` (`date`),
  KEY `idx_language` (`language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI日报表';

-- AI新闻表（支持多语言）
CREATE TABLE IF NOT EXISTS `ai_news` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '新闻ID',
  `daily_id` INT(11) NOT NULL COMMENT '所属日报ID',
  `language` VARCHAR(10) NOT NULL DEFAULT 'zh' COMMENT '语言代码：zh-中文，en-英文',
  `title` VARCHAR(255) NOT NULL COMMENT '新闻标题',
  `summary` TEXT COMMENT '新闻摘要',
  `content` LONGTEXT COMMENT '新闻详细内容（HTML格式）',
  `source` VARCHAR(255) COMMENT '新闻来源',
  `source_link` VARCHAR(500) COMMENT '来源链接',
  `link` VARCHAR(500) COMMENT '原文链接',
  `tags` JSON COMMENT '标签（JSON数组）',
  `order_index` INT(11) DEFAULT 0 COMMENT '排序索引',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_daily_id` (`daily_id`),
  KEY `idx_language` (`language`),
  KEY `idx_order` (`daily_id`, `language`, `order_index`),
  CONSTRAINT `fk_news_daily` FOREIGN KEY (`daily_id`) REFERENCES `ai_daily` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI新闻表';

-- AI教程表（支持多语言）
CREATE TABLE IF NOT EXISTS `ai_tutorial` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '教程ID',
  `category` VARCHAR(100) NOT NULL COMMENT '教程分类',
  `language` VARCHAR(10) NOT NULL DEFAULT 'zh' COMMENT '语言代码：zh-中文，en-英文',
  `title` VARCHAR(255) NOT NULL COMMENT '教程标题',
  `description` TEXT COMMENT '教程描述',
  `content` LONGTEXT COMMENT '教程详细内容（HTML格式）',
  `link` VARCHAR(500) COMMENT '外部链接',
  `tags` JSON COMMENT '标签（JSON数组）',
  `order_index` INT(11) DEFAULT 0 COMMENT '排序索引',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_language` (`language`),
  KEY `idx_order` (`category`, `language`, `order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI教程表';

-- 插入示例数据（中文）
-- 插入今日日报（中文）
INSERT INTO `ai_daily` (`date`, `language`, `summary`) VALUES 
(CURDATE(), 'zh', '今日AI行业动态：OpenAI发布新模型，Google推出AI助手更新，多家公司宣布AI投资计划。');

-- 获取刚插入的日报ID
SET @daily_id_zh = LAST_INSERT_ID();

-- 插入今日新闻（中文）
INSERT INTO `ai_news` (`daily_id`, `language`, `title`, `summary`, `content`, `source`, `source_link`, `link`, `tags`, `order_index`) VALUES
(@daily_id_zh, 'zh', 'OpenAI发布GPT-4.5预览版，性能提升30%', 
 'OpenAI今日发布了GPT-4.5预览版，在多项基准测试中性能提升30%，支持更长的上下文和更快的响应速度。',
 '<h2>GPT-4.5 预览版发布</h2><p>OpenAI 今日正式发布了 GPT-4.5 预览版，这是 GPT-4 系列的重大升级版本。新版本在多个方面都有显著提升。</p><h3>性能提升</h3><p>根据官方测试数据，GPT-4.5 在以下方面有显著改进：</p><ul><li>整体性能提升 30%</li><li>上下文长度扩展到 128K tokens</li><li>响应速度提升 40%</li><li>代码生成能力增强 25%</li></ul>',
 'OpenAI 官方博客', 'https://openai.com/blog/gpt-4-5-preview', 'https://openai.com/blog/gpt-4-5-preview',
 '["OpenAI", "GPT-4.5", "AI模型"]', 0),
 
(@daily_id_zh, 'zh', 'Google推出Gemini 2.0，支持多模态交互',
 'Google发布了Gemini 2.0版本，新增了更强的多模态能力，可以同时处理文本、图像和音频输入。',
 '<h2>Gemini 2.0 正式发布</h2><p>Google DeepMind 今日发布了 Gemini 2.0，这是 Gemini 系列的最新版本，在多模态能力方面有重大突破。</p><h3>多模态能力增强</h3><p>Gemini 2.0 可以同时处理：</p><ul><li>文本输入和输出</li><li>图像理解和生成</li><li>音频处理</li><li>视频分析</li></ul>',
 'Google DeepMind', 'https://deepmind.google/technologies/gemini/', 'https://deepmind.google/technologies/gemini/',
 '["Google", "Gemini", "多模态"]', 1),
 
(@daily_id_zh, 'zh', '微软投资AI初创公司，布局生成式AI生态',
 '微软宣布投资数家AI初创公司，进一步扩大在生成式AI领域的布局，重点关注企业级AI应用。',
 '<h2>微软加大 AI 投资力度</h2><p>微软今日宣布对多家 AI 初创公司进行战略投资，总金额达数亿美元，进一步巩固其在生成式 AI 领域的领先地位。</p>',
 '微软官方', 'https://www.microsoft.com/en-us/ai', 'https://www.microsoft.com/en-us/ai',
 '["微软", "投资", "AI生态"]', 2),
 
(@daily_id_zh, 'zh', 'Meta开源Llama 3.2，社区反响热烈',
 'Meta开源了Llama 3.2模型，在GitHub上获得了大量关注，开发者社区积极测试和反馈。',
 '<h2>Llama 3.2 开源发布</h2><p>Meta 今日正式开源了 Llama 3.2 模型，这是 Llama 3 系列的最新版本，在 GitHub 上发布后迅速获得了大量关注。</p>',
 'Meta AI', 'https://ai.meta.com/llama/', 'https://ai.meta.com/llama/',
 '["Meta", "Llama", "开源"]', 3);

-- 插入今日日报（英文）
INSERT INTO `ai_daily` (`date`, `language`, `summary`) VALUES 
(CURDATE(), 'en', 'Today\'s AI industry updates: OpenAI releases new model, Google launches AI assistant updates, multiple companies announce AI investment plans.');

SET @daily_id_en = LAST_INSERT_ID();

-- 插入今日新闻（英文）
INSERT INTO `ai_news` (`daily_id`, `language`, `title`, `summary`, `content`, `source`, `source_link`, `link`, `tags`, `order_index`) VALUES
(@daily_id_en, 'en', 'OpenAI Releases GPT-4.5 Preview with 30% Performance Improvement', 
 'OpenAI today released GPT-4.5 preview, achieving 30% performance improvement in multiple benchmarks, supporting longer context and faster response speeds.',
 '<h2>GPT-4.5 Preview Release</h2><p>OpenAI officially released GPT-4.5 preview today, a major upgrade to the GPT-4 series with significant improvements in multiple areas.</p><h3>Performance Improvements</h3><p>According to official test data, GPT-4.5 shows significant improvements in:</p><ul><li>Overall performance improvement of 30%</li><li>Context length extended to 128K tokens</li><li>Response speed increased by 40%</li><li>Code generation capability enhanced by 25%</li></ul>',
 'OpenAI Official Blog', 'https://openai.com/blog/gpt-4-5-preview', 'https://openai.com/blog/gpt-4-5-preview',
 '["OpenAI", "GPT-4.5", "AI Model"]', 0),
 
(@daily_id_en, 'en', 'Google Launches Gemini 2.0 with Multimodal Interaction Support',
 'Google released Gemini 2.0 with enhanced multimodal capabilities, able to process text, images, and audio inputs simultaneously.',
 '<h2>Gemini 2.0 Official Release</h2><p>Google DeepMind released Gemini 2.0 today, the latest version of the Gemini series with major breakthroughs in multimodal capabilities.</p><h3>Enhanced Multimodal Capabilities</h3><p>Gemini 2.0 can simultaneously process:</p><ul><li>Text input and output</li><li>Image understanding and generation</li><li>Audio processing</li><li>Video analysis</li></ul>',
 'Google DeepMind', 'https://deepmind.google/technologies/gemini/', 'https://deepmind.google/technologies/gemini/',
 '["Google", "Gemini", "Multimodal"]', 1),
 
(@daily_id_en, 'en', 'Microsoft Invests in AI Startups to Build Generative AI Ecosystem',
 'Microsoft announced investments in several AI startups to further expand its presence in the generative AI field, focusing on enterprise AI applications.',
 '<h2>Microsoft Increases AI Investment</h2><p>Microsoft today announced strategic investments in multiple AI startups, totaling hundreds of millions of dollars, further consolidating its leading position in the generative AI field.</p>',
 'Microsoft Official', 'https://www.microsoft.com/en-us/ai', 'https://www.microsoft.com/en-us/ai',
 '["Microsoft", "Investment", "AI Ecosystem"]', 2),
 
(@daily_id_en, 'en', 'Meta Open Sources Llama 3.2, Community Responds Enthusiastically',
 'Meta open-sourced the Llama 3.2 model, gaining significant attention on GitHub, with the developer community actively testing and providing feedback.',
 '<h2>Llama 3.2 Open Source Release</h2><p>Meta officially open-sourced the Llama 3.2 model today, the latest version of the Llama 3 series, quickly gaining significant attention after its GitHub release.</p>',
 'Meta AI', 'https://ai.meta.com/llama/', 'https://ai.meta.com/llama/',
 '["Meta", "Llama", "Open Source"]', 3);

-- 插入教程数据（中文）
INSERT INTO `ai_tutorial` (`category`, `language`, `title`, `description`, `content`, `link`, `tags`, `order_index`) VALUES
('入门教程', 'zh', 'ChatGPT使用指南', 
 '从零开始学习如何使用ChatGPT，包括基础对话、提示词工程和高级技巧。',
 '<h3>什么是ChatGPT？</h3><p>ChatGPT是由OpenAI开发的大型语言模型，能够进行自然语言对话，回答问题，协助写作等任务。</p><h3>基础使用</h3><ul><li>注册OpenAI账号</li><li>访问chat.openai.com</li><li>开始对话</li></ul><h3>提示词技巧</h3><p>好的提示词应该清晰、具体，包含足够的上下文信息。</p>',
 'https://openai.com/blog/chatgpt', '["ChatGPT", "入门", "提示词"]', 0),

('进阶教程', 'zh', 'Prompt Engineering最佳实践',
 '学习如何编写高效的提示词，提升AI对话质量和准确性。',
 '<h3>提示词工程原则</h3><ol><li>明确任务目标</li><li>提供足够的上下文</li><li>使用结构化格式</li><li>迭代优化</li></ol><h3>常见模式</h3><p>角色扮演、思维链、少样本学习等都是有效的提示词模式。</p>',
 'https://www.promptingguide.ai/', '["Prompt", "工程", "最佳实践"]', 0),

('工具教程', 'zh', 'AI Token计算器使用说明',
 '了解如何使用Token计算器来估算AI API调用成本。',
 '<h3>什么是Token？</h3><p>Token是AI模型处理文本的基本单位，不同模型的Token计算方式可能不同。</p><h3>如何使用</h3><ul><li>输入你的文本</li><li>选择AI模型</li><li>查看Token数量和预估价格</li></ul>',
 NULL, '["Token", "成本", "工具"]', 0),

('应用开发', 'zh', '使用OpenAI API开发AI应用',
 '学习如何使用OpenAI API构建自己的AI应用。',
 '<h3>API基础</h3><p>OpenAI提供了RESTful API，支持多种编程语言调用。</p><h3>快速开始</h3><pre><code>import openai\nopenai.api_key = "your-api-key"\nresponse = openai.ChatCompletion.create(\n  model="gpt-3.5-turbo",\n  messages=[{"role": "user", "content": "Hello!"}]\n)</code></pre>',
 'https://platform.openai.com/docs', '["API", "开发", "OpenAI"]', 0),

('模型对比', 'zh', '主流AI模型对比分析',
 '对比分析GPT、Claude、Gemini等主流AI模型的特点和适用场景。',
 '<h3>模型特点</h3><ul><li>GPT系列：擅长文本生成和对话</li><li>Claude：注重安全性和长文本处理</li><li>Gemini：多模态能力强</li></ul><h3>选择建议</h3><p>根据具体需求选择合适的模型，考虑成本、性能和功能需求。</p>',
 NULL, '["模型", "对比", "选择"]', 0);

-- 插入教程数据（英文）
INSERT INTO `ai_tutorial` (`category`, `language`, `title`, `description`, `content`, `link`, `tags`, `order_index`) VALUES
('Getting Started', 'en', 'ChatGPT Usage Guide', 
 'Learn how to use ChatGPT from scratch, including basic conversations, prompt engineering, and advanced techniques.',
 '<h3>What is ChatGPT?</h3><p>ChatGPT is a large language model developed by OpenAI, capable of natural language conversations, answering questions, assisting with writing, and more.</p><h3>Basic Usage</h3><ul><li>Register an OpenAI account</li><li>Visit chat.openai.com</li><li>Start a conversation</li></ul><h3>Prompt Tips</h3><p>Good prompts should be clear, specific, and include sufficient context.</p>',
 'https://openai.com/blog/chatgpt', '["ChatGPT", "Getting Started", "Prompts"]', 0),

('Advanced', 'en', 'Prompt Engineering Best Practices',
 'Learn how to write effective prompts to improve AI conversation quality and accuracy.',
 '<h3>Prompt Engineering Principles</h3><ol><li>Define task objectives clearly</li><li>Provide sufficient context</li><li>Use structured formats</li><li>Iterate and optimize</li></ol><h3>Common Patterns</h3><p>Role-playing, chain-of-thought, few-shot learning are all effective prompt patterns.</p>',
 'https://www.promptingguide.ai/', '["Prompt", "Engineering", "Best Practices"]', 0),

('Tools', 'en', 'AI Token Calculator Usage Guide',
 'Learn how to use the Token calculator to estimate AI API call costs.',
 '<h3>What is a Token?</h3><p>A token is the basic unit for AI models to process text. Different models may calculate tokens differently.</p><h3>How to Use</h3><ul><li>Enter your text</li><li>Select an AI model</li><li>View token count and estimated price</li></ul>',
 NULL, '["Token", "Cost", "Tools"]', 0),

('Development', 'en', 'Building AI Applications with OpenAI API',
 'Learn how to use the OpenAI API to build your own AI applications.',
 '<h3>API Basics</h3><p>OpenAI provides a RESTful API that supports multiple programming languages.</p><h3>Quick Start</h3><pre><code>import openai\nopenai.api_key = "your-api-key"\nresponse = openai.ChatCompletion.create(\n  model="gpt-3.5-turbo",\n  messages=[{"role": "user", "content": "Hello!"}]\n)</code></pre>',
 'https://platform.openai.com/docs', '["API", "Development", "OpenAI"]', 0),

('Model Comparison', 'en', 'Mainstream AI Model Comparison Analysis',
 'Compare and analyze the characteristics and use cases of mainstream AI models like GPT, Claude, and Gemini.',
 '<h3>Model Characteristics</h3><ul><li>GPT Series: Excellent at text generation and conversations</li><li>Claude: Focuses on safety and long text processing</li><li>Gemini: Strong multimodal capabilities</li></ul><h3>Selection Advice</h3><p>Choose the appropriate model based on specific needs, considering cost, performance, and functional requirements.</p>',
 NULL, '["Models", "Comparison", "Selection"]', 0);

