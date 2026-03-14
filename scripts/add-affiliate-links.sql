-- Create affiliate_links table for managing promotional links
CREATE TABLE IF NOT EXISTS affiliate_links (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'other',
  url TEXT NOT NULL,
  logo_url TEXT,
  highlight TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories: vps, proxy, node, tool, other
-- Example initial data (commented out)
-- INSERT INTO affiliate_links (name, description, category, url, highlight, sort_order) VALUES
-- ('RackNerd', '高性价比美国VPS，年付低至$10', 'vps', 'https://example.com/aff/racknerd', '年付$10起', 1),
-- ('搬瓦工', '稳定可靠的CN2 GIA线路', 'vps', 'https://example.com/aff/bwg', 'CN2 GIA', 2);
