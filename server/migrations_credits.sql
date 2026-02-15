-- ============================================================
-- 积分功能数据库变更（无新表，仅给 users 增加 credits 字段）
-- 1 credit = 0.1 元；充值订单使用现有 orders 表，verify_type = 'credit_recharge'
-- ============================================================

-- 为 users 表增加积分字段（若列已存在会报错，可忽略）
ALTER TABLE `users`
  ADD COLUMN `credits` int(11) NOT NULL DEFAULT 0
  COMMENT '用户积分，1 credit = 0.1 元'
  AFTER `last_login_at`;
