-- Create referrers table for referral system
CREATE TABLE IF NOT EXISTS referrers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    real_name VARCHAR(100),
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    commission_rate DECIMAL(5,4) DEFAULT 0.05,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    available_balance DECIMAL(10,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create referral_orders table for tracking referral orders
CREATE TABLE IF NOT EXISTS referral_orders (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES referrers(id),
    order_id VARCHAR(100) NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create referral_withdrawals table for tracking withdrawal requests
CREATE TABLE IF NOT EXISTS referral_withdrawals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES referrers(id),
    amount DECIMAL(10,2) NOT NULL,
    bank_info TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrers_referral_code ON referrers(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrers_username ON referrers(username);
CREATE INDEX IF NOT EXISTS idx_referral_orders_referrer_id ON referral_orders(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_orders_order_id ON referral_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_referral_withdrawals_referrer_id ON referral_withdrawals(referrer_id);
