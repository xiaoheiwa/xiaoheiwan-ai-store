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
    
    // 计算过期时间（创建后30分钟）
    const createdAt = new Date(order.created_at)
    const expiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000)
    
    // 检查是否过期
    if (order.status === "pending" && Date.now() > expiresAt.getTime()) {
      return NextResponse.json({ 
        error: "订单已过期",
        status: "expired"
      }, { status: 400 })
    }
    
    // 返回支付信息（不返回敏感数据）
    return NextResponse.json({
      orderNo: order.out_trade_no,
      email: order.email,
      amount: Number(order.amount),
      subject: order.subject,
      status: order.status,
      qrcode: order.qrcode || null,
      paymentUrl: order.payment_url || null,
      createdAt: order.created_at,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("[v0] Get payment info error:", error)
    return NextResponse.json({ error: "获取订单失败" }, { status: 500 })
  }
}
