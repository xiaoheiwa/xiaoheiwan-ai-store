import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {

    const price = await db.getGlobalPrice()

    return NextResponse.json({ price })
  } catch (error) {
    console.error("获取价格失败:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {

    const { price } = await request.json()

    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json({ error: "无效的价格" }, { status: 400 })
    }

    await db.setGlobalPrice(price)

    return NextResponse.json({
      success: true,
      message: "价格更新成功",
    })
  } catch (error) {
    console.error("更新价格失败:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
