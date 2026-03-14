import { type NextRequest, NextResponse } from "next/server"
import { ChongzhiProApiClient } from "@/lib/chongzhi-api-client"
import { mapError } from "@/lib/error-mappings"

export async function POST(request: NextRequest) {
  try {
    const { json_token, session } = await request.json()

    if (!json_token) {
      return NextResponse.json({ success: false, error: "请粘贴JSON Token" })
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "会话失效，请重新验证激活码" })
    }

    const client = new ChongzhiProApiClient()
    const result = await client.submitRecharge(session, json_token)

    if (!result.success) {
      const mappedError = mapError(result.error || "充值失败")
      return NextResponse.json({ success: false, error: mappedError })
    }

    return NextResponse.json({
      success: true,
      message: result.message || "充值成功",
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
