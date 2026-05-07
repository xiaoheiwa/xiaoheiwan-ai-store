-- 优惠码表
CREATE TABLE IF NOT EXISTS coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 优惠码（唯一）
  code VARCHAR(50) NOT NULL UNIQUE,
  -- 优惠类型: fixed (固定金额), percentage (百分比)
  discount_type VARCHAR(20) NOT NULL DEFAULT 'fixed',
  -- 优惠值: 固定金额时为金额，百分比时为折扣比例(如10表示10%)
  discount_value NUMERIC(10,2) NOT NULL,
  -- 最低消费金额
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  -- 最大折扣金额（百分比优惠时使用）
  max_discount_amount NUMERIC(10,2) DEFAULT NULL,
  -- 使用次数限制（NULL表示不限制）
  usage_limit INTEGER DEFAULT NULL,
  -- 已使用次数
  used_count INTEGER DEFAULT 0,
  -- 每用户使用次数限制（NULL表示不限制）
  per_user_limit INTEGER DEFAULT 1,
  -- 适用产品ID列表（NULL表示全部产品）
  applicable_products UUID[] DEFAULT NULL,
  -- 开始时间
  valid_from TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  -- 结束时间（NULL表示永久有效）
  valid_until TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL,
  -- 状态: active, inactive, expired
  status VARCHAR(20) DEFAULT 'active',
  -- 备注（内部使用）
  notes TEXT DEFAULT NULL,
  -- 创建时间
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  -- 更新时间
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 优惠码使用记录表
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 优惠码ID
  coupon_id UUID NOT NULL REFERENCES coupon_codes(id) ON DELETE CASCADE,
  -- 订单号
  order_no VARCHAR(100) NOT NULL,
  -- 用户邮箱
  user_email VARCHAR(255) NOT NULL,
  -- 优惠金额
  discount_amount NUMERIC(10,2) NOT NULL,
  -- 使用时间
  used_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_status ON coupon_codes(status);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_email ON coupon_usage(user_email);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_no ON coupon_usage(order_no);
