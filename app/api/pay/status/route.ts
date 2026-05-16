import { NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET(req: NextRequest) {
  const orderNo = req.nextUrl.searchParams.get("orderNo")
  
  if (!orderNo) {
    return NextResponse.json({ error: "缺少订单号" }, { status: 400 })
  }
  
  try {
    const order = await Database.getOrder(orderNo)
    
    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }
    
    return NextResponse.json({
      status: order.status,
      paid: order.status === "paid",
    })
  } catch (error) {
    console.error("[v0] Check payment status error:", error)
    return NextResponse.json({ error: "查询失败" }, { status: 500 })
  }
}
