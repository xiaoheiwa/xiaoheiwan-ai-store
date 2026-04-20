-- 添加 GitHub Copilot 激活分类
INSERT INTO product_categories (id, name, slug, description, icon, sort_order, is_active, payment_name, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'GitHub Copilot 激活',
  'github-copilot',
  'GitHub Copilot AI 编程助手充值激活服务',
  'code',
  100,
  true,
  'Copilot激活',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
