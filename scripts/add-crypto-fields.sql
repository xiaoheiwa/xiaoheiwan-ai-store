-- Add crypto payment fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_tx_hash VARCHAR(128);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_status VARCHAR(20) DEFAULT NULL;
-- crypto_status: null (not crypto), 'submitted' (tx hash submitted), 'confirmed' (payment verified), 'failed' (verification failed)

-- Create index for crypto orders
CREATE INDEX IF NOT EXISTS idx_orders_crypto_status ON orders(crypto_status) WHERE crypto_status IS NOT NULL;
