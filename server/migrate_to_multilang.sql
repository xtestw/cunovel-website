-- 数据库迁移脚本：从单语言升级到多语言支持
-- 执行前请备份数据库！

USE cutool_db;

-- 1. 为 ai_daily 表添加 language 字段
ALTER TABLE `ai_daily` 
ADD COLUMN `language` VARCHAR(10) NOT NULL DEFAULT 'zh' COMMENT '语言代码：zh-中文，en-英文' AFTER `date`;

-- 2. 删除旧的唯一索引，创建新的联合唯一索引
ALTER TABLE `ai_daily` 
DROP INDEX `uk_date`,
ADD UNIQUE KEY `uk_date_lang` (`date`, `language`);

-- 3. 添加语言索引
ALTER TABLE `ai_daily` 
ADD KEY `idx_language` (`language`);

-- 4. 为 ai_news 表添加 language 字段
ALTER TABLE `ai_news` 
ADD COLUMN `language` VARCHAR(10) NOT NULL DEFAULT 'zh' COMMENT '语言代码：zh-中文，en-英文' AFTER `daily_id`;

-- 5. 更新 ai_news 的索引
ALTER TABLE `ai_news` 
DROP INDEX `idx_order`,
ADD KEY `idx_language` (`language`),
ADD KEY `idx_order` (`daily_id`, `language`, `order_index`);

-- 6. 为 ai_tutorial 表添加 language 字段
ALTER TABLE `ai_tutorial` 
ADD COLUMN `language` VARCHAR(10) NOT NULL DEFAULT 'zh' COMMENT '语言代码：zh-中文，en-英文' AFTER `category`;

-- 7. 更新 ai_tutorial 的索引
ALTER TABLE `ai_tutorial` 
ADD KEY `idx_language` (`language`),
DROP INDEX `idx_order`,
ADD KEY `idx_order` (`category`, `language`, `order_index`);

-- 8. 将现有数据标记为中文（如果还没有设置）
UPDATE `ai_daily` SET `language` = 'zh' WHERE `language` IS NULL OR `language` = '';
UPDATE `ai_news` SET `language` = 'zh' WHERE `language` IS NULL OR `language` = '';
UPDATE `ai_tutorial` SET `language` = 'zh' WHERE `language` IS NULL OR `language` = '';

