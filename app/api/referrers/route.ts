import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// GET - 获取所有推广用户列表
export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const all = searchParams.get("all") === "true"
    
    // 如果 all=true 返回所有用户（包括禁用的），否则只返回活跃用户
    const referrers = all
      ? await sql`
          SELECT 
            id, username as name, email, referral_code, 
            commission_rate, status, total_orders,
            total_earnings, available_balance, created_at
          FROM referrers
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT 
            id, username as name, email, referral_code, 
            commission_rate, status, total_orders,
            total_earnings, available_balance, created_at
          FROM referrers
          WHERE status = 'active'
          ORDER BY created_at DESC
        `
    
    return NextResponse.json({
      success: true,
      data: referrers
    })
  } catch (error) {
    console.error("[v0] 获取推广用户失败:", error)
    return NextResponse.json({
      success: false,
      error: "获取推广用户列表失败: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}

// POST - 创建推广用户
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, referral_code, commission_rate, email, password } = body

    if (!username || !email || !password || !referral_code || !commission_rate) {
      return NextResponse.json({
        success: false,
        error: "缺少必填字段（用户名、邮箱、密码、推广码、佣金比例）"
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: "密码至少需要6位"
      }, { status: 400 })
    }

    const sql = getDb()

    // 检查推广码是否已存在
    const existing = await sql`
      SELECT id FROM referrers WHERE referral_code = ${referral_code}
    `
    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: "推广码已存在"
      }, { status: 400 })
    }

    // 检查邮箱是否已存在
    const existingEmail = await sql`
      SELECT id FROM referrers WHERE email = ${email}
    `
    if (existingEmail.length > 0) {
      return NextResponse.json({
        success: false,
        error: "该邮箱已被注册"
      }, { status: 400 })
    }

    // 哈希密码
    const password_hash = await bcrypt.hash(password, 10)

    // 创建推广用户
    const result = await sql`
      INSERT INTO referrers (username, referral_code, commission_rate, email, password_hash, status)
      VALUES (${username}, ${referral_code}, ${parseFloat(commission_rate)}, ${email}, ${password_hash}, 'active')
      RETURNING id, username as name, referral_code, commission_rate, status, created_at
    `

    return NextResponse.json({
      success: true,
      data: result[0]
    })
  } catch (error) {
    console.error("[v0] 创建推广用户失败:", error)
    return NextResponse.json({
      success: false,
      error: "创建推广用户失败: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}

// DELETE - 删除推广用户
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "缺少推广用户ID"
      }, { status: 400 })
    }

    const sql = getDb()

    // 删除用户（关联的优惠码 referrer_id 会自动设为 NULL）
    await sql`DELETE FROM referrers WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 删除推广用户失败:", error)
    return NextResponse.json({
      success: false,
      error: "删除推广用户失败: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}

// PATCH - 更新推广用户状态（仅支持状态切换，不支持信息修改）
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "缺少推广用户ID"
      }, { status: 400 })
    }

    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json({
        success: false,
        error: "无效的状态值"
      }, { status: 400 })
    }

    const sql = getDb()
    await sql`
      UPDATE referrers 
      SET status = ${status}, updated_at = NOW() 
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 更新推广用户状态失败:", error)
    return NextResponse.json({
      success: false,
      error: "更新状态失败: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}
