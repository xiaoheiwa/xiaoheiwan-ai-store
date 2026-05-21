-- Global market compatibility layer.
-- This migration is additive only: it does not delete or rewrite existing CN products,
-- orders, inventory, payment records, or email templates.

CREATE TABLE IF NOT EXISTS product_market_listings (
  id TEXT NOT NULL PRIMARY KEY,
  product_id TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT 'CN',
  enabled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'CNY',
  price REAL NOT NULL,
  compare_at_price REAL,
  service_level TEXT,
  refund_policy TEXT,
  risk_notice TEXT,
  seo_title TEXT,
  seo_description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, market),
  UNIQUE(market, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_market_listings_market_status
  ON product_market_listings(market, enabled, status);

CREATE INDEX IF NOT EXISTS idx_product_market_listings_product
  ON product_market_listings(product_id);

CREATE INDEX IF NOT EXISTS idx_product_market_listings_slug
  ON product_market_listings(market, slug);

CREATE TABLE IF NOT EXISTS email_market_templates (
  id TEXT NOT NULL PRIMARY KEY,
  market TEXT NOT NULL DEFAULT 'CN',
  template_type TEXT NOT NULL DEFAULT 'delivery',
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(market, template_type)
);

CREATE INDEX IF NOT EXISTS idx_email_market_templates_market
  ON email_market_templates(market, template_type);

-- Run the ALTER TABLE statements below only once per database. D1/SQLite does not
-- support ADD COLUMN IF NOT EXISTS consistently, so check PRAGMA table_info before
-- applying them in production.

ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'digital_code';
ALTER TABLE products ADD COLUMN inventory_mode TEXT DEFAULT 'shared';
ALTER TABLE products ADD COLUMN base_cost REAL;
ALTER TABLE products ADD COLUMN gallery_images TEXT;

ALTER TABLE activation_codes ADD COLUMN market TEXT DEFAULT 'SHARED';
ALTER TABLE activation_codes ADD COLUMN delivered_at TEXT;
ALTER TABLE activation_codes ADD COLUMN delivery_order_no TEXT;
ALTER TABLE activation_codes ADD COLUMN invalid_reason TEXT;

ALTER TABLE orders ADD COLUMN market TEXT DEFAULT 'CN';
ALTER TABLE orders ADD COLUMN product_listing_id TEXT;
ALTER TABLE orders ADD COLUMN product_title_snapshot TEXT;
ALTER TABLE orders ADD COLUMN product_description_snapshot TEXT;
ALTER TABLE orders ADD COLUMN price_snapshot REAL;
ALTER TABLE orders ADD COLUMN currency TEXT DEFAULT 'CNY';
ALTER TABLE orders ADD COLUMN service_level_snapshot TEXT;
ALTER TABLE orders ADD COLUMN refund_policy_snapshot TEXT;
ALTER TABLE orders ADD COLUMN risk_notice_snapshot TEXT;
ALTER TABLE orders ADD COLUMN payment_method TEXT;
ALTER TABLE orders ADD COLUMN payment_network TEXT;
ALTER TABLE orders ADD COLUMN token TEXT;
ALTER TABLE orders ADD COLUMN payment_address TEXT;
ALTER TABLE orders ADD COLUMN expected_amount REAL;
ALTER TABLE orders ADD COLUMN received_amount REAL;
ALTER TABLE orders ADD COLUMN tx_hash TEXT;
ALTER TABLE orders ADD COLUMN confirmations INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN payment_expired_at TEXT;
ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN delivery_status TEXT DEFAULT 'not_delivered';
ALTER TABLE orders ADD COLUMN risk_status TEXT DEFAULT 'normal';
ALTER TABLE orders ADD COLUMN manual_review_reason TEXT;
ALTER TABLE orders ADD COLUMN customer_ip TEXT;
ALTER TABLE orders ADD COLUMN customer_country TEXT;
ALTER TABLE orders ADD COLUMN user_agent TEXT;
ALTER TABLE orders ADD COLUMN wallet_address TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_market_created_at ON orders(market, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_network ON orders(payment_network);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_tx_hash ON orders(tx_hash);
CREATE INDEX IF NOT EXISTS idx_activation_codes_market_product_status
  ON activation_codes(market, product_id, status);
