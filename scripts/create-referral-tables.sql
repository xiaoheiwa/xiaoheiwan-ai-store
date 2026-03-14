-- 创建推广员表
CREATE TABLE IF NOT EXISTS referrers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- 佣金比例，默认10%
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    withdrawn_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, banned
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建推广记录表
CREATE TABLE IF NOT EXISTS referral_orders (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES referrers(id),
    order_no VARCHAR(255) REFERENCES orders(out_trade_no),
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, paid
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    paid_at TIMESTAMP
);

-- 创建提现记录表
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES referrers(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- alipay, wechat, bank
    payment_account VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, paid
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_referrers_code ON referrers(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_orders_referrer ON referral_orders(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_orders_order ON referral_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_referrer ON withdrawal_requests(referrer_id);

-- 插入测试数据
INSERT INTO referrers (username, email, password_hash, referral_code, commission_rate) 
VALUES 
    ('demo_referrer', 'demo@example.com', '$2b$10$dummy.hash.for.demo.purposes.only', 'DEMO2024', 15.00)
ON CONFLICT (username) DO NOTHING;
