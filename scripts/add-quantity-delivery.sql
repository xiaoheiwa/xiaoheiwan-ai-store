-- Add delivery_type and price_tiers to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(20) DEFAULT 'auto';
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_tiers JSONB DEFAULT NULL;

-- Add quantity, delivery_type, codes to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(20) DEFAULT 'auto';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMP DEFAULT NULL;
