import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export const runtime = "nodejs"
// 库存数据缓存 30 秒，平衡实时性和性能
export const revalidate = 30

export async function GET() {
  try {
    console.log("[v0] Stock API called")
    const count = await Database.getAvailableCodesCount()
    console.log("[v0] Stock count:", count)
    return NextResponse.json({ count })
  } catch (error) {
    console.error("[v0] Stock API error:", error)
    console.log("[v0] Returning fallback stock count: 0")
    return NextResponse.json({ count: 0 })
  }
}
