import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const { orderNo } = await params

    if (!orderNo) {
      return NextResponse.json({ error: "订单号不能为空" }, { status: 400 })
    }

    const orders = await sql`
      SELECT status FROM orders WHERE out_trade_no = ${orderNo}
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }

    return NextResponse.json({ status: orders[0].status })
  } catch (error) {
    console.error("[v0] Check order status error:", error)
    return NextResponse.json({ error: "查询失败" }, { status: 500 })
  }
}
