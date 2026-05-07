import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// 获取优惠码列表
export async function GET() {
  try {
    const coupons = await sql`
      SELECT 
        id, code, discount_type, discount_value, 
        min_order_amount, max_discount_amount,
        usage_limit, used_count, per_user_limit,
        applicable_products, valid_from, valid_until,
        status, notes, created_at
      FROM coupon_codes 
      ORDER BY created_at DESC
    `
    return NextResponse.json({ success: true, data: coupons })
  } catch (error) {
    console.error("获取优惠码失败:", error)
    return NextResponse.json({ success: false, error: "获取优惠码失败" }, { status: 500 })
  }
}

// 创建优惠码
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      code,
      discount_type = "fixed", // fixed: 固定金额, percent: 百分比
      discount_value,
      min_order_amount = 0,
      max_discount_amount = null,
      usage_limit = null,
      per_user_limit = 1,
      applicable_products = null,
      valid_from = new Date().toISOString(),
      valid_until = null,
      status = "active",
      notes = null
    } = body

    if (!code || !discount_value) {
      return NextResponse.json({ success: false, error: "优惠码和折扣值为必填项" }, { status: 400 })
    }

    // 检查优惠码是否已存在
    const existing = await sql`SELECT id FROM coupon_codes WHERE code = ${code.toUpperCase()}`
    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: "优惠码已存在" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO coupon_codes (
        code, discount_type, discount_value, min_order_amount, max_discount_amount,
        usage_limit, per_user_limit, applicable_products, valid_from, valid_until, status, notes
      ) VALUES (
        ${code.toUpperCase()}, ${discount_type}, ${discount_value}, ${min_order_amount}, ${max_discount_amount},
        ${usage_limit}, ${per_user_limit}, ${applicable_products}, ${valid_from}, ${valid_until}, ${status}, ${notes}
      ) RETURNING *
    `

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error("创建优惠码失败:", error)
    return NextResponse.json({ success: false, error: "创建优惠码失败" }, { status: 500 })
  }
}

// 删除优惠码
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少优惠码ID" }, { status: 400 })
    }

    await sql`DELETE FROM coupon_codes WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除优惠码失败:", error)
    return NextResponse.json({ success: false, error: "删除优惠码失败" }, { status: 500 })
  }
}

// 更新优惠码
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少优惠码ID" }, { status: 400 })
    }

    // 动态构建更新语句
    const fields = Object.keys(updates)
    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "没有要更新的字段" }, { status: 400 })
    }

    // 简单更新状态
    if (updates.status) {
      await sql`UPDATE coupon_codes SET status = ${updates.status}, updated_at = NOW() WHERE id = ${id}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("更新优惠码失败:", error)
    return NextResponse.json({ success: false, error: "更新优惠码失败" }, { status: 500 })
  }
}
