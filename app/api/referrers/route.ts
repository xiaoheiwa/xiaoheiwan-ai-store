import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// GET - 获取所有推广用户列表
export async function GET() {
  try {
    const sql = getDb()
    
    const referrers = await sql`
      SELECT 
        id, 
        username as name, 
        email,
        referral_code, 
        commission_rate, 
        status, 
        total_orders,
        total_earnings,
        available_balance,
        created_at
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
    const { username, referral_code, commission_rate, email } = body

    if (!username || !referral_code || !commission_rate) {
      return NextResponse.json({
        success: false,
        error: "缺少必填字段"
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

    // 创建推广用户
    const result = await sql`
      INSERT INTO referrers (username, referral_code, commission_rate, email, status)
      VALUES (${username}, ${referral_code}, ${parseFloat(commission_rate)}, ${email || null}, 'active')
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
