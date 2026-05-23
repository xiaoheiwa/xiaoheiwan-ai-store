export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import crypto from "crypto"
import { NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { getEnv } from "@/lib/env"
import { ZPayz } from "@/lib/zpayz-client"
import { neon } from "@/lib/db-client"
import { checkRisk } from "@/lib/risk-control"
import { calculateCouponDiscount, getCouponRejectionReason } from "@/lib/coupon-order-validation"

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
    const { email, paymentMethod, amount, originalAmount, productId, productName, queryPassword, quantity = 1, deliveryType = "auto", selectedRegion, regionName, clientip, couponId, couponCode, discountAmount = 0, referralCode, referrerId } = body
    console.log("[v0] Order creation request - paymentMethod:", paymentMethod, "type:", typeof paymentMethod)
    console.log("[v0] Order creation request:", { email, paymentMethod, amount, originalAmount, productId, productName, quantity, deliveryType, selectedRegion, regionName, hasQueryPassword: !!queryPassword, clientip, couponId, couponCode, discountAmount, referralCode, referrerId })
    
    // 确定支付渠道显示名称
    let payChannel = "其他"
    if (paymentMethod === "alipay") {
      payChannel = "支付宝"
    } else if (paymentMethod === "wxpay") {
      payChannel = "微信支付"
    }
    console.log("[v0] Determined pay_channel:", payChannel, "from paymentMethod:", paymentMethod)

    if (!email || !paymentMethod || !amount) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // 风控检查
    const headerClientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined
    const clientIp = headerClientIp || (typeof clientip === "string" ? clientip : undefined)
    const riskResult = await checkRisk({
      email,
      clientIp,
      amount: Number(amount),
      productId
    })
    
    if (!riskResult.allowed) {
      console.error("[v0] RISK CONTROL BLOCKED:", { email, clientIp, reason: riskResult.reason, riskScore: riskResult.riskScore })
      return NextResponse.json({ error: riskResult.reason || "订单创建失败，请稍后再试" }, { status: 403 })
    }
    
    if (riskResult.warnings.length > 0) {
      console.warn("[v0] RISK WARNING:", { email, clientIp, warnings: riskResult.warnings, riskScore: riskResult.riskScore })
    }

    if (!queryPassword || queryPassword.length < 4 || queryPassword.length > 20) {
      return NextResponse.json({ error: "请设置4-20位查询密码" }, { status: 400 })
    }

    // SECURITY: productId is REQUIRED - reject orders without it
    if (!productId) {
      console.error("[v0] SECURITY: Order attempt without productId!", { email, amount, productName })
      return NextResponse.json({ error: "缺少商品信息" }, { status: 400 })
    }

    // SECURITY: Validate amount against product price from database
    const product = await Database.getProduct(productId)
    if (!product) {
      console.error("[v0] SECURITY: Invalid productId!", { productId, email })
      return NextResponse.json({ error: "商品不存在" }, { status: 400 })
    }
    
    // SECURITY: Verify product is active and available for sale
    if (product.status !== "active") {
      console.error("[v0] SECURITY: Attempt to order inactive product!", { productId, status: product.status })
      return NextResponse.json({ error: "该商品暂停销售" }, { status: 400 })
    }
    
    // Calculate expected price based on tier pricing and quantity
    const unitPrice = getUnitPrice(Number(product.price), product.price_tiers, quantity)
    const expectedSubtotal = Number((unitPrice * quantity).toFixed(2))
    
    // 验证优惠码折扣
    let verifiedDiscount = 0
    let verifiedReferrerId = null
    const sqlConn = neon(process.env.DATABASE_URL!)
    
    if (couponId && discountAmount > 0) {
      // 方式1：通过优惠码ID验证
      const couponResult = await sqlConn`
        SELECT * FROM coupon_codes 
        WHERE id = ${couponId} AND status = 'active'
      `
      if (couponResult.length > 0) {
        const coupon = couponResult[0]
        const couponError = await getCouponRejectionReason(sqlConn, coupon, { productId, email, subtotal: expectedSubtotal })
        if (couponError) {
          return NextResponse.json({ error: couponError }, { status: 400 })
        }
        verifiedDiscount = calculateCouponDiscount(coupon, expectedSubtotal)
        verifiedReferrerId = coupon.referrer_id
      }
    } else if (referralCode && discountAmount > 0) {
      // 方式2：通过推广码验证（推广链接进入但无专属优惠码的情况）
      const referrerResult = await sqlConn`
        SELECT id, commission_rate FROM referrers 
        WHERE UPPER(referral_code) = UPPER(${referralCode}) AND status = 'active'
      `
      if (referrerResult.length > 0) {
        const referrer = referrerResult[0]
        verifiedReferrerId = referrer.id
        // 动态计算折扣：佣金比例的一半作为用户折扣，最少5%
        const userDiscount = Math.max(5, Math.floor(Number(referrer.commission_rate) / 2))
        verifiedDiscount = expectedSubtotal * (userDiscount / 100)
        verifiedDiscount = Math.min(verifiedDiscount, expectedSubtotal)
        console.log("[v0] Referral discount applied:", { referralCode, commissionRate: referrer.commission_rate, userDiscount, verifiedDiscount })
      }
    } else if (couponCode && discountAmount > 0) {
      // 方式3：通过优惠码code验证（兼容旧逻辑）
      const couponResult = await sqlConn`
        SELECT * FROM coupon_codes 
        WHERE UPPER(code) = UPPER(${couponCode}) AND status = 'active'
      `
      if (couponResult.length > 0) {
        const coupon = couponResult[0]
        const couponError = await getCouponRejectionReason(sqlConn, coupon, { productId, email, subtotal: expectedSubtotal })
        if (couponError) {
          return NextResponse.json({ error: couponError }, { status: 400 })
        }
        verifiedDiscount = calculateCouponDiscount(coupon, expectedSubtotal)
        verifiedReferrerId = coupon.referrer_id
      }
    }
    
    const expectedAmount = Math.max(0, Number((expectedSubtotal - verifiedDiscount).toFixed(2)))
    // Allow only exact match or slight floating point tolerance
    if (Math.abs(Number(amount) - expectedAmount) > 0.01) {
      console.error("[v0] SECURITY: Price tampering detected!", { claimed: amount, expected: expectedAmount, productId, unitPrice, quantity, priceTiers: product.price_tiers, discount: verifiedDiscount })
      return NextResponse.json({ error: "价格验证失败" }, { status: 400 })
    }
    const verifiedAmount = expectedAmount
    
    // SECURITY: Use product name from database, not from client
    const verifiedProductName = product.name

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
    // SECURITY: Always use verified product name from database
    const subject = `${verifiedProductName}${qtyLabel}购买`

    const order = await Database.createOrder({
      out_trade_no: orderNo,
      email,
      amount: verifiedAmount,
      subject,
      status: "pending",
      pay_channel: payChannel,
      product_id: productId || null,
      query_password_hash: queryPasswordHash,
      quantity,
      delivery_type: deliveryType,
      selected_region: selectedRegion || null,
      region_name: regionName || null,
      client_ip: clientIp || null,
    })
    console.log("[v0] Order created:", order.out_trade_no)

    // 记录优惠码使用（包含推广佣金）
    if (couponId && verifiedDiscount > 0) {
      try {
        const sqlConn = neon(process.env.DATABASE_URL!)
        
        // 获取优惠码的推广用户信息
        const couponInfo = await sqlConn`
          SELECT c.referrer_id, c.commission_rate, r.commission_rate as default_rate
          FROM coupon_codes c
          LEFT JOIN referrers r ON c.referrer_id = r.id
          WHERE c.id = ${couponId}
        `
        
        let referrerId = null
        let commissionAmount = 0
        
        if (couponInfo.length > 0 && couponInfo[0].referrer_id) {
          referrerId = couponInfo[0].referrer_id
          // 使用优惠码专属佣金比例，如果没有则使用推广用户默认比例
          const commissionRate = couponInfo[0].commission_rate || couponInfo[0].default_rate || 0
          // 佣金基于实付金额（扣除优惠后的金额）
          commissionAmount = Number((verifiedAmount * (commissionRate / 100)).toFixed(2))
        }
        
        // 插入使用记录（包含推广信息和佣金）
        await sqlConn`
          INSERT INTO coupon_usage (coupon_id, order_no, user_email, discount_amount, referrer_id, commission_amount, order_amount)
          VALUES (${couponId}, ${orderNo}, ${email}, ${verifiedDiscount}, ${referrerId}, ${commissionAmount}, ${verifiedAmount})
        `
        // 增加使用次数
        await sqlConn`
          UPDATE coupon_codes SET used_count = used_count + 1, updated_at = NOW()
          WHERE id = ${couponId}
        `
        console.log("[v0] Coupon usage recorded:", { couponId, couponCode, discount: verifiedDiscount, referrerId, commission: commissionAmount })
      } catch (couponError) {
        console.error("[v0] Failed to record coupon usage:", couponError)
        // 不阻止订单创建
      }
    }

    const baseUrl = getEnv("SITE_BASE")
    if (!baseUrl || baseUrl.includes("localhost")) {
      console.error("[v0] Invalid SITE_BASE:", baseUrl)
      return NextResponse.json({ error: "支付配置错误，请联系管理员" }, { status: 500 })
    }

    const notifyUrl = `${baseUrl}/api/pay/notify`
    const returnUrl = `${baseUrl}/success?orderNo=${orderNo}`

    // Use generic name for payment to avoid content review issues
    // Real product name is stored in database for Telegram notifications and admin
    // Priority: category payment_name > env PAYMENT_PRODUCT_NAME > default "数字商品"
    let safePaymentName = process.env.PAYMENT_PRODUCT_NAME || "数字商品"
    
    // Try to get payment_name from product's category
    if (productId) {
      try {
        const sql = neon(process.env.DATABASE_URL!)
        const categoryResult = await sql`
          SELECT c.payment_name 
          FROM products p 
          JOIN product_categories c ON p.category_id = c.id 
          WHERE p.id = ${productId} AND c.payment_name IS NOT NULL AND c.payment_name != ''
        `
        if (categoryResult.length > 0 && categoryResult[0].payment_name) {
          safePaymentName = categoryResult[0].payment_name
        }
      } catch (e) {
        console.log("[v0] Failed to get category payment_name, using default")
      }
    }
    const paymentParams = {
      name: safePaymentName,
      money: verifiedAmount.toString(),
      type: paymentMethod as "alipay" | "wxpay",
      out_trade_no: orderNo,
      notify_url: notifyUrl,
      return_url: returnUrl,
      param: email,
    }

    // 微信支付使用 API 方式（支持手机端 JSAPI）
    if (paymentMethod === "wxpay") {
      // 获取客户端 IP（从请求头或前端传递）
      const ip = clientIp || "127.0.0.1"
      console.log("[v0] 微信支付 API 方式, clientip:", ip)
      
      const apiResult = await ZPayz.createApiPayment({
        ...paymentParams,
        clientip: ip,
        device: "mobile",
      })

      console.log("[v0] 微信支付 API 返回:", JSON.stringify(apiResult))

      if (apiResult.code === 1 || apiResult.code === "1") {
        const paymentUrl = apiResult.payurl || apiResult.qrcode || apiResult.urlscheme
        return NextResponse.json({
          success: true,
          orderNo,
          paymentUrl,
          redirectUrl: paymentUrl,
          qrcode: apiResult.qrcode,
        })
      } else {
        console.error("[v0] 微信支付 API 失败:", apiResult)
        // 失败时回退到页面跳转方式
        const paymentUrl = ZPayz.createPagePayment(paymentParams)
        return NextResponse.json({
          success: true,
          orderNo,
          paymentUrl,
          redirectUrl: paymentUrl,
        })
      }
    }

    // 支付宝使用页面跳转方式
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
    return NextResponse.json({ error: error?.message || "创建订单���败" }, { status: 500 })
  } finally {
    console.log("[v0] Order creation completed in", Date.now() - t0, "ms")
  }
}
