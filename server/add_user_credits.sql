-- 为用户表增加积分字段：1 credit = 0.1 元
-- 若列已存在会报错，可忽略或先检查
ALTER TABLE `users` ADD COLUMN `credits` int(11) NOT NULL DEFAULT 0 COMMENT '用户积分，1 credit = 0.1 元' AFTER `last_login_at`;
