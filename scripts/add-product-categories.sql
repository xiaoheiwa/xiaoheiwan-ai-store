-- Create product categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add category_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);

-- Insert default categories
INSERT INTO product_categories (name, slug, description, icon, sort_order) VALUES
  ('ChatGPT', 'chatgpt', 'ChatGPT Plus、Team 等相关产品', 'MessageSquare', 1),
  ('Claude', 'claude', 'Anthropic Claude Pro 相关产品', 'Bot', 2),
  ('其他AI', 'other-ai', 'Grok、Gemini 等其他 AI 服务', 'Sparkles', 3),
  ('工具软件', 'tools', '实用工具和软件激活码', 'Wrench', 4)
ON CONFLICT (slug) DO NOTHING;
