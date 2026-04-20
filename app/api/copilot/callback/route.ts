import { NextRequest, NextResponse } from "next/server"

const UPSTREAM_CALLBACK = "https://easygithub.com/index.php?route=/api/callback"

// GET - OAuth 回调
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.redirect(new URL("/copilot?error=missing_code", request.url))
    }

    // 转发到源站
    const upstreamUrl = `${UPSTREAM_CALLBACK}&code=${code}`
    console.log("[Copilot Callback] Redirecting to:", upstreamUrl)

    // 源站会处理 code 并设置 session
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "manual",
    })

    // 获取源站返回的 cookie
    const setCookie = response.headers.get("set-cookie")
    
    // 重定向回我们的页面
    const redirectUrl = new URL("/copilot?auth=success", request.url)
    const res = NextResponse.redirect(redirectUrl)
    
    if (setCookie) {
      // 转发 session cookie
      res.headers.set("Set-Cookie", setCookie)
    }

    return res
  } catch (error) {
    console.error("[Copilot Callback] Error:", error)
    return NextResponse.redirect(new URL("/copilot?error=callback_failed", request.url))
  }
}
