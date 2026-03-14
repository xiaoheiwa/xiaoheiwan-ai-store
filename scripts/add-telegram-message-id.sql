-- Add telegram_message_id to chat_sessions for reply tracking
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_chat_sessions_telegram_message_id ON chat_sessions(telegram_message_id);
