export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
import { Database } from "@/lib/database"
import crypto from "crypto"
import { sendCodeMail } from "@/lib/resend"
import { getEnv } from "@/lib/env"
import { ZPayz } from "@/lib/zpayz-client"
import { notifyOrderSuccess, notifyLowStock } from "@/lib/telegram"

async function handle(params: Record<string, string>) {
  console.log("[v0] ============ PAYMENT NOTIFICATION START ============")
  console.log("[v0] Payment notification received:", params)
  console.log("[v0] Payment notification timestamp:", new Date().toISOString())

  try {
    const clientIP = params.client_ip || params.remote_addr

    if (!params.out_trade_no) {
      console.error("[v0] Missing out_trade_no in payment notification")
      return "fail"
    }

    if (!params.sign) {
      console.error("[v0] Missing signature in payment notification")
      return "fail"
    }

    let isValidSignature = false
    let gatewayType = "unknown"

    // Try ZPAYZ signature verification first (if trade_status exists, it's likely ZPAYZ)
    if (params.trade_status) {
      console.log("[v0] Detected ZPAYZ notification format")
      gatewayType = "ZPAYZ"
      isValidSignature = ZPayz.verifySignature(params)
      console.log("[v0] ZPAYZ signature verification:", isValidSignature ? "✅ Valid" : "❌ Invalid")
    } else {
      // Fall back to EPay signature verification
      console.log("[v0] Detected EPay notification format")
      gatewayType = "EPay"

      const { sign, sign_type, ...signParams } = params

      // Filter out empty values as they're typically excluded from signature calculation
      const filteredParams = Object.fromEntries(
        Object.entries(signParams).filter(([key, value]) => value && value.trim() !== ""),
      )

      const signStr =
        Object.keys(filteredParams)
          .sort()
          .map((key) => `${key}=${filteredParams[key]}`)
          .join("&") + getEnv("EPAY_KEY")

      const expectedSign = crypto.createHash("md5").update(signStr).digest("hex")
      isValidSignature = sign === expectedSign

      console.log("[v0] EPay signature verification:", isValidSignature ? "✅ Valid" : "❌ Invalid")
    }

    if (!isValidSignature) {
      console.error("[v0] Invalid signature - payment notification rejected")
      console.error("[v0] Gateway type:", gatewayType)
      return "fail"
    }

    let isPaymentSuccessful = false
    if (gatewayType === "ZPAYZ") {
      isPaymentSuccessful = params.trade_status === "TRADE_SUCCESS"
      console.log("[v0] ZPAYZ trade status:", params.trade_status)
    } else {
      const trade = String(params.trade_status || "").toUpperCase()
      isPaymentSuccessful = trade.includes("SUCCESS")
      console.log("[v0] EPay trade status:", trade)
    }

    if (!isPaymentSuccessful) {
      console.log("[v0] Payment not successful")
      return "fail"
    }

    const orderNo = params.out_trade_no!
    console.log("[v0] Processing payment for order:", orderNo, "via", gatewayType)

    const order = await Database.getOrder(orderNo)
    if (!order) {
      console.error("[v0] Order not found in database:", orderNo)
      return "success" // Don't expose details
    }

    console.log("[v0] Order found:", {
      orderNo: order.out_trade_no,
      email: order.email,
      amount: order.amount,
      currentStatus: order.status,
    })

    if (order.status === "paid") {
      console.log("[v0] Order already paid, skipping processing:", orderNo)
      return "success" // Idempotent
    }

    const orderQuantity = order.quantity || 1
    const orderDeliveryType = order.delivery_type || "auto"
    console.log("[v0] Order delivery type:", orderDeliveryType, "quantity:", orderQuantity)

    // ====== MANUAL DELIVERY: just mark as paid, no code assignment ======
    if (orderDeliveryType === "manual") {
      console.log("[v0] Manual delivery order - marking as paid, awaiting manual fulfillment")
      await Database.updateOrder(orderNo, {
        status: "paid",
        paid_at: new Date(),
        gateway_resp: JSON.stringify(params),
      })

      // Send payment confirmation email (no codes yet)
      try {
        let productName: string | undefined
        if (order.product_id) {
          const product = await Database.getProduct(order.product_id)
          productName = product?.name
        }
        await sendCodeMail({
          to: order.email,
          subject: productName ? `${productName} - 订单已支付` : "订单已支付",
          activationCode: "您的订单已支付成功，我们将尽快为您处理并发货，届时会通过邮件通知您。",
          orderNo,
          productName,
        })
        await Database.updateOrder(orderNo, { email_sent: true, email_sent_at: new Date() })
      } catch (emailError) {
        console.error("[v0] Payment confirmation email failed:", emailError)
      }

      // Send Telegram notification for manual order
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
          productName,
          quantity: orderQuantity,
          paymentMethod: "alipay",
          regionName: order.region_name || undefined,
        })
      } catch (tgError) {
        console.error("[v0] Telegram notification failed:", tgError)
      }

      console.log("[v0] Manual delivery order paid successfully:", orderNo)
      return "success"
    }

    // ====== AUTO DELIVERY: lock and sell codes ======
    // Lock multiple codes for multi-quantity orders
    let lockedCodes: any[] = []
    if (order.product_id) {
      lockedCodes = await Database.lockMultipleCodesByProduct(orderNo, order.product_id, orderQuantity)
    } else {
      // Fallback: lock one by one for non-product orders
      for (let i = 0; i < orderQuantity; i++) {
        const locked = await Database.lockCode(orderNo)
        if (locked) lockedCodes.push(locked)
      }
    }

    if (lockedCodes.length === 0) {
      console.error("[v0] No activation codes available for order:", orderNo)
      await Database.updateOrder(orderNo, {
        status: "failed",
        gateway_resp: "No stock available",
      })
      return "success"
    }

    if (lockedCodes.length < orderQuantity) {
      console.warn("[v0] Partial stock: locked", lockedCodes.length, "of", orderQuantity, "codes")
    }

    console.log("[v0] Codes locked successfully:", lockedCodes.length, "codes for order:", orderNo)

    // Sell all locked codes
    const soldCodes = await Database.sellMultipleCodes(orderNo)
    if (soldCodes.length === 0) {
      console.error("[v0] Failed to sell locked codes for order:", orderNo)
      await Database.releaseLockedCode(orderNo)
      return "success"
    }

    const allCodes = soldCodes.map(c => c.code)
    const codesText = allCodes.join("\n")

    console.log("[v0] Codes sold successfully:", allCodes.length, "codes for order:", orderNo)

    const updateResult = await Database.updateOrder(orderNo, {
      status: "paid",
      code: codesText,
      paid_at: new Date(),
      fulfilled_at: new Date(),
      gateway_resp: JSON.stringify(params),
    })

    console.log("[v0] Order updated successfully:", {
      orderNo,
      newStatus: "paid",
      codesCount: allCodes.length,
      updateResult: !!updateResult,
    })

    try {
      console.log("[v0] Attempting to send email to:", order.email)
      let productName: string | undefined
      if (order.product_id) {
        const product = await Database.getProduct(order.product_id)
        productName = product?.name
      }
      const qtyLabel = orderQuantity > 1 ? ` x${orderQuantity}` : ""
      await sendCodeMail({
        to: order.email,
        subject: productName ? `${productName}${qtyLabel} - 激活码已到账` : `激活码${qtyLabel}已到账`,
        activationCode: codesText,
        orderNo,
        productName,
      })

      console.log("[v0] Email sent successfully to:", order.email)

      await Database.updateOrder(orderNo, {
        email_sent: true,
        email_sent_at: new Date(),
      })
    } catch (emailError) {
      console.error("[v0] Email sending failed:", {
        error: emailError,
        orderNo,
        email: order.email,
        errorMessage: emailError instanceof Error ? emailError.message : "Unknown email error",
      })

      await Database.updateOrder(orderNo, {
        email_failed: true,
        email_error: emailError instanceof Error ? emailError.message : "Unknown email error",
      })
    }

    // Send Telegram notification for auto delivery order
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
        productName,
        quantity: orderQuantity,
        paymentMethod: "alipay",
        codes: allCodes,
        regionName: order.region_name || undefined,
      })

      // Check stock and send low stock alert if needed
      if (order.product_id) {
        const remaining = await Database.getAvailableCodeCount(order.product_id)
        if (remaining <= 10) {
          await notifyLowStock({
            productId: order.product_id,
            productName,
            remaining,
            threshold: 10,
          })
        }
      }
    } catch (tgError) {
      console.error("[v0] Telegram notification failed:", tgError)
    }

    console.log("[v0] ============ PAYMENT NOTIFICATION END ============")
    console.log("[v0] Payment processed successfully for order:", orderNo, "via", gatewayType)
    return "success"
  } catch (error: any) {
    console.error("[v0] ============ PAYMENT NOTIFICATION ERROR ============")
    console.error("[v0] Payment notification error:", {
      error,
      message: error?.message,
      stack: error?.stack,
      params,
    })
    return "success" // Return success to avoid infinite retries
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url)
  const params = Object.fromEntries(u.searchParams.entries())
  const result = await handle(params)
  return new Response(result, { headers: { "Content-Type": "text/plain" } })
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || ""
  let params: Record<string, string> = {}

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData()
    params = Object.fromEntries(form as any)
  } else if (contentType.includes("application/json")) {
    params = await req.json()
  } else {
    const form = await req.formData()
    params = Object.fromEntries(form as any)
  }

  const result = await handle(params)
  return new Response(result, { headers: { "Content-Type": "text/plain" } })
}
