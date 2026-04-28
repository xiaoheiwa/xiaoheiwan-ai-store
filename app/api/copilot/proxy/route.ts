import { NextRequest, NextResponse } from "next/server"

const UPSTREAM_BASE = "https://easygithub.com/index.php?route="

// 存储 session 映射 (内存存储，生产环境建议用 Redis)
const sessionStore = new Map<string, string>()

// POST - 代理转发到源站
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sessionId, ...data } = body

    let upstreamUrl = ""
    switch (action) {
      case "verify-code":
        upstreamUrl = `${UPSTREAM_BASE}/api/verify-code`
        break
      case "submit-recharge":
        upstreamUrl = `${UPSTREAM_BASE}/api/submit-recharge`
        break
      case "callback":
        // 处理 OAuth 回调
        upstreamUrl = `${UPSTREAM_BASE}/api/callback&code=${data.code}`
        break
      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }

    // 获取已存储的 PHP session
    const phpSessionId = sessionId ? sessionStore.get(sessionId) : undefined
    console.log("[Copilot Proxy] POST to:", upstreamUrl, "sessionId:", sessionId, "phpSession:", phpSessionId)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Origin": "https://easygithub.com",
      "Referer": "https://easygithub.com/",
    }

    if (phpSessionId) {
      headers["Cookie"] = `PHPSESSID=${phpSessionId}`
    }

    const fetchOptions: RequestInit = {
      method: action === "callback" ? "GET" : "POST",
      headers,
    }

    if (action !== "callback") {
      fetchOptions.body = JSON.stringify(data)
    }

    const response = await fetch(upstreamUrl, fetchOptions)

    // 解析并存储 Set-Cookie 中的 PHPSESSID
    const setCookie = response.headers.get("set-cookie")
    if (setCookie && sessionId) {
      const match = setCookie.match(/PHPSESSID=([^;]+)/)
      if (match) {
        sessionStore.set(sessionId, match[1])
        console.log("[Copilot Proxy] Stored PHP session:", match[1], "for sessionId:", sessionId)
      }
    }

    const text = await response.text()
    console.log("[Copilot Proxy] Response:", text.substring(0, 500))

    try {
      const json = JSON.parse(text)
      return NextResponse.json(json)
    } catch {
      // 如果不是 JSON，可能是 HTML 页面或错误
      if (text.includes("success") || text.includes("token")) {
        return NextResponse.json({ success: true, message: "操作完成" })
      }
      return NextResponse.json({ success: false, message: "请求失败，请重试", raw: text.substring(0, 200) })
    }
  } catch (error) {
    console.error("[Copilot Proxy] Error:", error)
    return NextResponse.json({ success: false, message: "网络错误" }, { status: 500 })
  }
}

// GET - 轮询授权状态或处理回调
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const sessionId = searchParams.get("sessionId")
    const code = searchParams.get("code")

    // 处理 OAuth callback
    if (code && sessionId) {
      const phpSessionId = sessionStore.get(sessionId)
      console.log("[Copilot Proxy] Callback with code:", code, "sessionId:", sessionId, "phpSession:", phpSessionId)

      const callbackUrl = `${UPSTREAM_BASE}/api/callback&code=${code}`
      
      const response = await fetch(callbackUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json, text/html",
          ...(phpSessionId ? { Cookie: `PHPSESSID=${phpSessionId}` } : {}),
        },
      })

      // 更新 session
      const setCookie = response.headers.get("set-cookie")
      if (setCookie && sessionId) {
        const match = setCookie.match(/PHPSESSID=([^;]+)/)
        if (match) {
          sessionStore.set(sessionId, match[1])
        }
      }

      const text = await response.text()
      console.log("[Copilot Proxy] Callback response:", text.substring(0, 300))

      // 返回一个简单的成功页面，告诉用户可以关闭窗口
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>授权成功</title>
          <style>
            body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0d1117; color: #e6edf3; }
            .container { text-align: center; }
            .success { color: #3fb950; font-size: 48px; }
            p { color: #7d8590; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✓</div>
            <h2>授权成功</h2>
            <p>请返回激活页面继续操作</p>
            <p>此窗口可以关闭</p>
            <script>
              // 通知父窗口授权完成
              if (window.opener) {
                window.opener.postMessage({ type: 'copilot-auth-success', code: '${code}' }, '*');
              }
              setTimeout(() => window.close(), 2000);
            </script>
          </div>
        </body>
        </html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      )
    }

    // 轮询授权状态
    if (action === "poll" && sessionId) {
      const phpSessionId = sessionStore.get(sessionId)
      
      if (!phpSessionId) {
        return NextResponse.json({ success: false, message: "Session not found" })
      }

      const upstreamUrl = `${UPSTREAM_BASE}/api/poll`
      console.log("[Copilot Proxy] Poll with phpSession:", phpSessionId)

      const response = await fetch(upstreamUrl, {
        method: "GET",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Cookie": `PHPSESSID=${phpSessionId}`,
        },
      })

      const text = await response.text()
      console.log("[Copilot Proxy] Poll response:", text.substring(0, 300))

      try {
        const json = JSON.parse(text)
        return NextResponse.json(json)
      } catch {
        return NextResponse.json({ success: false, message: "等待授权中..." })
      }
    }

    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("[Copilot Proxy] GET Error:", error)
    return NextResponse.json({ success: false, message: "网络错误" }, { status: 500 })
  }
}
