-- 修复推广员表结构，添加缺失的字段
-- 如果表已存在，先删除再重新创建以确保结构正确

DROP TABLE IF EXISTS referral_withdrawals CASCADE;
DROP TABLE IF EXISTS referral_orders CASCADE;
DROP TABLE IF EXISTS referrers CASCADE;

-- 创建推广员表
CREATE TABLE referrers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- 这是缺失的字段
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    available_balance DECIMAL(10,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'disabled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建推广订单表
CREATE TABLE referral_orders (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES referrers(id) ON DELETE CASCADE,
    order_id VARCHAR(100) NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4) DEFAULT 0.05, -- 5% 佣金率
    commission_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);

-- 创建提现记录表
CREATE TABLE referral_withdrawals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES referrers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_account VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- 创建索引以提升查询性能
CREATE INDEX idx_referrers_email ON referrers(email);
CREATE INDEX idx_referrers_referral_code ON referrers(referral_code);
CREATE INDEX idx_referrers_status ON referrers(status);
CREATE INDEX idx_referral_orders_referrer_id ON referral_orders(referrer_id);
CREATE INDEX idx_referral_orders_order_id ON referral_orders(order_id);
CREATE INDEX idx_referral_orders_status ON referral_orders(status);
CREATE INDEX idx_referral_withdrawals_referrer_id ON referral_withdrawals(referrer_id);
CREATE INDEX idx_referral_withdrawals_status ON referral_withdrawals(status);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为推广员表添加更新时间戳触发器
CREATE TRIGGER update_referrers_updated_at 
    BEFORE UPDATE ON referrers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 插入测试数据（可选）
-- INSERT INTO referrers (username, email, password_hash, referral_code) 
-- VALUES ('test_referrer', 'test@example.com', '$2a$10$example_hash', 'TEST1234');
