-- 修复佣金比例字段精度问题
-- 将 commission_rate 从 DECIMAL(5,4) 改为 DECIMAL(5,2) 以支持百分比格式

-- 更新 referrers 表的 commission_rate 字段
ALTER TABLE referrers 
ALTER COLUMN commission_rate TYPE DECIMAL(5,2);

-- 更新 referral_orders 表的 commission_rate 字段
ALTER TABLE referral_orders 
ALTER COLUMN commission_rate TYPE DECIMAL(5,2);

-- 将现有的小数格式佣金率转换为百分比格式
-- 例如：0.05 -> 5.00, 0.10 -> 10.00
UPDATE referrers 
SET commission_rate = commission_rate * 100 
WHERE commission_rate < 1;

UPDATE referral_orders 
SET commission_rate = commission_rate * 100 
WHERE commission_rate < 1;

-- 确保默认值是百分比格式
ALTER TABLE referrers 
ALTER COLUMN commission_rate SET DEFAULT 5.00;
