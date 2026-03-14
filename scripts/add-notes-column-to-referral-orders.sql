-- Add notes column to referral_orders table for tracking blocked commissions
ALTER TABLE referral_orders 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for better query performance on status
CREATE INDEX IF NOT EXISTS idx_referral_orders_status ON referral_orders(status);

-- Add index for better query performance on referrer_id and status
CREATE INDEX IF NOT EXISTS idx_referral_orders_referrer_status ON referral_orders(referrer_id, status);
