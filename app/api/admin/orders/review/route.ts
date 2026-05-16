import { NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { sendCodeMail } from "@/lib/resend"
import { notifyOrderSuccess } from "@/lib/telegram"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// 获取待审核订单列表
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const adminToken = searchParams.get("token")
  
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const orders = await Database.query(`
      SELECT o.*, p.name as product_name 
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.is_high_risk = true AND o.review_status = 'pending_review'
      ORDER BY o.paid_at DESC
      LIMIT 50
    `)
    
    return NextResponse.json({ ok: true, orders })
  } catch (error) {
    console.error("[v0] Error fetching pending orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

// 处理审核操作
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const adminToken = searchParams.get("token")
  
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { orderNo, action } = await req.json()
    
    if (!orderNo || !action) {
      return NextResponse.json({ error: "Missing orderNo or action" }, { status: 400 })
    }
    
    const order = await Database.getOrder(orderNo)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    
    if (order.review_status !== "pending_review") {
      return NextResponse.json({ error: "Order already processed" }, { status: 400 })
    }
    
    if (action === "approve") {
      // 批准发货 - 执行自动发货流程
      const orderQuantity = order.quantity || 1
      
      // Lock codes
      let lockedCodes: any[] = []
      if (order.product_id) {
        lockedCodes = await Database.lockMultipleCodesByProduct(orderNo, order.product_id, orderQuantity)
      } else {
        for (let i = 0; i < orderQuantity; i++) {
          const locked = await Database.lockCode(orderNo)
          if (locked) lockedCodes.push(locked)
        }
      }
      
      if (lockedCodes.length === 0) {
        return NextResponse.json({ error: "No stock available" }, { status: 400 })
      }
      
      // Sell codes
      const codeStrings: string[] = []
      for (const code of lockedCodes) {
        await Database.sellCode(code.id, orderNo)
        codeStrings.push(code.code)
      }
      
      // Update order
      await Database.updateOrder(orderNo, {
        code: codeStrings.join("\n"),
        fulfilled_at: new Date(),
        review_status: "approved",
        reviewed_at: new Date(),
        reviewed_by: "admin",
      })
      
      // Send email
      try {
        let productName: string | undefined
        if (order.product_id) {
          const product = await Database.getProduct(order.product_id)
          productName = product?.name
        }
        await sendCodeMail({
          to: order.email,
          subject: productName ? `${productName} - 激活码` : "您的激活码",
          activationCode: codeStrings.join("\n"),
          orderNo,
          productName,
        })
        await Database.updateOrder(orderNo, { email_sent: true, email_sent_at: new Date() })
      } catch (emailError) {
        console.error("[v0] Email failed:", emailError)
      }
      
      // Send Telegram notification
      try {
        let productName: string | undefined
        if (order.product_id) {
          const product = await Database.getProduct(order.product_id)
          productName = product?.name
        }
        await notifyOrderSuccess({
          orderNo,
          email: order.email,
          amount: Number(order.amount),
          productName: `[审核通过] ${productName || "商品"}`,
          quantity: orderQuantity,
          paymentMethod: "alipay",
          codes: codeStrings,
        })
      } catch (tgError) {
        console.error("[v0] Telegram notification failed:", tgError)
      }
      
      return NextResponse.json({ ok: true, message: "Order approved and delivered", codes: codeStrings })
      
    } else if (action === "reject") {
      // 拒绝 - 标记为需要退款
      await Database.updateOrder(orderNo, {
        review_status: "rejected",
        reviewed_at: new Date(),
        reviewed_by: "admin",
        status: "refunded", // 标记为已退款（需要手动在支付平台退款）
      })
      
      // 发送邮件通知用户
      try {
        await sendCodeMail({
          to: order.email,
          subject: "订单退款通知",
          activationCode: `您的订单 ${orderNo} 因安全原因已被取消，款项将原路退回。如有疑问请联系客服。`,
          orderNo,
        })
      } catch (emailError) {
        console.error("[v0] Refund email failed:", emailError)
      }
      
      return NextResponse.json({ ok: true, message: "Order rejected, please refund manually in payment platform" })
      
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
    
  } catch (error) {
    console.error("[v0] Error processing review:", error)
    return NextResponse.json({ error: "Failed to process review" }, { status: 500 })
  }
}
