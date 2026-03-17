-- Add image_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN products.image_url IS 'Product image URL for display';
