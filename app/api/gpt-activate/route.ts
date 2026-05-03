import { type NextRequest, NextResponse } from "next/server"

const GPT_API_URL = "https://chongzhi.pro"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sessionCookie, ...params } = body

    let targetUrl = ""
    let requestBody: Record<string, unknown> = {}

    // 根据 action 路由到不同的 API 端点
    switch (action) {
      case "check_cdk":
        // 验证激活码
        targetUrl = `${GPT_API_URL}/api-verify.php`
        requestBody = { activation_code: params.cdk || params.activation_code }
        break
      
      case "recharge":
        // 提交充值 - 使用 simple-submit-recharge.php
        targetUrl = `${GPT_API_URL}/simple-submit-recharge.php`
        requestBody = {
          user_data: params.user_data
        }
        break
      
      case "reuse_existing":
        // 复用已有记录 - 使用 api-recharge-reuse.php
        targetUrl = `${GPT_API_URL}/api-recharge-reuse.php`
        requestBody = {
          action: "reuse_record"
        }
        break

      case "update_token":
        // 更新Token并充值 - 使用 api-recharge-reuse.php
        targetUrl = `${GPT_API_URL}/api-recharge-reuse.php`
        requestBody = {
          action: "update_token",
          card_code: params.cdk || params.card_code,
          json_data: params.user_data || params.json_data
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: "Unknown action", message: "未知的操作类型" },
          { status: 400 }
        )
    }

    console.log("[v0] GPT activate proxy:", { action, targetUrl, hasSessionCookie: !!sessionCookie })

    // 构建请求 headers，包含 session cookie
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Accept": "application/json",
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
      console.error("[v0] Invalid JSON response:", text.substring(0, 200))
      return NextResponse.json(
        { success: false, error: "Invalid response", message: "后端返回格式错误", raw: text.substring(0, 200) },
        { status: 502 }
      )
    }

    // 如果是验证激活码请求，返回 session cookie 给前端
    if (action === "check_cdk" && setCookieHeader) {
      // 提取 PHPSESSID
      const sessionMatch = setCookieHeader.match(/PHPSESSID=([^;]+)/)
      if (sessionMatch) {
        data.sessionCookie = `PHPSESSID=${sessionMatch[1]}`
      }
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("[v0] GPT activate proxy error:", error)
    return NextResponse.json(
      { success: false, error: "Network error", message: "网络请求失败，请重试" },
      { status: 500 }
    )
  }
}
