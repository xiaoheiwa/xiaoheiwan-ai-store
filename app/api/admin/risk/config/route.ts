import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getAllRiskConfig, updateRiskConfig } from "@/lib/risk-control"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const data = await getAllRiskConfig()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Failed to get risk config:", error)
    return NextResponse.json({ error: "获取风控配置失败" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { key, value } = await req.json()
    if (!key || value === undefined) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }
    await updateRiskConfig(key, value)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update risk config:", error)
    return NextResponse.json({ error: "更新风控配置失败" }, { status: 500 })
  }
}
