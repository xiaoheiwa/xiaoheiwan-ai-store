export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import crypto from "crypto"
import { NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { getEnv } from "@/lib/env"
import { ZPayz } from "@/lib/zpayz-client"

interface PriceTier {
  min_qty: number
  price: number
}

// Calculate unit price based on tier pricing (same logic as frontend)
function getUnitPrice(basePrice: number, priceTiers: PriceTier[] | null, qty: number): number {
  if (!priceTiers || priceTiers.length === 0) return basePrice
  const sorted = [...priceTiers].sort((a, b) => b.min_qty - a.min_qty)
  for (const tier of sorted) {
    if (qty >= tier.min_qty) return tier.price
  }
  return basePrice
}

export async function POST(req: Request) {
  const t0 = Date.now()
  console.log("[v0] ============ ORDER CREATION START ============")

  try {
    const body = await req.json().catch(() => ({}))
    const { email, paymentMethod, amount, productId, productName, queryPassword, quantity = 1, deliveryType = "auto", selectedRegion, regionName } = body
    console.log("[v0] Order creation request:", { email, paymentMethod, amount, productId, productName, quantity, deliveryType, selectedRegion, regionName, hasQueryPassword: !!queryPassword })

    if (!email || !paymentMethod || !amount) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    if (!queryPassword || queryPassword.length < 4 || queryPassword.length > 20) {
      return NextResponse.json({ error: "请设置4-20位查询密码" }, { status: 400 })
    }

    // SECURITY: Validate amount against product price from database
    let verifiedAmount = amount
    if (productId) {
      const product = await Database.getProduct(productId)
      if (!product) {
        return NextResponse.json({ error: "商品不存在" }, { status: 400 })
      }
      // Calculate expected price based on tier pricing and quantity
      const unitPrice = getUnitPrice(Number(product.price), product.price_tiers, quantity)
      const expectedAmount = Number((unitPrice * quantity).toFixed(2))
      // Allow only exact match or slight floating point tolerance
      if (Math.abs(Number(amount) - expectedAmount) > 0.01) {
        console.error("[v0] SECURITY: Price tampering detected!", { claimed: amount, expected: expectedAmount, productId, unitPrice, quantity, priceTiers: product.price_tiers })
        return NextResponse.json({ error: "价格验证失败" }, { status: 400 })
      }
      verifiedAmount = expectedAmount
    }

    // Hash the query password with SHA-256
    const queryPasswordHash = crypto.createHash("sha256").update(queryPassword).digest("hex")

    // Check stock: skip for manual delivery, check quantity for auto
    if (deliveryType !== "manual") {
      let stockCount: number
      if (productId) {
        stockCount = await Database.getAvailableCodesCountByProduct(productId)
      } else {
        stockCount = await Database.getAvailableCodesCount()
      }
      console.log("[v0] Stock count:", stockCount, "productId:", productId, "quantity:", quantity)

      if (stockCount < quantity) {
        return NextResponse.json({ error: `库存不足，当前库存 ${stockCount} 个` }, { status: 400 })
      }
    }

    // Generate more secure order number with 8 random bytes
    const orderNo = "O" + Date.now() + crypto.randomBytes(8).toString("hex").toUpperCase()
    console.log("[v0] Generated order number:", orderNo)

    const qtyLabel = quantity > 1 ? ` x${quantity}` : ""
    const subject = productName ? `${productName}${qtyLabel}购买` : `激活码${qtyLabel}购买`

    const order = await Database.createOrder({
      out_trade_no: orderNo,
      email,
      amount: verifiedAmount,
      subject,
      status: "pending",
      pay_channel: paymentMethod === "alipay" ? "支付宝" : "微信支付",
      product_id: productId || null,
      query_password_hash: queryPasswordHash,
      quantity,
      delivery_type: deliveryType,
      selected_region: selectedRegion || null,
      region_name: regionName || null,
    })
    console.log("[v0] Order created:", order.out_trade_no)

    const baseUrl = getEnv("SITE_BASE")
    if (!baseUrl || baseUrl.includes("localhost")) {
      console.error("[v0] Invalid SITE_BASE:", baseUrl)
      return NextResponse.json({ error: "支付配置错误，请联系管理员" }, { status: 500 })
    }

    const notifyUrl = `${baseUrl}/api/pay/notify`
    const returnUrl = `${baseUrl}/success?orderNo=${orderNo}`

    const paymentParams = {
      name: productName || "小黑丸Plus激活码",
      money: verifiedAmount.toString(),
      type: paymentMethod as "alipay" | "wxpay",
      out_trade_no: orderNo,
      notify_url: notifyUrl,
      return_url: returnUrl,
      param: email,
    }

    const paymentUrl = ZPayz.createPagePayment(paymentParams)

    console.log("[v0] Payment URL generated")
    return NextResponse.json({
      success: true,
      orderNo,
      paymentUrl,
      redirectUrl: paymentUrl,
    })
  } catch (error: any) {
    console.error("[v0] ORDER CREATION FAILED:", error?.message)
    return NextResponse.json({ error: error?.message || "创建订单失败" }, { status: 500 })
  } finally {
    console.log("[v0] Order creation completed in", Date.now() - t0, "ms")
  }
}
