import { type NextRequest, NextResponse } from "next/server"

// 新渠道源站 - ck.duolg.com (Vue.js SPA 应用)
const GPT_API_URL = "https://ck.duolg.com"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sessionCookie, ...params } = body

    let targetUrl = ""
    let requestBody: Record<string, unknown> = {}

    // 根据 action 路由到不同的 API 端点
    // 注意：这个源站是 Vue.js SPA，API 端点可能不同
    switch (action) {
      case "check_cdk":
        // 验证激活码 - 假设 API 路径
        targetUrl = `${GPT_API_URL}/api/verify`
        requestBody = { 
          code: params.cdk || params.activation_code,
          activation_code: params.cdk || params.activation_code
        }
        break
      
      case "recharge":
        // 提交充值
        targetUrl = `${GPT_API_URL}/api/recharge`
        requestBody = {
          code: params.cdk,
          user_data: params.user_data,
          token: params.user_data
        }
        break
      
      case "reuse_existing":
        // 复用已有记录
        targetUrl = `${GPT_API_URL}/api/reuse`
        requestBody = {
          code: params.cdk,
          action: "reuse"
        }
        break

      case "update_token":
        // 更新Token并充值
        targetUrl = `${GPT_API_URL}/api/update`
        requestBody = {
          code: params.cdk || params.card_code,
          token: params.user_data || params.json_data
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: "Unknown action", message: "未知的操作类型" },
          { status: 400 }
        )
    }

    console.log("[v0] GPT CK channel proxy:", { action, targetUrl, hasSessionCookie: !!sessionCookie })

    // 构建请求 headers，包含 session cookie
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Origin": GPT_API_URL,
      "Referer": `${GPT_API_URL}/`,
    }
    
    if (sessionCookie) {
      headers["Cookie"] = sessionCookie
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    // 获取响应中的 Set-Cookie header
    const setCookieHeader = response.headers.get("set-cookie")
    
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      console.error("[v0] CK channel invalid JSON response:", text.substring(0, 200))
      return NextResponse.json(
        { success: false, error: "Invalid response", message: "后端返回格式错误", raw: text.substring(0, 200) },
        { status: 502 }
      )
    }

    // 如果是验证激活码请求，返回 session cookie 给前端
    if (action === "check_cdk" && setCookieHeader) {
      // 尝试提取各种可能的 session cookie 名称
      const sessionPatterns = [
        /PHPSESSID=([^;]+)/,
        /session=([^;]+)/,
        /token=([^;]+)/,
        /([a-zA-Z_]+session[a-zA-Z_]*)=([^;]+)/i
      ]
      
      for (const pattern of sessionPatterns) {
        const match = setCookieHeader.match(pattern)
        if (match) {
          if (match[2]) {
            data.sessionCookie = `${match[1]}=${match[2]}`
          } else {
            data.sessionCookie = match[0]
          }
          console.log("[v0] CK channel session cookie extracted:", data.sessionCookie)
          break
        }
      }
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("[v0] GPT CK channel proxy error:", error)
    return NextResponse.json(
      { success: false, error: "Network error", message: "网络请求失败，请重试" },
      { status: 500 }
    )
  }
}
