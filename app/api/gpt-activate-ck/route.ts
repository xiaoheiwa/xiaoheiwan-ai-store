import { type NextRequest, NextResponse } from "next/server"

// 渠道2 API - CK渠道 (ck.duolg.com)
// 状态：待对接 - 需要用户提供 API 文档
const GPT_CK_API_BASE = "https://ck.duolg.com"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    console.log("[v0] GPT Activate API (渠道2-CK) - action:", action)

    // CK渠道尚未对接，返回提示信息
    return NextResponse.json({
      success: false,
      error: {
        code: "CHANNEL_PENDING",
        message: "CK渠道正在对接中，请暂时使用极速渠道"
      },
      redirect: "/activate/gpt" // 建议跳转到极速渠道
    }, { status: 503 })

  } catch (error: unknown) {
    console.error("[v0] GPT CK Activate API error:", error)
    return NextResponse.json({ 
      success: false, 
      error: { code: "SERVER_ERROR", message: "服务器错误，请稍后重试" }
    }, { status: 500 })
  }
}
