-- RSS订阅源表
CREATE TABLE IF NOT EXISTS `rss_feeds` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '订阅源ID',
  `name` VARCHAR(255) NOT NULL COMMENT '订阅源名称',
  `url` VARCHAR(500) NOT NULL COMMENT 'RSS订阅源URL',
  `language` VARCHAR(10) NOT NULL DEFAULT 'zh' COMMENT '语言代码：zh-中文，en-英文',
  `weight` INT(11) NOT NULL DEFAULT 0 COMMENT '权重，数值越大优先级越高',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用：1-启用，0-禁用',
  `description` TEXT COMMENT '描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_language` (`language`),
  KEY `idx_enabled` (`enabled`),
  KEY `idx_weight` (`weight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RSS订阅源表';

-- 插入示例RSS订阅源
INSERT INTO `rss_feeds` (`name`, `url`, `language`, `weight`, `description`) VALUES
('OpenAI Blog', 'https://openai.com/blog/rss/', 'en', 10, 'OpenAI官方博客'),
('Google AI Blog', 'https://ai.googleblog.com/feeds/posts/default', 'en', 10, 'Google AI官方博客'),
('DeepMind Blog', 'https://deepmind.google/discover/blog/rss/', 'en', 10, 'DeepMind官方博客'),
('Meta AI Blog', 'https://ai.meta.com/blog/feed/', 'en', 9, 'Meta AI官方博客'),
('Microsoft AI Blog', 'https://blogs.microsoft.com/ai/feed/', 'en', 9, 'Microsoft AI官方博客'),
('36氪AI', 'https://36kr.com/feed', 'zh', 8, '36氪科技媒体'),
('机器之心', 'https://www.jiqizhixin.com/rss', 'zh', 8, '机器之心AI媒体'),
('AI科技大本营', 'https://www.csdn.net/tags/AjTaAg2sMzE0LWJsb2cO0O0O.html/rss', 'zh', 7, 'CSDN AI频道');

