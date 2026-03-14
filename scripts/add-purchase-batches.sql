-- Create purchase_batches table for tracking cost per batch of imported codes
CREATE TABLE IF NOT EXISTS purchase_batches (
  id SERIAL PRIMARY KEY,
  batch_name VARCHAR(100),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplier VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add batch_id to activation_codes to link each code to its purchase batch
ALTER TABLE activation_codes ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES purchase_batches(id);
