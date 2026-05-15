import { NextResponse } from "next/server"
import { getRiskLogs } from "@/lib/risk-control"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getRiskLogs(100)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Failed to get risk logs:", error)
    return NextResponse.json({ error: "获取风控日志失败" }, { status: 500 })
  }
}
