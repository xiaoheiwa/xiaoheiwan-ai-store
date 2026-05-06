import { type NextRequest, NextResponse } from "next/server"

// 极速渠道 API - chongzhi.pro
const GPT_API_URL = "https://chongzhi.pro/"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, cdk, user_data, sessionCookie } = body

    let apiUrl = ""
    let requestBody: Record<string, unknown> = {}

    switch (action) {
      case "check_cdk":
        // 验证激活码
        apiUrl = `${GPT_API_URL}api-verify.php`
        requestBody = { activation_code: cdk }
        break

      case "recharge":
        // 提交充值
        apiUrl = `${GPT_API_URL}simple-submit-recharge.php`
        requestBody = { 
          activation_code: cdk,
          user_data: user_data 
        }
        break

      case "reuse_existing":
        // 复用已有记录
        apiUrl = `${GPT_API_URL}api-recharge-reuse.php`
        requestBody = { 
          activation_code: cdk,
          action: "reuse_record"
        }
        break

      case "update_token":
        // 更新 Token
        apiUrl = `${GPT_API_URL}api-recharge-reuse.php`
        requestBody = { 
          activation_code: cdk,
          action: "update_token",
          user_data: user_data
        }
        break

      default:
        return NextResponse.json({ 
          success: false, 
          error: "未知的操作类型" 
        }, { status: 400 })
    }

    // 构建请求头
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "XiaoHeiWan-Store/1.0",
    }

    // 如果有 session cookie，添加到请求头
    if (sessionCookie) {
      headers["Cookie"] = sessionCookie
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    const setCookieHeader = response.headers.get("set-cookie")
    const text = await response.text()
    
    let data
    try {
      data = JSON.parse(text)
    } catch {
      console.error("[v0] Invalid JSON response:", text.substring(0, 200))
      return NextResponse.json({
        success: false,
        error: "后端返回格式错误"
      }, { status: 502 })
    }

    // 如果是验证激活码请求，返回 session cookie 给前端
    if (action === "check_cdk" && setCookieHeader) {
      // 提取 ios_gpt_session (源站使用的 session 名称)
      const sessionMatch = setCookieHeader.match(/ios_gpt_session=([^;]+)/)
      if (sessionMatch) {
        data.sessionCookie = `ios_gpt_session=${sessionMatch[1]}`
      }
    }

    return NextResponse.json(data)

  } catch (error: unknown) {
    console.error("[v0] GPT Activate API (极速渠道) error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "服务器错误，请稍后重试"
    }, { status: 500 })
  }
}
