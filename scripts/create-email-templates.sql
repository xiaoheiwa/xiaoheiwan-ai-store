CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY DEFAULT 'default',
  shop_name TEXT NOT NULL DEFAULT '小黑丸AI激活码商城',
  greeting TEXT NOT NULL DEFAULT '您好，感谢您的购买！您的激活码已准备就绪。',
  tips TEXT NOT NULL DEFAULT '请妥善保管您的激活码，切勿泄露给他人\n激活码仅限一次使用，使用后将自动失效\n如遇问题请添加客服微信获取帮助',
  wechat_id TEXT NOT NULL DEFAULT 'xbbdkj-com',
  footer_text TEXT NOT NULL DEFAULT '此邮件由系统自动发送，请勿回复',
  primary_color TEXT NOT NULL DEFAULT '#0f172a',
  secondary_color TEXT NOT NULL DEFAULT '#1e293b',
  custom_note TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO email_templates (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
