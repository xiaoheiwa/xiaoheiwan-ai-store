import { neon } from "@/lib/db-client"
import { NextResponse, NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// 获取优惠码使用记录
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const referrerId = searchParams.get("referrer_id")

    let records
    if (code) {
      // 按优惠码查询
      records = await sql`
        SELECT 
          u.id, u.order_no, u.user_email, u.discount_amount, 
          u.order_amount, u.commission_amount, u.used_at,
          c.code as coupon_code,
          r.username as referrer_name
        FROM coupon_usage u
        JOIN coupon_codes c ON u.coupon_id = c.id
        LEFT JOIN referrers r ON u.referrer_id = r.id
        WHERE UPPER(c.code) = UPPER(${code})
        ORDER BY u.used_at DESC
      `
    } else if (referrerId) {
      // 按推广用户查询
      records = await sql`
        SELECT 
          u.id, u.order_no, u.user_email, u.discount_amount, 
          u.order_amount, u.commission_amount, u.used_at,
          c.code as coupon_code,
          r.username as referrer_name
        FROM coupon_usage u
        JOIN coupon_codes c ON u.coupon_id = c.id
        LEFT JOIN referrers r ON u.referrer_id = r.id
        WHERE u.referrer_id = ${parseInt(referrerId)}
        ORDER BY u.used_at DESC
      `
    } else {
      // 获取全部记录
      records = await sql`
        SELECT 
          u.id, u.order_no, u.user_email, u.discount_amount, 
          u.order_amount, u.commission_amount, u.used_at,
          c.code as coupon_code,
          r.username as referrer_name
        FROM coupon_usage u
        JOIN coupon_codes c ON u.coupon_id = c.id
        LEFT JOIN referrers r ON u.referrer_id = r.id
        ORDER BY u.used_at DESC
        LIMIT 100
      `
    }

    return NextResponse.json({ success: true, data: records })
  } catch (error) {
    console.error("[v0] 获取使用记录失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "获取使用记录失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}

// 获取推广用户的佣金统计
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const sql = getDb()
    const { referrer_id } = await request.json()

    if (!referrer_id) {
      return NextResponse.json({ success: false, error: "缺少推广用户ID" }, { status: 400 })
    }

    // 统计佣金数据
    const stats = await sql`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(order_amount), 0) as total_order_amount,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(SUM(commission_amount), 0) as total_commission
      FROM coupon_usage
      WHERE referrer_id = ${referrer_id}
    `

    // 获取该推广用户的所有优惠码
    const coupons = await sql`
      SELECT 
        c.code, c.discount_type, c.discount_value, c.used_count,
        COALESCE(SUM(u.commission_amount), 0) as earned_commission
      FROM coupon_codes c
      LEFT JOIN coupon_usage u ON u.coupon_id = c.id
      WHERE c.referrer_id = ${referrer_id}
      GROUP BY c.id, c.code, c.discount_type, c.discount_value, c.used_count
      ORDER BY c.created_at DESC
    `

    return NextResponse.json({ 
      success: true, 
      data: {
        stats: stats[0],
        coupons
      }
    })
  } catch (error) {
    console.error("[v0] 获取佣金统计失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "获取佣金统计失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}
