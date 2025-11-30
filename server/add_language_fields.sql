-- 快速添加language字段的迁移脚本
-- 如果表已经有数据，此脚本会为现有数据设置默认语言为'zh'

USE cutool_db;

-- 1. 为 ai_daily 表添加 language 字段（如果不存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'cutool_db' 
               AND TABLE_NAME = 'ai_daily' 
               AND COLUMN_NAME = 'language');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `ai_daily` ADD COLUMN `language` VARCHAR(10) NOT NULL DEFAULT ''zh'' COMMENT ''语言代码：zh-中文，en-英文'' AFTER `date`',
    'SELECT ''Column language already exists in ai_daily'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 为 ai_news 表添加 language 字段（如果不存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'cutool_db' 
               AND TABLE_NAME = 'ai_news' 
               AND COLUMN_NAME = 'language');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `ai_news` ADD COLUMN `language` VARCHAR(10) NOT NULL DEFAULT ''zh'' COMMENT ''语言代码：zh-中文，en-英文'' AFTER `daily_id`',
    'SELECT ''Column language already exists in ai_news'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 为 ai_tutorial 表添加 language 字段（如果不存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'cutool_db' 
               AND TABLE_NAME = 'ai_tutorial' 
               AND COLUMN_NAME = 'language');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `ai_tutorial` ADD COLUMN `language` VARCHAR(10) NOT NULL DEFAULT ''zh'' COMMENT ''语言代码：zh-中文，en-英文'' AFTER `category`',
    'SELECT ''Column language already exists in ai_tutorial'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 更新现有数据，设置默认语言为'zh'
UPDATE `ai_daily` SET `language` = 'zh' WHERE `language` IS NULL OR `language` = '';
UPDATE `ai_news` SET `language` = 'zh' WHERE `language` IS NULL OR `language` = '';
UPDATE `ai_tutorial` SET `language` = 'zh' WHERE `language` IS NULL OR `language` = '';

-- 5. 删除旧的唯一索引（如果存在），创建新的联合唯一索引
-- 先检查是否存在旧索引
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'cutool_db' 
               AND TABLE_NAME = 'ai_daily' 
               AND INDEX_NAME = 'uk_date');

SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE `ai_daily` DROP INDEX `uk_date`',
    'SELECT ''Index uk_date does not exist'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 创建新的联合唯一索引（如果不存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'cutool_db' 
               AND TABLE_NAME = 'ai_daily' 
               AND INDEX_NAME = 'uk_date_lang');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `ai_daily` ADD UNIQUE KEY `uk_date_lang` (`date`, `language`)',
    'SELECT ''Index uk_date_lang already exists'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. 添加语言索引（如果不存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'cutool_db' 
               AND TABLE_NAME = 'ai_daily' 
               AND INDEX_NAME = 'idx_language');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `ai_daily` ADD KEY `idx_language` (`language`)',
    'SELECT ''Index idx_language already exists in ai_daily'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'cutool_db' 
               AND TABLE_NAME = 'ai_news' 
               AND INDEX_NAME = 'idx_language');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `ai_news` ADD KEY `idx_language` (`language`)',
    'SELECT ''Index idx_language already exists in ai_news'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'cutool_db' 
               AND TABLE_NAME = 'ai_tutorial' 
               AND INDEX_NAME = 'idx_language');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `ai_tutorial` ADD KEY `idx_language` (`language`)',
    'SELECT ''Index idx_language already exists in ai_tutorial'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed successfully!' AS message;

