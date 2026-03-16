-- Add region selection fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS region_options JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS require_region_selection BOOLEAN DEFAULT FALSE;

-- Add selected region fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS selected_region VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS region_name VARCHAR(100) DEFAULT NULL;

-- Add comment to explain the region_options structure
-- region_options format: [{"code": "US", "name": "美国", "price": 99.00}, {"code": "CN", "name": "中国", "price": 89.00}]
-- If price is null, use the product's base price
