import { NextResponse } from "next/server"
import { getGlobalOrderByEmail } from "@/lib/global-orders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function publicOrder(order: NonNullable<Awaited<ReturnType<typeof getGlobalOrderByEmail>>>) {
  const delivered = order.delivery_status === "delivered"

  return {
    orderNo: order.out_trade_no,
    email: order.email,
    product: order.product_title_snapshot || order.subject,
    paymentStatus: order.payment_status,
    deliveryStatus: order.delivery_status,
    token: order.token || "USDT",
    paymentNetwork: order.payment_network,
    expectedAmount: order.expected_amount,
    receivedAmount: order.received_amount,
    txHash: order.tx_hash,
    confirmations: order.confirmations,
    paymentAddress: order.payment_address,
    paymentUrl: order.payment_url,
    paidAt: order.paid_at,
    fulfilledAt: order.fulfilled_at,
    manualReviewReason: order.manual_review_reason,
    deliveryInfo: delivered ? order.code : null,
    createdAt: order.created_at,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email || "").trim().toLowerCase()
    const orderNo = String(body.orderNo || "").trim()

    if (!email || !orderNo) {
      return NextResponse.json({ error: "Email and Order ID are required." }, { status: 400 })
    }

    const order = await getGlobalOrderByEmail(orderNo, email)
    if (!order) {
      return NextResponse.json({ error: "Order not found. Please check your email and Order ID." }, { status: 404 })
    }

    return NextResponse.json({ order: publicOrder(order) }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[GlobalOrder] Track failed:", error)
    return NextResponse.json({ error: "Failed to track order." }, { status: 500 })
  }
}
