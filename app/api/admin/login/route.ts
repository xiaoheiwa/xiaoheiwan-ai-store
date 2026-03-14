import { type NextRequest, NextResponse } from "next/server"
import {
  verifyPassword,
  createAdminToken,
  checkRateLimit,
  recordFailedLogin,
  clearFailedLogins,
} from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = checkRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `登录尝试次数过多，请 ${rateLimit.retryAfterSeconds} 秒后再试`,
          retryAfter: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds || 900),
          },
        }
      )
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: "请输入密码" }, { status: 400 })
    }

    if (!verifyPassword(password)) {
      recordFailedLogin(request)
      const afterFail = checkRateLimit(request)
      return NextResponse.json(
        {
          error: "密码错误",
          remaining: afterFail.remaining,
        },
        { status: 401 }
      )
    }

    // Password correct - clear failed attempts and create JWT
    clearFailedLogins(request)
    const token = await createAdminToken()

    const response = NextResponse.json({ success: true, token })

    // Set HttpOnly cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
