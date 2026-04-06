import { type NextRequest, NextResponse } from "next/server"
import { xunhupay } from "@/lib/xunhupay-client"
import { Database, updateOrder, getOrder } from "@/lib/database"
import { sendCodeMail } from "@/lib/resend"
import { notifyPaymentSuccess } from "@/lib/telegram-bot"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Xunhupay payment notification received")

    const formData = await request.formData()
    const data: Record<string, any> = {}

    for (const [key, value] of formData.entries()) {
      data[key] = value.toString()
    }

    console.log("[v0] Callback data:", data)

    if (!xunhupay.verifySignature(data)) {
      console.log("[v0] Signature verification failed")
      return new NextResponse("success", { status: 200 })
    }

    console.log("[v0] Signature verified")

    if (xunhupay.isPaymentSuccessful(data)) {
      console.log("[v0] Payment successful, processing order")

      const orderNo = data.trade_order_id

      try {
        // Fetch order first to get product_id
        const order = await getOrder(orderNo)
        if (!order) {
          console.error("[v0] Order not found:", orderNo)
          return new NextResponse("success", { status: 200 })
        }

        if (order.status === "paid") {
          console.log("[v0] Order already paid, skipping:", orderNo)
          return new NextResponse("success", { status: 200 })
        }

        // Lock code based on product_id
        const lockedCode = order.product_id
          ? await Database.lockCodeByProduct(orderNo, order.product_id)
          : await Database.lockCode(orderNo)

        if (!lockedCode) {
          console.log("[v0] No activation codes available")
          await updateOrder(orderNo, { status: "failed", gateway_resp: "No stock available" })
          return new NextResponse("success", { status: 200 })
        }

        const soldCode = await Database.sellCode(orderNo)
        if (!soldCode) {
          console.error("[v0] Failed to sell locked code for order:", orderNo)
          await Database.releaseLockedCode(orderNo)
          return new NextResponse("success", { status: 200 })
        }

        await updateOrder(orderNo, {
          status: "paid",
          code: soldCode.code,
          paid_at: new Date(),
          fulfilled_at: new Date(),
          gateway_resp: JSON.stringify(data),
        })

        // Send email notification
        if (order.email) {
          try {
            let productName: string | undefined
            if (order.product_id) {
              const product = await Database.getProduct(order.product_id)
              productName = product?.name
            }
            await sendCodeMail({
              to: order.email,
              subject: productName ? `${productName} - 激活码已到账` : "您的激活码已到账",
              activationCode: soldCode.code,
              orderNo,
              productName,
            })
            console.log("[v0] Activation code sent to:", order.email)
          } catch (emailError) {
            console.error("[v0] Email sending failed:", emailError)
          }
        }

        // Send Telegram notification (if user linked telegram)
        if (order.telegram_chat_id) {
          try {
            let productName: string | undefined
            if (order.product_id) {
              const product = await Database.getProduct(order.product_id)
              productName = product?.name
            }
            await notifyPaymentSuccess(order.telegram_chat_id, {
              orderNo,
              productName: productName || "产品",
              code: soldCode.code,
              amount: order.amount,
            })
            console.log("[v0] Telegram notification sent to:", order.telegram_chat_id)
          } catch (tgError) {
            console.error("[v0] Telegram notification failed:", tgError)
          }
        }

        console.log("[v0] Order processed successfully")
      } catch (error) {
        console.error("[v0] Order processing error:", error)
      }
    } else {
      console.log("[v0] Payment not successful, status:", data.status)
    }

    return new NextResponse("success", { status: 200 })
  } catch (error) {
    console.error("[v0] Xunhupay callback error:", error)
    return new NextResponse("success", { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Xunhupay notification endpoint is working" })
}
