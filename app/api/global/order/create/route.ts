import crypto from "crypto"
import { NextResponse } from "next/server"
import { createBepusdtTransaction, getBepusdtConfig } from "@/lib/bepusdt-client"
import { getMarketListingBySlug } from "@/lib/global-market"
import { createGlobalUsdtOrder, getGlobalOrderExpiryDate } from "@/lib/global-orders"
import { normalizePaymentNetwork, paymentNetworkToBepusdtTradeType } from "@/lib/market"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function getClientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email || "").trim().toLowerCase()
    const slug = String(body.productSlug || body.slug || "").trim()
    const paymentNetwork = normalizePaymentNetwork(body.paymentNetwork || body.network)

    if (!isEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }
    if (!slug) {
      return NextResponse.json({ error: "Missing product." }, { status: 400 })
    }
    if (!paymentNetwork) {
      return NextResponse.json({ error: "Please select USDT-TRC20 or USDT-BEP20." }, { status: 400 })
    }

    const product = await getMarketListingBySlug("GLOBAL", slug)
    if (!product) {
      return NextResponse.json({ error: "Product is not available in the Global Store." }, { status: 404 })
    }
    if (product.delivery_type !== "manual" && product.stock_count <= 0) {
      return NextResponse.json({ error: "This product is currently out of stock." }, { status: 400 })
    }

    const config = getBepusdtConfig()
    if (!config.enabled) {
      return NextResponse.json({ error: "USDT gateway is not configured." }, { status: 503 })
    }

    const orderNo = `G${Date.now()}${crypto.randomBytes(5).toString("hex").toUpperCase()}`
    const origin = new URL(request.url).origin
    const expiresAt = getGlobalOrderExpiryDate()
    const tradeType = paymentNetworkToBepusdtTradeType(paymentNetwork)

    const bepusdtOrder = await createBepusdtTransaction({
      orderId: orderNo,
      amount: product.price,
      name: product.title,
      notifyUrl: `${origin}/api/pay/bepusdt/notify`,
      redirectUrl: `${origin}/global/pay/${orderNo}`,
      tradeType,
      fiat: "USD",
      rate: "1",
    })

    const expectedAmount = Number(bepusdtOrder.data?.actual_amount || product.price)
    const order = await createGlobalUsdtOrder({
      orderNo,
      email,
      product,
      paymentNetwork,
      paymentAddress: bepusdtOrder.data?.token || null,
      expectedAmount,
      paymentUrl: bepusdtOrder.data?.payment_url || null,
      paymentExpiresAt: expiresAt,
      gatewayResp: {
        provider: "bepusdt",
        tradeType,
        create: bepusdtOrder,
      },
      customerIp: getClientIp(request),
      customerCountry: request.headers.get("cf-ipcountry"),
      userAgent: request.headers.get("user-agent"),
    })

    return NextResponse.json({
      success: true,
      orderNo: order.out_trade_no,
      paymentUrl: order.payment_url,
      payUrl: `/global/pay/${order.out_trade_no}`,
      expectedAmount: order.expected_amount,
      paymentAddress: order.payment_address,
      paymentNetwork: order.payment_network,
      expiresAt: order.payment_expired_at,
    })
  } catch (error: any) {
    console.error("[GlobalOrder] Create failed:", error)
    return NextResponse.json({ error: error?.message || "Failed to create order." }, { status: 500 })
  }
}
