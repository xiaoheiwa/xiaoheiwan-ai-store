-- Telegram Bot 数据库迁移
-- 添加 telegram_users 表和 orders 表的 telegram_chat_id 字段

-- 1. 创建 telegram_users 表
CREATE TABLE IF NOT EXISTS telegram_users (
  id SERIAL PRIMARY KEY,
  chat_id VARCHAR(50) UNIQUE NOT NULL,
  username VARCHAR(100),
  first_name VARCHAR(100),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

-- 2. 为 orders 表添加 telegram_chat_id 字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON telegram_users(chat_id);
CREATE INDEX IF NOT EXISTS idx_orders_telegram_chat_id ON orders(telegram_chat_id);
