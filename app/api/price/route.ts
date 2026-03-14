import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    console.log("[v0] Price API called")
    const price = await Database.getGlobalPrice()
    console.log("[v0] Current price:", price)
    return NextResponse.json({ price })
  } catch (error) {
    console.error("[v0] Price API error:", error)
    console.log("[v0] Returning fallback price: 99")
    return NextResponse.json({ price: 99 })
  }
}
