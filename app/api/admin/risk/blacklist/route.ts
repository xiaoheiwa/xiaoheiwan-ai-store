import { NextResponse } from "next/server"
import { getBlacklist, addToBlacklist, removeFromBlacklist } from "@/lib/risk-control"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getBlacklist()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Failed to get blacklist:", error)
    return NextResponse.json({ error: "获取黑名单失败" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { type, value, reason, expiresAt } = await req.json()
    if (!type || !value || !reason) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }
    await addToBlacklist(type, value, reason, "admin", expiresAt ? new Date(expiresAt) : undefined)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to add to blacklist:", error)
    return NextResponse.json({ error: "添加黑名单失败" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { type, value } = await req.json()
    if (!type || !value) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }
    await removeFromBlacklist(type, value)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to remove from blacklist:", error)
    return NextResponse.json({ error: "移除黑名单失败" }, { status: 500 })
  }
}
