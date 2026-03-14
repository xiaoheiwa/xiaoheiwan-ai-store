-- Create audit log table for security tracking
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    admin_id VARCHAR(50) NOT NULL,
    target_id VARCHAR(50),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at);

-- Add missing indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_referral_orders_status ON referral_orders(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_referrers_status ON referrers(status);
