import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// 验证优惠码
export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { code, order_amount, product_id, user_email } = body

    if (!code) {
      return NextResponse.json({ success: false, error: "请输入优惠码" }, { status: 400 })
    }

    // 查找优惠码（不区分大小写）
    const coupons = await sql`
      SELECT * FROM coupon_codes 
      WHERE UPPER(code) = UPPER(${code}) AND status = 'active'
    `

    // 如果找不到优惠码，尝试作为推广码查找
    if (coupons.length === 0) {
      const referrers = await sql`
        SELECT id, username, referral_code, commission_rate 
        FROM referrers 
        WHERE UPPER(referral_code) = UPPER(${code}) AND status = 'active'
      `
      
      if (referrers.length === 0) {
        return NextResponse.json({ success: false, error: "优惠码不存在或已失效" }, { status: 400 })
      }
      
      // 找到推广码，动态生成折扣
      const referrer = referrers[0]
      const userDiscount = Math.max(5, Math.floor(Number(referrer.commission_rate) / 2))
      const discountAmount = (order_amount || 0) * (userDiscount / 100)
      
      return NextResponse.json({
        success: true,
        data: {
          coupon_id: null,
          code: referrer.referral_code,
          discount_type: "percent",
          discount_value: userDiscount,
          discount_amount: discountAmount,
          description: `推广优惠：${userDiscount}% 折扣（来自 ${referrer.username}）`,
          referrer_id: referrer.id,
          referral_code: referrer.referral_code,
          is_referral: true
        }
      })
    }

    const coupon = coupons[0]

    // 检查有效期
    const now = new Date()
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json({ success: false, error: "优惠码尚未生效" }, { status: 400 })
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json({ success: false, error: "优惠码已过期" }, { status: 400 })
    }

    // 检查使用次数限制
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ success: false, error: "优惠码已达使用上限" }, { status: 400 })
    }

    // 检查用户使用次数限制
    if (user_email && coupon.per_user_limit) {
      const userUsage = await sql`
        SELECT COUNT(*) as count FROM coupon_usage 
        WHERE coupon_id = ${coupon.id} AND user_email = ${user_email}
      `
      if (Number(userUsage[0].count) >= coupon.per_user_limit) {
        return NextResponse.json({ success: false, error: "您已使用过此优惠码" }, { status: 400 })
      }
    }

    // 检查最低订单金额
    if (order_amount && coupon.min_order_amount && order_amount < Number(coupon.min_order_amount)) {
      return NextResponse.json({ 
        success: false, 
        error: `订单金额需满 ¥${coupon.min_order_amount} 才能使用此优惠码` 
      }, { status: 400 })
    }

    // 检查适用产品
    if (coupon.applicable_products && coupon.applicable_products.length > 0 && product_id) {
      if (!coupon.applicable_products.includes(product_id)) {
        return NextResponse.json({ success: false, error: "此优惠码不适用于当前产品" }, { status: 400 })
      }
    }

    // 计算折扣金额
    let discountAmount = 0
    if (coupon.discount_type === "fixed") {
      discountAmount = Number(coupon.discount_value)
    } else if (coupon.discount_type === "percent") {
      discountAmount = (order_amount || 0) * (Number(coupon.discount_value) / 100)
      // 应用最大折扣限制
      if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
        discountAmount = Number(coupon.max_discount_amount)
      }
    }

    // 确保折扣不超过订单金额
    if (order_amount && discountAmount > order_amount) {
      discountAmount = order_amount
    }

    return NextResponse.json({
      success: true,
      data: {
        coupon_id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
        description: coupon.discount_type === "fixed" 
          ? `立减 ¥${coupon.discount_value}` 
          : `${coupon.discount_value}% 折扣${coupon.max_discount_amount ? `（最高减 ¥${coupon.max_discount_amount}）` : ''}`
      }
    })
  } catch (error) {
    console.error("[v0] 验证优惠码失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "验证优惠码失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}
