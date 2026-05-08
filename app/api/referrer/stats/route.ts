import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { jwtVerify } from "jose"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "referrer-secret-key-change-in-production")

// 验证 token 并获取用户 ID
async function verifyToken(request: Request): Promise<number | null> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.type !== "referrer" || !payload.id) {
      return null
    }
    return payload.id as number
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const referrerId = await verifyToken(request)
    if (!referrerId) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 })
    }

    const sql = getDb()

    // 获取推广用户基本信息
    const users = await sql`
      SELECT id, username, email, referral_code, commission_rate, status,
             total_orders, total_earnings, available_balance, created_at
      FROM referrers WHERE id = ${referrerId}
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 })
    }

    const user = users[0]

    // 获取关联的优惠码列表
    const coupons = await sql`
      SELECT id, code, discount_type, discount_value, used_count, usage_limit, status, created_at
      FROM coupon_codes 
      WHERE referrer_id = ${referrerId}
      ORDER BY created_at DESC
    `

    // 获取优惠码使用记录（最近50条）
    const usageRecords = await sql`
      SELECT cu.*, cc.code as coupon_code
      FROM coupon_usage cu
      JOIN coupon_codes cc ON cu.coupon_id = cc.id
      WHERE cu.referrer_id = ${referrerId}
      ORDER BY cu.used_at DESC
      LIMIT 50
    `

    // 统计数据
    const stats = await sql`
      SELECT 
        COUNT(*) as total_usage,
        COALESCE(SUM(order_amount), 0) as total_order_amount,
        COALESCE(SUM(commission_amount), 0) as total_commission
      FROM coupon_usage 
      WHERE referrer_id = ${referrerId}
    `

    // 本月统计
    const monthlyStats = await sql`
      SELECT 
        COUNT(*) as month_usage,
        COALESCE(SUM(order_amount), 0) as month_order_amount,
        COALESCE(SUM(commission_amount), 0) as month_commission
      FROM coupon_usage 
      WHERE referrer_id = ${referrerId}
        AND used_at >= date_trunc('month', CURRENT_DATE)
    `

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          referral_code: user.referral_code,
          commission_rate: user.commission_rate,
          total_orders: user.total_orders || 0,
          total_earnings: Number(user.total_earnings) || 0,
          available_balance: Number(user.available_balance) || 0,
          created_at: user.created_at
        },
        coupons: coupons.map(c => ({
          ...c,
          discount_value: Number(c.discount_value)
        })),
        usage_records: usageRecords.map(r => ({
          ...r,
          order_amount: Number(r.order_amount),
          discount_amount: Number(r.discount_amount),
          commission_amount: Number(r.commission_amount)
        })),
        stats: {
          total_usage: Number(stats[0].total_usage),
          total_order_amount: Number(stats[0].total_order_amount),
          total_commission: Number(stats[0].total_commission),
          month_usage: Number(monthlyStats[0].month_usage),
          month_order_amount: Number(monthlyStats[0].month_order_amount),
          month_commission: Number(monthlyStats[0].month_commission)
        }
      }
    })
  } catch (error) {
    console.error("[v0] 获取推广员数据失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "获取数据失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}
