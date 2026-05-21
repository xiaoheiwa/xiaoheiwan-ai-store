import { neon } from "@/lib/db-client"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// 获取优惠码列表（包含推广用户信息）
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const sql = getDb()
    const coupons = await sql`
      SELECT 
        c.id, c.code, c.discount_type, c.discount_value, 
        c.min_order_amount, c.max_discount_amount,
        c.usage_limit, c.used_count, c.per_user_limit,
        c.applicable_products, c.valid_from, c.valid_until,
        c.status, c.notes, c.created_at,
        c.referrer_id, c.commission_rate,
        r.username as referrer_name, r.referral_code as referrer_code
      FROM coupon_codes c
      LEFT JOIN referrers r ON c.referrer_id = r.id
      ORDER BY c.created_at DESC
    `
    return NextResponse.json({ success: true, data: coupons })
  } catch (error) {
    console.error("[v0] 获取优惠码失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "获取优惠码失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}

// 创建优惠码
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const sql = getDb()
    const body = await request.json()
    
    const {
      code,
      discount_type = "fixed",
      discount_value,
      min_order_amount = 0,
      max_discount_amount = null,
      usage_limit = null,
      per_user_limit = 1,
      valid_until = null,
      notes = null,
      referrer_id = null,
      commission_rate = null
    } = body

    // 验证必填字段
    if (!code || !code.trim()) {
      return NextResponse.json({ success: false, error: "请填写优惠码" }, { status: 400 })
    }
    
    if (discount_value === undefined || discount_value === null || Number(discount_value) <= 0) {
      return NextResponse.json({ success: false, error: "请填写有效的折扣值" }, { status: 400 })
    }

    const upperCode = code.trim().toUpperCase()

    // 检查优惠码是否已存在
    const existing = await sql`SELECT id FROM coupon_codes WHERE code = ${upperCode}`
    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: "优惠码已存在" }, { status: 400 })
    }

    // 插入优惠码
    const result = await sql`
      INSERT INTO coupon_codes (
        code, discount_type, discount_value, min_order_amount, max_discount_amount,
        usage_limit, per_user_limit, valid_from, valid_until, 
        status, notes, referrer_id, commission_rate, used_count
      ) VALUES (
        ${upperCode}, 
        ${discount_type}, 
        ${Number(discount_value)}, 
        ${Number(min_order_amount) || 0}, 
        ${max_discount_amount ? Number(max_discount_amount) : null},
        ${usage_limit ? Number(usage_limit) : null}, 
        ${Number(per_user_limit) || 1}, 
        NOW(),
        ${valid_until || null}, 
        'active', 
        ${notes || null}, 
        ${referrer_id ? Number(referrer_id) : null}, 
        ${commission_rate ? Number(commission_rate) : null},
        0
      ) RETURNING *
    `

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error("[v0] 创建优惠码失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "创建优惠码失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}

// 删除优惠码
export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少优惠码ID" }, { status: 400 })
    }

    await sql`DELETE FROM coupon_codes WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 删除优惠码失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "删除优惠码失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}

// 更新优惠码
export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const sql = getDb()
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少优惠码ID" }, { status: 400 })
    }

    if (status) {
      await sql`UPDATE coupon_codes SET status = ${status}, updated_at = NOW() WHERE id = ${id}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 更新优惠码失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "更新优惠码失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}
