type CouponRow = Record<string, any>

type CouponValidationOptions = {
  productId: string
  email: string
  subtotal: number
}

function getApplicableProducts(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value !== "string" || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    const trimmed = value.trim()
    if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return []
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.replace(/^"|"$/g, "").trim())
      .filter(Boolean)
  }
}

export async function getCouponRejectionReason(sql: any, coupon: CouponRow, options: CouponValidationOptions) {
  const now = Date.now()
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) return "优惠码尚未生效"
  if (coupon.valid_until && new Date(coupon.valid_until).getTime() < now) return "优惠码已过期"
  if (coupon.usage_limit && Number(coupon.used_count) >= Number(coupon.usage_limit)) return "优惠码已达使用上限"
  if (coupon.min_order_amount && options.subtotal < Number(coupon.min_order_amount)) return "订单金额未达到优惠码使用条件"

  const applicableProducts = getApplicableProducts(coupon.applicable_products)
  if (applicableProducts.length > 0 && !applicableProducts.includes(options.productId)) {
    return "此优惠码不适用于当前产品"
  }

  if (coupon.per_user_limit && options.email) {
    const usage = await sql`
      SELECT COUNT(*) as count
      FROM coupon_usage
      WHERE coupon_id = ${coupon.id}
        AND LOWER(user_email) = LOWER(${options.email})
    `
    if (Number(usage[0]?.count || 0) >= Number(coupon.per_user_limit)) return "您已达到此优惠码的使用次数上限"
  }

  return null
}

export function calculateCouponDiscount(coupon: CouponRow, subtotal: number) {
  let discount = 0
  if (coupon.discount_type === "fixed") {
    discount = Number(coupon.discount_value)
  } else if (coupon.discount_type === "percent") {
    discount = subtotal * (Number(coupon.discount_value) / 100)
    if (coupon.max_discount_amount && discount > Number(coupon.max_discount_amount)) {
      discount = Number(coupon.max_discount_amount)
    }
  }
  return Math.min(discount, subtotal)
}
