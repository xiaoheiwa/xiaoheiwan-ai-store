import { type NextRequest, NextResponse } from "next/server"
import { ChongzhiProApiClient } from "@/lib/chongzhi-api-client"
import { mapError } from "@/lib/error-mappings"

export async function POST(request: NextRequest) {
  try {
    const { json_token, session, activation_code } = await request.json()

    if (!json_token) {
      return NextResponse.json({ success: false, error: "请粘贴JSON Token" })
    }

    if (!session || !activation_code) {
      return NextResponse.json({ success: false, error: "会话失效，请重新验证激活码" })
    }

    const client = new ChongzhiProApiClient()
    const result = await client.updateTokenAndRecharge(session, activation_code, json_token)

    if (!result.success) {
      const mappedError = mapError(result.error || "更新Token失败")
      return NextResponse.json({ success: false, error: mappedError })
    }

    return NextResponse.json({
      success: true,
      message: result.message || "更新Token成功",
      data: result.data,
    })
  } catch (error) {
    const mappedError = mapError("服务器错误：" + (error as Error).message)
    return NextResponse.json({
      success: false,
      error: mappedError,
    })
  }
}
