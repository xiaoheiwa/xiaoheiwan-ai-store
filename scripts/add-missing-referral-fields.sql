-- 添加推广员表缺失的字段
ALTER TABLE referrers 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.05,
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS withdrawn_amount DECIMAL(10,2) DEFAULT 0.00;

-- 更新现有推广员的默认佣金率为5%
UPDATE referrers 
SET commission_rate = 0.05 
WHERE commission_rate IS NULL OR commission_rate = 0;

-- 添加索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_referrers_status ON referrers(status);
CREATE INDEX IF NOT EXISTS idx_referrers_referral_code ON referrers(referral_code);

-- 确保推广订单表有正确的字段
ALTER TABLE referral_orders 
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- 添加推广订单表的索引
CREATE INDEX IF NOT EXISTS idx_referral_orders_referrer_id ON referral_orders(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_orders_status ON referral_orders(status);
CREATE INDEX IF NOT EXISTS idx_referral_orders_created_at ON referral_orders(created_at);
