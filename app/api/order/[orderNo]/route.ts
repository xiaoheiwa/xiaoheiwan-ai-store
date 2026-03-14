import crypto from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderNo: string }> }) {
  try {
    const { orderNo } = await params

    if (!orderNo || orderNo === "undefined" || orderNo.trim() === "") {
      return NextResponse.json({ error: "订单号不能为空" }, { status: 400 })
    }

    const trimmedOrderNo = orderNo.trim()
    const order = await Database.getOrder(trimmedOrderNo)

    if (!order) {
      return NextResponse.json({ error: "订单不存在，请检查订单号是否正确" }, { status: 404 })
    }

    // Check query password
    const url = new URL(request.url)
    const queryPassword = url.searchParams.get("pwd") || ""

    const hasPassword = !!order.query_password_hash

    if (hasPassword) {
      if (!queryPassword) {
        // Return basic info without sensitive data, signal that password is required
        return NextResponse.json({
          orderNo: order.out_trade_no,
          email: maskEmail(order.email),
          amount: Number(order.amount),
          status: order.status,
          createdAt: order.created_at,
          requirePassword: true,
        }, {
          headers: { "Cache-Control": "no-store" },
        })
      }

      // Verify password
      const inputHash = crypto.createHash("sha256").update(queryPassword).digest("hex")
      if (inputHash !== order.query_password_hash) {
        return NextResponse.json({ error: "查询密码错误", requirePassword: true }, { status: 403 })
      }
    }

    // Password verified or no password set - return full order details
    return NextResponse.json({
      orderNo: order.out_trade_no,
      email: order.email,
      amount: Number(order.amount),
      status: order.status,
      activationCode: order.code,
      createdAt: order.created_at,
      payType: order.pay_channel || "alipay",
      paid_at: order.paid_at,
      fulfilled_at: order.fulfilled_at,
      productId: order.product_id || null,
      productName: order.subject || null,
      delivery_type: order.delivery_type || "auto",
      quantity: order.quantity || 1,
      requirePassword: false,
    }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("[v0] Error fetching order:", error)
    return NextResponse.json({ error: "获取订单失败" }, { status: 500 })
  }
}

function maskEmail(email: string): string {
  if (!email) return ""
  const [local, domain] = email.split("@")
  if (!domain) return "***"
  const masked = local.length <= 2
    ? "*".repeat(local.length)
    : local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
  return `${masked}@${domain}`
}
