export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import crypto from "crypto"
import { NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

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

// Get USDT exchange rate from database or use default
async function getUsdtRate(): Promise<number> {
  try {
    const result = await sql`SELECT value FROM site_config WHERE key = 'usdt_cny_rate' LIMIT 1`
    if (result.length > 0 && result[0].value) {
      return Number(result[0].value)
    }
  } catch (e) {
    console.error("Failed to get USDT rate from DB:", e)
  }
  // Fallback to env var or default
  return Number(process.env.USDT_CNY_RATE || 7.2)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email, amount, productId, productName, queryPassword, quantity = 1, deliveryType = "auto", selectedRegion, regionName } = body

    if (!email || !amount) {
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
      if (Math.abs(Number(amount) - expectedAmount) > 0.01) {
        console.error("[v0] SECURITY: Crypto price tampering detected!", { claimed: amount, expected: expectedAmount, productId, unitPrice, quantity, priceTiers: product.price_tiers })
        return NextResponse.json({ error: "价格验证失败" }, { status: 400 })
      }
      verifiedAmount = expectedAmount
    }

    // Hash the query password
    const queryPasswordHash = crypto.createHash("sha256").update(queryPassword).digest("hex")

    // Check stock for auto delivery
    if (deliveryType !== "manual") {
      let stockCount: number
      if (productId) {
        stockCount = await Database.getAvailableCodesCountByProduct(productId)
      } else {
        stockCount = await Database.getAvailableCodesCount()
      }

      if (stockCount < quantity) {
        return NextResponse.json({ error: `库存不足，当前库存 ${stockCount} 个` }, { status: 400 })
      }
    }

    // Get USDT rate from database
    const usdtRate = await getUsdtRate()
    // Calculate USDT amount (round to 2 decimal places) using verified amount
    const usdtAmount = (verifiedAmount / usdtRate).toFixed(2)

    // Generate more secure order number with 8 random bytes
    const orderNo = "C" + Date.now() + crypto.randomBytes(8).toString("hex").toUpperCase()
    const qtyLabel = quantity > 1 ? ` x${quantity}` : ""
    const subject = productName ? `${productName}${qtyLabel}购买` : `激活码${qtyLabel}购买`

    const order = await Database.createOrder({
      out_trade_no: orderNo,
      email,
      amount: verifiedAmount,
      subject,
      status: "pending",
      pay_channel: "USDT",
      product_id: productId || null,
      query_password_hash: queryPasswordHash,
      quantity,
      delivery_type: deliveryType,
      selected_region: selectedRegion || null,
      region_name: regionName || null,
    })

    return NextResponse.json({
      success: true,
      orderNo,
      amount: verifiedAmount,
      usdtAmount,
      redirectUrl: `/pay/crypto?orderNo=${orderNo}&amount=${verifiedAmount}&usdt=${usdtAmount}`,
    })
  } catch (error: any) {
    console.error("Crypto order creation failed:", error)
    return NextResponse.json({ error: error?.message || "创建订单失败" }, { status: 500 })
  }
}
