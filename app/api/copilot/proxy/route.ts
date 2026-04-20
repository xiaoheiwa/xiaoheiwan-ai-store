import { NextRequest, NextResponse } from "next/server"

const UPSTREAM_BASE = "https://easygithub.com/index.php?route="

// POST - 代理转发到源站
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    let upstreamUrl = ""
    switch (action) {
      case "verify-code":
        upstreamUrl = `${UPSTREAM_BASE}/api/verify-code`
        break
      case "submit-recharge":
        upstreamUrl = `${UPSTREAM_BASE}/api/submit-recharge`
        break
      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }

    console.log("[Copilot Proxy] POST to:", upstreamUrl)

    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify(data),
    })

    const text = await response.text()
    console.log("[Copilot Proxy] Response:", text.substring(0, 500))

    try {
      const json = JSON.parse(text)
      return NextResponse.json(json)
    } catch {
      return NextResponse.json({ success: false, message: "卡密不存在或请求被拦截" })
    }
  } catch (error) {
    console.error("[Copilot Proxy] Error:", error)
    return NextResponse.json({ success: false, message: "网络错误" }, { status: 500 })
  }
}

// GET - 轮询授权状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "poll") {
      // 获取 session cookie
      const sessionId = request.cookies.get("copilot_session")?.value
      
      const upstreamUrl = `${UPSTREAM_BASE}/api/poll`
      console.log("[Copilot Proxy] GET poll, session:", sessionId)

      const response = await fetch(upstreamUrl, {
        method: "GET",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          ...(sessionId ? { Cookie: `PHPSESSID=${sessionId}` } : {}),
        },
      })

      const json = await response.json()
      
      // 获取 Set-Cookie 并转发
      const setCookie = response.headers.get("set-cookie")
      const res = NextResponse.json(json)
      if (setCookie) {
        res.headers.set("Set-Cookie", setCookie)
      }
      return res
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[Copilot Proxy] GET Error:", error)
    return NextResponse.json({ success: false, message: "网络错误" }, { status: 500 })
  }
}
