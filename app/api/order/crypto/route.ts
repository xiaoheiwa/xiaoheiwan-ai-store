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
    const { email, amount, productId, productName, queryPassword, quantity = 1, deliveryType = "auto", selectedRegion, regionName, couponId, couponCode, discountAmount = 0, referralCode } = body

    if (!email || !amount) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    if (!queryPassword || queryPassword.length < 4 || queryPassword.length > 20) {
      return NextResponse.json({ error: "请设置4-20位查询密码" }, { status: 400 })
    }

    // SECURITY: productId is REQUIRED - reject orders without it
    if (!productId) {
      console.error("[v0] SECURITY: Crypto order attempt without productId!", { email, amount, productName })
      return NextResponse.json({ error: "缺少商品信息" }, { status: 400 })
    }

    // SECURITY: Validate amount against product price from database
    const product = await Database.getProduct(productId)
    if (!product) {
      console.error("[v0] SECURITY: Invalid productId in crypto order!", { productId, email })
      return NextResponse.json({ error: "商品不存在" }, { status: 400 })
    }
    
    // SECURITY: Verify product is active and available for sale
    if (product.status !== "active") {
      console.error("[v0] SECURITY: Attempt to order inactive product via crypto!", { productId, status: product.status })
      return NextResponse.json({ error: "该商品暂停销售" }, { status: 400 })
    }
    
    // Calculate expected price based on tier pricing and quantity
    const unitPrice = getUnitPrice(Number(product.price), product.price_tiers, quantity)
    const expectedSubtotal = Number((unitPrice * quantity).toFixed(2))
    
    // 验证优惠码或推广码折扣
    let verifiedDiscount = 0
    let verifiedReferrerId = null
    
    if (couponId && discountAmount > 0) {
      // 通过优惠码ID验证
      const couponResult = await sql`
        SELECT * FROM coupon_codes 
        WHERE id = ${couponId} AND status = 'active'
      `
      if (couponResult.length > 0) {
        const coupon = couponResult[0]
        if (coupon.discount_type === "fixed") {
          verifiedDiscount = Math.min(Number(coupon.discount_value), expectedSubtotal)
        } else if (coupon.discount_type === "percent") {
          verifiedDiscount = expectedSubtotal * (Number(coupon.discount_value) / 100)
          if (coupon.max_discount_amount && verifiedDiscount > Number(coupon.max_discount_amount)) {
            verifiedDiscount = Number(coupon.max_discount_amount)
          }
        }
        verifiedDiscount = Math.min(verifiedDiscount, expectedSubtotal)
        verifiedReferrerId = coupon.referrer_id
      }
    } else if (referralCode && discountAmount > 0) {
      // 通过推广码验证（推广链接进入但无专属优惠码的情况）
      const referrerResult = await sql`
        SELECT id, commission_rate FROM referrers 
        WHERE UPPER(referral_code) = UPPER(${referralCode}) AND status = 'active'
      `
      if (referrerResult.length > 0) {
        const referrer = referrerResult[0]
        verifiedReferrerId = referrer.id
        const userDiscount = Math.max(5, Math.floor(Number(referrer.commission_rate) / 2))
        verifiedDiscount = expectedSubtotal * (userDiscount / 100)
        verifiedDiscount = Math.min(verifiedDiscount, expectedSubtotal)
      }
    } else if (couponCode && discountAmount > 0) {
      // 通过优惠码code验证
      const couponResult = await sql`
        SELECT * FROM coupon_codes 
        WHERE UPPER(code) = UPPER(${couponCode}) AND status = 'active'
      `
      if (couponResult.length > 0) {
        const coupon = couponResult[0]
        if (coupon.discount_type === "fixed") {
          verifiedDiscount = Math.min(Number(coupon.discount_value), expectedSubtotal)
        } else if (coupon.discount_type === "percent") {
          verifiedDiscount = expectedSubtotal * (Number(coupon.discount_value) / 100)
          if (coupon.max_discount_amount && verifiedDiscount > Number(coupon.max_discount_amount)) {
            verifiedDiscount = Number(coupon.max_discount_amount)
          }
        }
        verifiedDiscount = Math.min(verifiedDiscount, expectedSubtotal)
        verifiedReferrerId = coupon.referrer_id
      }
    }
    
    const expectedAmount = Math.max(0, Number((expectedSubtotal - verifiedDiscount).toFixed(2)))
    if (Math.abs(Number(amount) - expectedAmount) > 0.01) {
      console.error("[v0] SECURITY: Crypto price tampering detected!", { claimed: amount, expected: expectedAmount, productId, unitPrice, quantity, priceTiers: product.price_tiers, discount: verifiedDiscount })
      return NextResponse.json({ error: "价格验证失败" }, { status: 400 })
    }
    const verifiedAmount = expectedAmount
    
    // SECURITY: Use product name from database, not from client
    const verifiedProductName = product.name

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
    // SECURITY: Always use verified product name from database
    const subject = `${verifiedProductName}${qtyLabel}购买`

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
