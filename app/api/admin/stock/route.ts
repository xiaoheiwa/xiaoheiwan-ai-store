import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {

    const count = await db.getAvailableCodesCount()

    return NextResponse.json({ count })
  } catch (error) {
    console.error("获取库存失败:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
