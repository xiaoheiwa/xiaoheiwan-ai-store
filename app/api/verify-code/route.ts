import { type NextRequest, NextResponse } from "next/server"
import { ChongzhiProApiClient } from "@/lib/chongzhi-api-client"
import { mapError } from "@/lib/error-mappings"

export async function POST(request: NextRequest) {
  try {
    const { activation_code } = await request.json()

    if (!activation_code) {
      return NextResponse.json({ success: false, error: "请输入激活码" })
    }

    // Only check for basic requirements: not empty and reasonable length
    if (activation_code.length < 3 || activation_code.length > 50) {
      return NextResponse.json({ success: false, error: "激活码长度不正确" })
    }

    const client = new ChongzhiProApiClient()
    const session = await client.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "无法获取会话，请稍后重试" })
    }

    const verify = await client.verifyActivationCode(session, activation_code)

    if (!verify.success) {
      const mappedError = mapError(verify.error || "验证失败")
      return NextResponse.json({ success: false, error: mappedError })
    }

    const data = verify.data || {}
    const status = data.code_status || ""
    const email = data.existing_record?.bound_email_masked || ""
    const hasExisting = !!data.existing_record

    // Store session data in response headers for client-side storage
    const response = NextResponse.json({
      success: true,
      status,
      is_new: !hasExisting,
      email,
      session, // Include session for client storage
      activation_code, // Include code for later use
    })

    return response
  } catch (error) {
    const mappedError = mapError("服务器错误：" + (error as Error).message)
    return NextResponse.json({
      success: false,
      error: mappedError,
    })
  }
}
