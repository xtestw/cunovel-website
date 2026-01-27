-- 订单表 - 存储支付宝订单信息
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_id` VARCHAR(64) NOT NULL COMMENT '订单号（out_trade_no）',
  `trade_no` VARCHAR(64) DEFAULT NULL COMMENT '支付宝交易号（trade_no）',
  `verify_type` VARCHAR(50) NOT NULL COMMENT '核验类型：consistency, basicInfo, insuranceLog',
  `form_data` JSON NOT NULL COMMENT '查询的具体内容（JSON格式）',
  `user_id` INT(11) DEFAULT NULL COMMENT '用户ID（可选）',
  `client_ip` VARCHAR(45) DEFAULT NULL COMMENT '订单发起的IP地址',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '订单金额',
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '订单状态：pending, paid, failed, cancelled',
  `trade_status` VARCHAR(20) DEFAULT NULL COMMENT '支付宝交易状态：WAIT_BUYER_PAY, TRADE_SUCCESS, TRADE_FINISHED等',
  `subject` VARCHAR(255) NOT NULL COMMENT '订单标题',
  `result_data` JSON DEFAULT NULL COMMENT '查询结果（JSON格式）',
  `verified_at` DATETIME DEFAULT NULL COMMENT '查询完成时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `paid_at` DATETIME DEFAULT NULL COMMENT '支付时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_id` (`order_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_trade_no` (`trade_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表 - 存储支付宝订单信息';

