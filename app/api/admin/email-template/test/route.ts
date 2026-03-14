import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { sendCodeMail } from "@/lib/resend"
import { getEnv } from "@/lib/env"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    // Pre-check: validate RESEND_API_KEY before attempting to send
    const resendKey = getEnv("RESEND_API_KEY")
    console.log("[v0] Test email - RESEND_API_KEY check:", {
      exists: !!resendKey,
      length: resendKey.length,
      prefix: resendKey ? resendKey.substring(0, 3) : "N/A",
      fromProcessEnv: !!process.env.RESEND_API_KEY,
    })

    if (!resendKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY 环境变量未设置。请在左侧 Vars 面板中添加有效的 Resend API Key。" },
        { status: 500 },
      )
    }

    if (!resendKey.startsWith("re_")) {
      return NextResponse.json(
        { error: `RESEND_API_KEY 格式无效（应以 re_ 开头，当前以 "${resendKey.substring(0, 5)}..." 开头）。请在 https://resend.com/api-keys 获取正确的 API Key。` },
        { status: 500 },
      )
    }

    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 })
    }

    await sendCodeMail({
      to: email,
      subject: "[测试邮件] 激活码发送效果预览",
      activationCode: "TEST-XXXX-DEMO-1234",
      orderNo: "TEST20260211001",
      productName: "示例产品 Pro (测试)",
    })

    return NextResponse.json({ success: true, message: `测试邮件已发送至 ${email}` })
  } catch (error: any) {
    console.error("[v0] Test email error:", error)

    const msg = error.message || ""
    if (msg.includes("API key is invalid")) {
      return NextResponse.json(
        { error: "Resend API Key 无效。请前往 https://resend.com/api-keys 重新生成 API Key，然后在左侧 Vars 面板中更新 RESEND_API_KEY。" },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { error: msg || "发送失败，请检查 Resend API Key 配置" },
      { status: 500 },
    )
  }
}
