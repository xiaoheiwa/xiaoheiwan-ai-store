-- 创建系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认工具配置
INSERT INTO system_settings (key, value)
VALUES ('tools_config', '{"twofa": true, "gmailChecker": true}')
ON CONFLICT (key) DO NOTHING;
