-- Add payment_name column to product_categories table
-- This field stores the generic product name for payment gateway to avoid content review issues

ALTER TABLE product_categories 
ADD COLUMN IF NOT EXISTS payment_name VARCHAR(100) DEFAULT '数字商品';

-- Add comment for documentation
COMMENT ON COLUMN product_categories.payment_name IS 'Generic product name displayed on payment gateway for content compliance';
