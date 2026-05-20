import { NextResponse } from "next/server"
import { neon } from "@/lib/db-client"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, email, phone, reason, promotion_channels, expected_monthly_orders } = body

    if (!username || !email) {
      return NextResponse.json({
        success: false,
        error: "请填写必填信息"
      }, { status: 400 })
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({
        success: false,
        error: "请输入有效的邮箱地址"
      }, { status: 400 })
    }

    const sql = getDb()

    // 检查是否已经是推广员
    const existingReferrer = await sql`
      SELECT id FROM referrers WHERE email = ${email}
    `
    if (existingReferrer.length > 0) {
      return NextResponse.json({
        success: false,
        error: "该邮箱已是推广员，请直接登录推广员面板"
      }, { status: 400 })
    }

    // 检查是否已有待审核的申请
    const existingApplication = await sql`
      SELECT id, status FROM promoter_applications 
      WHERE email = ${email} 
      ORDER BY created_at DESC 
      LIMIT 1
    `
    if (existingApplication.length > 0) {
      if (existingApplication[0].status === "pending") {
        return NextResponse.json({
          success: false,
          error: "您已提交过申请，正在审核中，请耐心等待"
        }, { status: 400 })
      }
      if (existingApplication[0].status === "rejected") {
        // 允许被拒绝的用户重新申请
      }
    }

    // 创建申请
    await sql`
      INSERT INTO promoter_applications (
        username, email, phone, reason, promotion_channels, expected_monthly_orders, status
      ) VALUES (
        ${username}, ${email}, ${phone || null}, ${reason || null}, 
        ${promotion_channels || null}, ${expected_monthly_orders || null}, 'pending'
      )
    `

    return NextResponse.json({
      success: true,
      message: "申请已提交，请等待审核"
    })
  } catch (error) {
    console.error("[v0] 提交推广员申请失败:", error)
    return NextResponse.json({
      success: false,
      error: "提交失败，请稍后重试"
    }, { status: 500 })
  }
}
