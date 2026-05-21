import { NextResponse } from "next/server"
import { getBepusdtConfig, verifyBepusdtSignature } from "@/lib/bepusdt-client"
import { Database } from "@/lib/database"
import { completePaidOrder } from "@/lib/order-payment-completion"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

type NotifyPayload = Record<string, string | number | boolean | null | undefined>

async function readPayload(request: Request): Promise<NotifyPayload> {
  const contentType = request.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    return await request.json()
  }

  const formData = await request.formData()
  return Object.fromEntries(formData.entries()) as NotifyPayload
}

function successResponse() {
  return new Response("success", { headers: { "Content-Type": "text/plain" } })
}

function failResponse(message = "fail") {
  return new Response(message, { status: 400, headers: { "Content-Type": "text/plain" } })
}

export async function POST(request: Request) {
  let payload: NotifyPayload = {}

  try {
    payload = await readPayload(request)
    const config = getBepusdtConfig()

    if (!config.apiToken) {
      console.error("[BEpusdt] API token is not configured")
      return failResponse()
    }

    if (!verifyBepusdtSignature(payload, config.apiToken)) {
      console.error("[BEpusdt] Invalid callback signature:", payload)
      return failResponse()
    }

    const orderNo = String(payload.order_id || "")
    if (!orderNo) {
      console.error("[BEpusdt] Missing order_id:", payload)
      return failResponse()
    }

    const order = await Database.getOrder(orderNo)
    if (!order) {
      console.error("[BEpusdt] Order not found:", orderNo)
      return successResponse()
    }

    const notifyStatus = Number(payload.status || 0)
    const notifyAmount = order.market === "GLOBAL"
      ? Number(payload.actual_amount || payload.amount || 0)
      : Number(payload.amount || 0)
    const expectedAmount = order.market === "GLOBAL" ? Number(order.expected_amount || order.amount) : Number(order.amount)
    if (notifyAmount > 0 && Math.abs(expectedAmount - notifyAmount) > 0.01) {
      console.error("[BEpusdt] Amount mismatch:", {
        orderNo,
        orderAmount: expectedAmount,
        notifyAmount,
      })
      return failResponse()
    }

    if (notifyStatus === 2) {
      const result = await completePaidOrder({
        orderNo,
        paymentMethod: "usdt",
        cryptoStatus: "bepusdt_verified",
        gatewayResp: {
          provider: "bepusdt",
          notify: payload,
        },
      })

      if (!result.ok) {
        console.error("[BEpusdt] Complete order failed:", result)
        return failResponse()
      }

      return successResponse()
    }

    if (notifyStatus === 3 && order.status === "pending") {
      await Database.updateOrder(orderNo, {
        ...(order.market === "GLOBAL"
          ? {
              status: "failed",
              payment_status: "expired",
              delivery_status: "not_delivered",
            }
          : {}),
        crypto_status: "bepusdt_timeout",
        gateway_resp: JSON.stringify({
          provider: "bepusdt",
          notify: payload,
        }),
      })
    }

    return successResponse()
  } catch (error) {
    console.error("[BEpusdt] Notify error:", {
      error,
      payload,
    })
    return NextResponse.json({ error: "callback_failed" }, { status: 500 })
  }
}

export async function GET() {
  return successResponse()
}
