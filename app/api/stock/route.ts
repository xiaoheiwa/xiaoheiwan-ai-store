import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

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
