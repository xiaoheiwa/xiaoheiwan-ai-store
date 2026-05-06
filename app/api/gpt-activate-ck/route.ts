import { type NextRequest, NextResponse } from "next/server"

// CK渠道 API - 通过 shop.xiaoheiwan.com 代理 (ck.duolg.com)
const GPT_CK_API_BASE = "https://shop.xiaoheiwan.com/chatgpt/index.php"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, cdk, platformCredential, codes, cdks, sessionCookie } = body

    let apiUrl = ""
    let requestBody: Record<string, unknown> = {}

    switch (action) {
      case "redeem_verify":
        // 兑换前校验 - 需要 CDK 和 ChatGPT 账号凭证
        apiUrl = `${GPT_CK_API_BASE}?api=redeem_verify`
        requestBody = {
          cdk,
          platformCredential
        }
        break

      case "redeem_confirm":
        // 确认兑换
        apiUrl = `${GPT_CK_API_BASE}?api=redeem_confirm`
        requestBody = {
          cdk,
          confirm: true,
          platformCredential
        }
        break

      case "cdks_batch_query":
        // 批量查询卡密状态
        apiUrl = `${GPT_CK_API_BASE}?api=cdks_batch_query`
        requestBody = { codes: codes || [cdk] }
        break

      case "cdks_filter_unused":
        // 筛选未使用卡密
        apiUrl = `${GPT_CK_API_BASE}?api=cdks_filter_unused`
        requestBody = { cdks }
        break

      // 验证 CDK 是否有效
      case "check_cdk":
        apiUrl = `${GPT_CK_API_BASE}?api=cdks_batch_query`
        requestBody = { codes: [cdk] }
        break

      default:
        return NextResponse.json({ 
          success: false, 
          error: { code: "INVALID_ACTION", message: "未知的操作类型" }
        }, { status: 400 })
    }

    // 构建请求头 - 使用更完整的浏览器 headers 避免 Cloudflare 拦截
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Origin": "https://shop.xiaoheiwan.com",
      "Referer": "https://shop.xiaoheiwan.com/",
      "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    }

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
      // 检查是否是 Cloudflare 拦截
      if (text.includes("Just a moment") || text.includes("Cloudflare")) {
        console.error("[v0] CK API blocked by Cloudflare")
        return NextResponse.json({
          success: false,
          error: { 
            code: "CLOUDFLARE_BLOCKED", 
            message: "CK渠道暂时无法访问，请稍后重试或使用极速渠道",
            fallback_url: "/activate/gpt"
          }
        }, { status: 503 })
      }
      console.error("[v0] CK API Invalid JSON response:", text.substring(0, 200))
      return NextResponse.json({
        success: false,
        error: { code: "INVALID_RESPONSE", message: "后端返回格式错误" }
      }, { status: 502 })
    }

    // 处理 check_cdk 的响应格式转换
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
    console.error("[v0] GPT CK Activate API error:", error)
    return NextResponse.json({ 
      success: false, 
      error: { code: "SERVER_ERROR", message: "服务器错误，请稍后重试" }
    }, { status: 500 })
  }
}
