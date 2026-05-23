import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { sql } from "@/lib/db"
import { completePaidOrder } from "@/lib/order-payment-completion"
import { sendGlobalDeliveryMail } from "@/lib/resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function getOrder(orderNo: string) {
  const result = await sql`
    SELECT o.*, p.name as product_name
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.out_trade_no = ${orderNo}
    LIMIT 1
  `
  return result[0] || null
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { orderNo, action, reason } = await request.json()
    if (!orderNo || !action) {
      return NextResponse.json({ error: "缺少订单号或操作类型" }, { status: 400 })
    }

    const order = await getOrder(orderNo)
    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }

    const isGlobalOrder = String(order.market || "CN").toUpperCase() === "GLOBAL"
    if (!isGlobalOrder) {
      return NextResponse.json({ error: "该操作只用于全球站订单" }, { status: 400 })
    }

    if (action === "retry_delivery") {
      if (order.status !== "paid") {
        return NextResponse.json({ error: "订单未支付，不能重试发货" }, { status: 400 })
      }
      const result = await completePaidOrder({
        orderNo,
        paymentMethod: "usdt",
        gatewayResp: order.gateway_resp || { admin_action: "retry_delivery" },
        cryptoStatus: order.crypto_status || "admin_retry",
        allowDeliveryRetry: true,
      })
      return NextResponse.json({
        success: Boolean(result.ok),
        message: result.ok ? "已重试自动发货，请刷新订单查看结果" : "重试发货失败，请人工处理",
        result,
      })
    }

    if (action === "resend_email") {
      if (!order.email) {
        return NextResponse.json({ error: "订单没有邮箱，无法重发" }, { status: 400 })
      }
      if (!order.code) {
        return NextResponse.json({ error: "订单没有交付内容，无法重发" }, { status: 400 })
      }

      const productName = order.product_title_snapshot || order.product_name || order.subject || "Digital product"
      await sendGlobalDeliveryMail({
        to: order.email,
        orderNo,
        productName,
        paymentNetwork: order.payment_network || "USDT",
        deliveryInfo: order.code,
        usageGuide: order.product_description_snapshot || null,
      })
      await sql`
        UPDATE orders
        SET email_sent = 1,
            email_sent_at = CURRENT_TIMESTAMP,
            delivery_status = 'delivered',
            manual_review_reason = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE out_trade_no = ${orderNo}
      `

      return NextResponse.json({ success: true, message: "英文发货邮件已重发" })
    }

    if (action === "mark_manual_review") {
      await sql`
        UPDATE orders
        SET delivery_status = 'manual_review',
            manual_review_reason = ${reason || "Admin marked this global order for manual review."},
            updated_at = CURRENT_TIMESTAMP
        WHERE out_trade_no = ${orderNo}
      `
      return NextResponse.json({ success: true, message: "已标记为人工审核" })
    }

    if (action === "mark_failed") {
      await sql`
        UPDATE orders
        SET status = 'failed',
            payment_status = CASE WHEN payment_status = 'paid' THEN payment_status ELSE 'failed' END,
            delivery_status = 'delivery_failed',
            manual_review_reason = ${reason || "Admin marked this global order as failed."},
            updated_at = CURRENT_TIMESTAMP
        WHERE out_trade_no = ${orderNo}
      `
      return NextResponse.json({ success: true, message: "已标记为失败" })
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 })
  } catch (error) {
    console.error("[AdminGlobalOrderAction] Failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "操作失败" },
      { status: 500 },
    )
  }
}
