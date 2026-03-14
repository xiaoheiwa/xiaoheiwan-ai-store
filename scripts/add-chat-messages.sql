-- Create chat messages table for customer support
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) NOT NULL,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'admin')),
  message TEXT NOT NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(100),
  telegram_message_id BIGINT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for session lookup
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Create chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_email VARCHAR(255),
  user_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
