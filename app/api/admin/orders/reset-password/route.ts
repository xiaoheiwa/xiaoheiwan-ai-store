import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

// 验证管理员
async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword || token !== adminPassword) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
  return null
}

// 哈希密码
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

// POST: 重置订单查询密码
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { orderNo, newPassword } = await request.json()

    if (!orderNo) {
      return NextResponse.json({ error: "订单号不能为空" }, { status: 400 })
    }

    if (!newPassword || newPassword.length < 4 || newPassword.length > 20) {
      return NextResponse.json({ error: "密码长度需要4-20位" }, { status: 400 })
    }

    // 检查订单是否存在
    const orders = await sql`
      SELECT out_trade_no FROM orders WHERE out_trade_no = ${orderNo}
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }

    // 更新密码
    const passwordHash = hashPassword(newPassword)
    await sql`
      UPDATE orders SET query_password_hash = ${passwordHash}, updated_at = NOW()
      WHERE out_trade_no = ${orderNo}
    `

    return NextResponse.json({ success: true, message: "查询密码已重置" })
  } catch (error) {
    console.error("[v0] Reset order password error:", error)
    return NextResponse.json({ error: "重置密码失败" }, { status: 500 })
  }
}
