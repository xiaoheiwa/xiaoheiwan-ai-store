import { type NextRequest, NextResponse } from "next/server"
import { sendCodeMail } from "@/lib/resend"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { orderNo, codes, unitCost, supplier, costNotes } = await request.json()

    if (!orderNo) {
      return NextResponse.json({ error: "订单号不能为空" }, { status: 400 })
    }
    if (!codes || (typeof codes === "string" && !codes.trim())) {
      return NextResponse.json({ error: "激活码/账号信息不能为空" }, { status: 400 })
    }

    // Get order info
    const orderResult = await sql`
      SELECT o.*, p.name as product_name
      FROM orders o LEFT JOIN products p ON o.product_id = p.id
      WHERE o.out_trade_no = ${orderNo}
    `
    if (orderResult.length === 0) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }

    const order = orderResult[0]

    if (order.status !== "paid") {
      return NextResponse.json({ error: "订单未支付，无法发货" }, { status: 400 })
    }

    if (order.fulfilled_at) {
      return NextResponse.json({ error: "订单已发货，请勿重复操作" }, { status: 409 })
    }

    // The codes string can be activation codes, account info, etc.
    const codesText = typeof codes === "string" ? codes.trim() : String(codes)
    const orderQuantity = order.quantity || 1

    // Record cost to purchase_batches if unitCost is provided
    if (unitCost && Number(unitCost) > 0) {
      const totalCost = Number(unitCost) * orderQuantity
      await sql`
        INSERT INTO purchase_batches (batch_name, product_id, unit_cost, quantity, total_cost, supplier, notes, created_at)
        VALUES (
          ${`手动发货-${orderNo}`},
          ${order.product_id || null},
          ${Number(unitCost)},
          ${orderQuantity},
          ${totalCost},
          ${supplier || null},
          ${costNotes || `手动发货订单 ${orderNo}`},
          NOW()
        )
      `
    }

    // Send fulfillment email
    const productName = order.product_name || order.subject || ""
    await sendCodeMail({
      to: order.email,
      subject: productName ? `${productName} - 已发货` : "您的订单已发货",
      activationCode: codesText,
      orderNo,
      productName,
    })

    // Update order with code and fulfilled timestamp
    await sql`
      UPDATE orders 
      SET code = ${codesText}, 
          fulfilled_at = NOW(), 
          email_sent = true,
          email_sent_at = NOW(),
          updated_at = NOW()
      WHERE out_trade_no = ${orderNo}
    `

    return NextResponse.json({
      success: true,
      message: `订单 ${orderNo} 已发货，激活码/账号已发送至 ${order.email}`,
    })
  } catch (error) {
    console.error("[v0] Fulfill order error:", error)
    return NextResponse.json(
      { error: "发货失败: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
