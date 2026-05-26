import { type NextRequest, NextResponse } from "next/server"
import {
  verifyPassword,
  createAdminToken,
  checkRateLimit,
  recordFailedLogin,
  clearFailedLogins,
} from "@/lib/admin-auth"
import { logAttackAttempt, countRecentByType, notifyAttack } from "@/lib/security-alert"

export const runtime = "nodejs"

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

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

      const ip = getClientIp(request)
      await logAttackAttempt({
        type: "admin_brute_force",
        ip,
        detail: `失败密码尝试 (UA: ${(request.headers.get("user-agent") || "").slice(0, 80)})`,
      })
      const count = await countRecentByType({ type: "admin_brute_force", ip, windowMinutes: 5 })
      if (count >= 5) {
        await notifyAttack({
          type: "admin_brute_force",
          ip,
          count,
          windowLabel: "5 分钟",
          detail: "5 分钟内连续多次密码错误,疑似撞库/爆破",
        })
      }

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
