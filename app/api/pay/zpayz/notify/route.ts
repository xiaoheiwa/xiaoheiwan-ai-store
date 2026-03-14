import type { NextRequest } from "next/server"
import { ZPayz } from "@/lib/zpayz-client"
import { Database, updateOrder, getOrder } from "@/lib/database"
import { sendCodeMail as sendActivationCodeEmail } from "@/lib/resend"

async function processZpayzNotification(params: Record<string, string>) {
  console.log("[v0] ZPAYZ notification params:", JSON.stringify(params, null, 2))

  if (!params.sign) {
    console.log("[v0] No signature found in params")
    return new Response("fail", { status: 400 })
  }

  const isValidSignature = ZPayz.verifySignature(params)
  console.log("[v0] ZPAYZ signature verification:", isValidSignature ? "Valid" : "Invalid")

  if (!isValidSignature) {
    console.log("[v0] Invalid signature - ZPAYZ notification rejected")
    return new Response("fail", { status: 400 })
  }

  if (params.trade_status !== "TRADE_SUCCESS") {
    console.log("[v0] Payment not successful, status:", params.trade_status)
    return new Response("success", { status: 200 })
  }

  const orderNo = params.out_trade_no
  const tradeNo = params.trade_no
  const amount = Number.parseFloat(params.money)

  console.log("[v0] Processing successful ZPAYZ payment:", { orderNo, tradeNo, amount })

  try {
    // Fetch order first to get product_id and check idempotency
    const order = await getOrder(orderNo)
    if (!order) {
      console.error("[v0] Order not found:", orderNo)
      return new Response("success", { status: 200 })
    }

    if (order.status === "paid") {
      console.log("[v0] Order already paid, skipping:", orderNo)
      return new Response("success", { status: 200 })
    }

    // Lock code based on product_id
    console.log("[v0] Attempting to allocate activation code for product:", order.product_id || "global")
    const lockedCode = order.product_id
      ? await Database.lockCodeByProduct(orderNo, order.product_id)
      : await Database.lockCode(orderNo)

    if (!lockedCode) {
      console.log("[v0] No activation codes available")
      await updateOrder(orderNo, { status: "failed", gateway_resp: "No stock available" })
      return new Response("success", { status: 200 })
    }

    const soldCode = await Database.sellCode(orderNo)
    if (!soldCode) {
      console.error("[v0] Failed to sell locked code for order:", orderNo)
      await Database.releaseLockedCode(orderNo)
      return new Response("success", { status: 200 })
    }

    console.log("[v0] Activation code allocated successfully")

    console.log("[v0] Attempting to update order:", orderNo)
    await updateOrder(orderNo, {
      status: "paid",
      trade_no: tradeNo,
      code: soldCode.code,
      paid_at: new Date().toISOString(),
      fulfilled_at: new Date().toISOString(),
      gateway_resp: JSON.stringify(params),
    })
    console.log("[v0] Order updated successfully to paid status")

    // Send email - prefer order.email, fallback to params.param
    const recipientEmail = order.email || (params.param && params.param.includes("@") ? params.param : null)
    if (recipientEmail) {
      try {
        let productName: string | undefined
        if (order.product_id) {
          const product = await Database.getProduct(order.product_id)
          productName = product?.name
        }
        console.log("[v0] Attempting to send activation code email to:", recipientEmail)
        await sendActivationCodeEmail({
          to: recipientEmail,
          subject: productName ? `${productName} - 激活码已到账` : "您的激活码已到账",
          activationCode: soldCode.code,
          orderNo,
          productName,
        })
        console.log("[v0] Activation code email sent successfully")
      } catch (emailError) {
        console.error("[v0] Email sending failed:", emailError)
      }
    } else {
      console.log("[v0] No valid email found for order:", orderNo)
    }

    console.log("[v0] ZPAYZ payment processing completed successfully")
    return new Response("success", { status: 200 })
  } catch (processingError: any) {
    console.error("[v0] Critical error during ZPAYZ payment processing:", processingError)
    console.error("[v0] Error details:", {
      message: processingError.message,
      stack: processingError.stack,
      orderNo,
      tradeNo,
      amount,
    })
    return new Response("fail", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] 🔔 ZPAYZ payment notification received (POST)")
    console.log("[v0] 📍 Request URL:", request.url)
    console.log("[v0] 📍 Request headers:", Object.fromEntries(request.headers.entries()))

    const formData = await request.formData()
    const params: Record<string, string> = {}

    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    console.log("[v0] 📋 Extracted POST params count:", Object.keys(params).length)
    return await processZpayzNotification(params)
  } catch (error) {
    console.error("[v0] ❌ ZPAYZ POST notification processing error:", error)
    return new Response("fail", { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] 🔔 ZPAYZ payment notification received (GET)")
    console.log("[v0] 📍 Request URL:", request.url)

    const url = new URL(request.url)
    const params: Record<string, string> = {}

    url.searchParams.forEach((value, key) => {
      params[key] = value
    })

    console.log("[v0] 📋 Extracted GET params count:", Object.keys(params).length)
    return await processZpayzNotification(params)
  } catch (error) {
    console.error("[v0] ❌ ZPAYZ GET notification processing error:", error)
    return new Response("fail", { status: 500 })
  }
}
