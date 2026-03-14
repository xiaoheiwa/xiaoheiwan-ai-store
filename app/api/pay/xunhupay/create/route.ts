import { type NextRequest, NextResponse } from "next/server"
import { xunhupay } from "@/lib/xunhupay-client"
import { createOrder } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { email, quantity = 1 } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const orderNo = `XH${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    const price = 99.0 // Get from your price API
    const totalAmount = price * quantity

    await createOrder({
      orderNo,
      email,
      amount: totalAmount,
      quantity,
      status: "pending",
    })

    const payment = await xunhupay.createPayment({
      order_id: orderNo,
      money: totalAmount,
      title: `ChatGPT Plus激活码 x${quantity}`,
      backendUrl: process.env.SITE_BASE || "https://upgrade.xiaoheiwan.com",
    })

    return NextResponse.json({
      success: true,
      paymentUrl: payment.paymentUrl,
      orderNo: payment.orderNo,
    })
  } catch (error) {
    console.error("Xunhupay payment creation error:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
