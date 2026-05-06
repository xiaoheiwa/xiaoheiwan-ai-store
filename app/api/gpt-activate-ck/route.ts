import { type NextRequest, NextResponse } from "next/server"

// CK渠道 API - 直接请求 ck.duolg.com
const GPT_CK_API_BASE = "https://ck.duolg.com/api/external/redeem"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, cdk, platformCredential } = body

    let apiUrl = ""
    let requestBody: Record<string, unknown> = {}

    switch (action) {
      case "verify":
        // 验证兑换 - 需要 CDK 和 ChatGPT 账号凭证
        // POST /api/external/redeem/verify
        apiUrl = `${GPT_CK_API_BASE}/verify`
        requestBody = {
          cdk,
          platformCredential
        }
        break

      case "confirm":
        // 确认兑换
        // POST /api/external/redeem/confirm
        apiUrl = `${GPT_CK_API_BASE}/confirm`
        requestBody = {
          cdk,
          confirm: true,
          platformCredential
        }
        break

      default:
        return NextResponse.json({ 
          success: false, 
          error: { code: "INVALID_ACTION", message: "未知的操作类型，支持: verify, confirm" }
        }, { status: 400 })
    }

    // 构建请求头
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    const text = await response.text()
    
    let data
    try {
      data = JSON.parse(text)
    } catch {
      console.error("[v0] CK API Invalid JSON response:", text.substring(0, 500))
      return NextResponse.json({
        success: false,
        error: { code: "INVALID_RESPONSE", message: "后端返回格式错误" }
      }, { status: 502 })
    }

    // 直接返回源站响应
    return NextResponse.json(data)

  } catch (error: unknown) {
    console.error("[v0] GPT CK Activate API error:", error)
    return NextResponse.json({ 
      success: false, 
      error: { code: "SERVER_ERROR", message: "服务器错误，请稍后重试" }
    }, { status: 500 })
  }
}
