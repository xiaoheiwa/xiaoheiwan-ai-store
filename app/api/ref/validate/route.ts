import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// GET - 验证推广码并返回关联的优惠信息
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ success: false, error: "缺少推广码" }, { status: 400 })
    }

    const sql = getDb()

    // 先查找推广用户
    const referrers = await sql`
      SELECT id, username, commission_rate
      FROM referrers
      WHERE UPPER(referral_code) = UPPER(${code}) AND status = 'active'
    `

    if (referrers.length === 0) {
      return NextResponse.json({ success: false, error: "推广码无效" })
    }

    const referrer = referrers[0]

    // 查找该推广员的默认优惠码（第一个有效的）
    const coupons = await sql`
      SELECT id, code, discount_type, discount_value
      FROM coupon_codes
      WHERE referrer_id = ${referrer.id} 
        AND status = 'active'
        AND (valid_until IS NULL OR valid_until > NOW())
        AND (usage_limit IS NULL OR used_count < usage_limit)
      ORDER BY created_at ASC
      LIMIT 1
    `

    // 如果推广员没有专属优惠码，创建一个默认的折扣（基于佣金比例）
    let discountInfo
    if (coupons.length > 0) {
      const coupon = coupons[0]
      discountInfo = {
        referrer_id: referrer.id,
        referrer_name: referrer.username,
        coupon_id: coupon.id,
        coupon_code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value)
      }
    } else {
      // 没有优惠码时，使用推广码本身，给予基于佣金比例的折扣
      // 例如佣金10%，则给用户5%折扣
      const userDiscount = Math.floor(Number(referrer.commission_rate) / 2)
      discountInfo = {
        referrer_id: referrer.id,
        referrer_name: referrer.username,
        coupon_id: null,
        coupon_code: code.toUpperCase(),
        discount_type: "percent",
        discount_value: userDiscount > 0 ? userDiscount : 5 // 最少5%折扣
      }
    }

    return NextResponse.json({
      success: true,
      data: discountInfo
    })
  } catch (error) {
    console.error("[v0] 验证推广码失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "验证失败" 
    }, { status: 500 })
  }
}
