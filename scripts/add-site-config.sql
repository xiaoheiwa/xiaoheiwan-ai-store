-- Site configuration table for storing settings
CREATE TABLE IF NOT EXISTS site_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment method settings
INSERT INTO site_config (key, value) VALUES 
  ('payment_alipay_enabled', 'true'),
  ('payment_usdt_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
