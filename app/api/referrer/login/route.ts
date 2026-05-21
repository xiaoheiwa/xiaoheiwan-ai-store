import { NextResponse } from "next/server"
import { neon } from "@/lib/db-client"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set")
  }
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "请输入邮箱和密码" }, { status: 400 })
    }

    // 查找推广用户
    const users = await sql`
      SELECT id, username, email, password_hash, referral_code, commission_rate, status,
             total_orders, total_earnings, available_balance
      FROM referrers 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "邮箱或密码错误" }, { status: 401 })
    }

    const user = users[0]

    if (user.status !== "active") {
      return NextResponse.json({ success: false, error: "账号已被禁用" }, { status: 403 })
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ success: false, error: "邮箱或密码错误" }, { status: 401 })
    }

    // 生成 JWT token
    const token = await new SignJWT({ 
      id: user.id, 
      email: user.email,
      type: "referrer"
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(getJwtSecret())

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          referral_code: user.referral_code,
          commission_rate: user.commission_rate,
          total_orders: user.total_orders || 0,
          total_earnings: user.total_earnings || 0,
          available_balance: user.available_balance || 0
        }
      }
    })
  } catch (error) {
    console.error("[v0] 推广员登录失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "登录失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}
