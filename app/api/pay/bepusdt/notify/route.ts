import { NextResponse } from "next/server"
import { getBepusdtConfig, verifyBepusdtSignature } from "@/lib/bepusdt-client"
import { Database } from "@/lib/database"
import { sql } from "@/lib/db"
import { bepusdtTradeTypeToPaymentNetwork, normalizePaymentNetwork } from "@/lib/market"
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

async function markGlobalPaymentReview(
  orderNo: string,
  payload: NotifyPayload,
  paymentStatus: "underpaid" | "overpaid" | "failed",
  reason: string,
) {
  const txHash = String(payload.block_transaction_id || payload.tx_hash || "")
  await Database.updateOrder(orderNo, {
    status: "manual_review",
    payment_status: paymentStatus,
    delivery_status: "manual_review",
    received_amount: Number(payload.actual_amount || payload.amount || 0) || null,
    tx_hash: txHash || null,
    crypto_tx_hash: txHash || null,
    manual_review_reason: reason,
    gateway_resp: JSON.stringify({
      provider: "bepusdt",
      notify: payload,
    }),
  })
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

    if (order.market === "GLOBAL" && notifyStatus === 2) {
      const expectedNetwork = normalizePaymentNetwork(order.payment_network)
      const actualNetwork = bepusdtTradeTypeToPaymentNetwork(payload.trade_type || payload.type || payload.network)
      if (expectedNetwork && actualNetwork && expectedNetwork !== actualNetwork) {
        await markGlobalPaymentReview(
          orderNo,
          payload,
          "failed",
          `Payment network mismatch. Expected ${expectedNetwork}, received ${actualNetwork}.`,
        )
        return successResponse()
      }

      const txHash = String(payload.block_transaction_id || payload.tx_hash || "")
      if (txHash) {
        const duplicateTx = await sql`
          SELECT out_trade_no
          FROM orders
          WHERE out_trade_no != ${orderNo}
            AND (tx_hash = ${txHash} OR crypto_tx_hash = ${txHash})
          LIMIT 1
        `
        if (duplicateTx.length > 0) {
          await markGlobalPaymentReview(
            orderNo,
            payload,
            "failed",
            `Duplicate transaction hash already used by order ${duplicateTx[0].out_trade_no}.`,
          )
          return successResponse()
        }
      }
    }

    if (notifyAmount > 0 && Math.abs(expectedAmount - notifyAmount) > 0.01) {
      console.error("[BEpusdt] Amount mismatch:", {
        orderNo,
        orderAmount: expectedAmount,
        notifyAmount,
      })
      if (order.market === "GLOBAL" && notifyStatus === 2) {
        await markGlobalPaymentReview(
          orderNo,
          payload,
          notifyAmount < expectedAmount ? "underpaid" : "overpaid",
          notifyAmount < expectedAmount
            ? `Underpaid global order. Expected ${expectedAmount}, received ${notifyAmount}.`
            : `Overpaid global order. Expected ${expectedAmount}, received ${notifyAmount}.`,
        )
        return successResponse()
      }
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
              status: "expired",
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
