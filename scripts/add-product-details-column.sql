-- Add details column to products table for rich product information
ALTER TABLE products ADD COLUMN IF NOT EXISTS details text DEFAULT '';
