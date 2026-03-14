import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAdminRequest } from "@/lib/admin-auth"
import { notifyOrderSuccess, notifyLowStock } from "@/lib/telegram"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orderNo } = await request.json()

    if (!orderNo) {
      return NextResponse.json({ error: "订单号不能为空" }, { status: 400 })
    }

    // Get order details
    const orders = await sql`
      SELECT * FROM orders WHERE out_trade_no = ${orderNo}
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }

    const order = orders[0]

    if (order.payment_method !== "usdt") {
      return NextResponse.json({ error: "该订单不是USDT支付" }, { status: 400 })
    }

    if (order.status === "paid") {
      return NextResponse.json({ error: "订单已支付" }, { status: 400 })
    }

    // Update order status to paid
    await sql`
      UPDATE orders 
      SET status = 'paid', 
          crypto_status = 'verified',
          paid_at = NOW()
      WHERE out_trade_no = ${orderNo}
    `

    // Auto fulfill based on delivery type
    if (order.delivery_type === "manual") {
      // Manual delivery - admin will fulfill manually
      return NextResponse.json({ 
        success: true, 
        message: "USDT支付已验证，请手动发货" 
      })
    } else {
      // Auto delivery - assign activation code
      const quantity = order.quantity || 1
      
      // Get available codes for this product
      const availableCodes = await sql`
        SELECT id, code FROM activation_codes 
        WHERE status = 'available' 
        AND (product_id = ${order.product_id} OR product_id IS NULL)
        ORDER BY product_id DESC NULLS LAST, created_at ASC
        LIMIT ${quantity}
      `

      if (availableCodes.length < quantity) {
        return NextResponse.json({ 
          success: true, 
          message: `USDT支付已验证，但库存不足（需要${quantity}个，仅有${availableCodes.length}个）。请手动处理。` 
        })
      }

      const codeIds = availableCodes.map((c: any) => c.id)
      const codes = availableCodes.map((c: any) => c.code)

      // Mark codes as sold
      await sql`
        UPDATE activation_codes 
        SET status = 'sold', 
            sold_at = NOW(), 
            sold_to = ${order.email}
        WHERE id = ANY(${codeIds})
      `

      // Update order with codes
      const codeStr = codes.join(", ")
      await sql`
        UPDATE orders 
        SET code = ${codeStr}
        WHERE out_trade_no = ${orderNo}
      `

      // Send email notification if email exists
      if (order.email && process.env.RESEND_API_KEY) {
        try {
          const { Resend } = await import("resend")
          const resend = new Resend(process.env.RESEND_API_KEY)
          
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: order.email,
            subject: `您的订单 ${orderNo} 已完成`,
            html: `
              <h2>感谢您的购买！</h2>
              <p>您的USDT支付已确认，订单已完成。</p>
              <p><strong>订单号：</strong>${orderNo}</p>
              <p><strong>产品：</strong>${order.product_name || order.subject}</p>
              <p><strong>激活码：</strong></p>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px;">${codeStr}</pre>
              <p>如有任何问题，请联系客服。</p>
            `,
          })
        } catch (emailError) {
          console.error("Failed to send email:", emailError)
        }
      }

      // Send Telegram notification
      try {
        await notifyOrderSuccess({
          orderNo,
          email: order.email,
          amount: Number(order.amount),
          productName: order.product_name || order.subject,
          quantity,
          paymentMethod: "usdt",
          codes,
        })

        // Check stock
        if (order.product_id) {
          const stockResult = await sql`
            SELECT COUNT(*) as count FROM activation_codes 
            WHERE status = 'available' 
            AND (product_id = ${order.product_id} OR product_id IS NULL)
          `
          const remaining = Number(stockResult[0]?.count || 0)
          if (remaining <= 10) {
            await notifyLowStock({
              productId: order.product_id,
              productName: order.product_name,
              remaining,
              threshold: 10,
            })
          }
        }
      } catch (tgError) {
        console.error("Telegram notification failed:", tgError)
      }

      return NextResponse.json({ 
        success: true, 
        message: `USDT支付已验证，已自动发送${quantity}个激活码` 
      })
    }
  } catch (error) {
    console.error("Crypto verify error:", error)
    return NextResponse.json({ error: "验证失败" }, { status: 500 })
  }
}
