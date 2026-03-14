-- Add client_ip column to orders table for fraud detection
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_ip VARCHAR(45);

-- Add index for IP-based queries
CREATE INDEX IF NOT EXISTS idx_orders_client_ip ON orders(client_ip);

-- Add index for referral fraud detection queries
CREATE INDEX IF NOT EXISTS idx_referral_orders_referrer_created ON referral_orders(referrer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_referral_orders_amount_created ON referral_orders(referrer_id, order_amount, created_at);
