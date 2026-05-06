import { type NextRequest, NextResponse } from "next/server"

// 渠道1 API - 通过 shop.xiaoheiwan.com 代理（极速渠道）
const GPT_API_BASE = "https://shop.xiaoheiwan.com/chatgpt/index.php"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, cdk, platformCredential, codes, cdks, sessionCookie } = body

    console.log("[v0] GPT Activate API (渠道1) - action:", action)

    let apiUrl = ""
    let requestBody: Record<string, unknown> = {}

    switch (action) {
      case "redeem_verify":
        // 兑换前校验 - 需要 CDK 和 ChatGPT 账号凭证
        apiUrl = `${GPT_API_BASE}?api=redeem_verify`
        requestBody = {
          cdk,
          platformCredential: body.platformCredential
        }
        break

      case "redeem_confirm":
        // 确认兑换
        apiUrl = `${GPT_API_BASE}?api=redeem_confirm`
        requestBody = {
          cdk,
          confirm: true,
          platformCredential: body.platformCredential
        }
        break

      case "cdks_batch_query":
        // 批量查询卡密状态
        apiUrl = `${GPT_API_BASE}?api=cdks_batch_query`
        requestBody = { codes: codes || [cdk] }
        break

      case "cdks_filter_unused":
        // 筛选未使用卡密
        apiUrl = `${GPT_API_BASE}?api=cdks_filter_unused`
        requestBody = { cdks }
        break

      // 兼容旧的 action 名称 - 仅验证 CDK 是否有效
      case "check_cdk":
        apiUrl = `${GPT_API_BASE}?api=cdks_batch_query`
        requestBody = { codes: [cdk] }
        break

      default:
        return NextResponse.json({ 
          success: false, 
          error: { code: "INVALID_ACTION", message: "未知的操作类型" }
        }, { status: 400 })
    }

    // 构建请求头
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "XiaoHeiWan-Store/1.0",
    }

    if (sessionCookie) {
      headers["Cookie"] = sessionCookie
    }

    console.log("[v0] Forwarding to:", apiUrl)

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
        error: { code: "INVALID_RESPONSE", message: "后端返回格式错误" }
      }, { status: 502 })
    }

    console.log("[v0] Response status:", response.status, "success:", data.success)

    // 处理 check_cdk 的响应格式转换（兼容旧前端）
    if (action === "check_cdk" && data.success && data.data?.items?.[0]) {
      const item = data.data.items[0]
      return NextResponse.json({
        success: true,
        data: {
          code: item.code,
          status: item.status,
          is_valid: item.status === "unused",
          is_used: item.status === "used",
          used_info: item.usedInfo || null,
          // 兼容旧字段
          allow_new_submission: item.status === "unused",
          has_existing_record: item.status === "used",
          existing_record: item.usedInfo ? { bound_email_masked: item.usedInfo.maskedEmail } : null
        },
        sessionCookie: setCookieHeader || null
      })
    }

    // 添加 session cookie 到响应
    if (setCookieHeader) {
      data.sessionCookie = setCookieHeader
    }

    return NextResponse.json(data)

  } catch (error: unknown) {
    console.error("[v0] GPT Activate API error:", error)
    return NextResponse.json({ 
      success: false, 
      error: { code: "SERVER_ERROR", message: "服务器错误，请稍后重试" }
    }, { status: 500 })
  }
}
