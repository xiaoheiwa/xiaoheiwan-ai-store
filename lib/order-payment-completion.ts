import { Database } from "@/lib/database"
import { neon } from "@/lib/db-client"
import {
  getRequiredConfirmations,
  lockGlobalInventoryCodes,
  sellGlobalInventoryCodes,
  updateGlobalOrder,
} from "@/lib/global-orders"
import { normalizeInventoryMode, normalizePaymentNetwork } from "@/lib/market"
import { sendCodeMail, sendGlobalDeliveryMail } from "@/lib/resend"
import { checkOrderHighRisk } from "@/lib/risk-control"
import { notifyGlobalOrderSuccess, notifyHighRiskOrder, notifyLowStock, notifyOrderSuccess } from "@/lib/telegram"

const sql = neon(process.env.DATABASE_URL)

interface CompletePaidOrderOptions {
  orderNo: string
  paymentMethod: "alipay" | "usdt"
  gatewayResp: unknown
  cryptoStatus?: string
  allowDeliveryRetry?: boolean
}

async function getProductName(productId?: string | null) {
  if (!productId) return undefined
  const product = await Database.getProduct(productId)
  return product?.name
}

function readGatewayNotify(gatewayResp: unknown) {
  if (!gatewayResp || typeof gatewayResp !== "object") return {} as Record<string, unknown>
  const wrapped = gatewayResp as Record<string, unknown>
  const notify = wrapped.notify
  return notify && typeof notify === "object" ? (notify as Record<string, unknown>) : wrapped
}

async function releaseGlobalDeliveryClaim(orderNo: string) {
  await sql`
    UPDATE orders
    SET delivery_status = 'not_delivered', updated_at = CURRENT_TIMESTAMP
    WHERE out_trade_no = ${orderNo}
      AND market = 'GLOBAL'
      AND delivery_status = 'delivering'
  `
}

async function completeGlobalPaidOrder(options: CompletePaidOrderOptions, order: any) {
  if (order.status === "paid" && (order.fulfilled_at || order.delivery_status === "delivered")) {
    return { ok: true, reason: "global_already_fulfilled" }
  }
  const paymentStatus = String(order.payment_status || "").toLowerCase()
  if (
    order.delivery_status === "manual_review" ||
    order.status === "manual_review" ||
    ["underpaid", "overpaid", "failed", "expired"].includes(paymentStatus)
  ) {
    return { ok: true, reason: "global_already_manual_review" }
  }

  const retryDeliveryStatus = options.allowDeliveryRetry ? "delivery_failed" : "__not_retryable__"
  const claim = await sql`
    UPDATE orders
    SET delivery_status = 'delivering', updated_at = CURRENT_TIMESTAMP
    WHERE out_trade_no = ${options.orderNo}
      AND market = 'GLOBAL'
      AND (
        COALESCE(delivery_status, 'not_delivered') = 'not_delivered'
        OR delivery_status = ${retryDeliveryStatus}
      )
    RETURNING out_trade_no
  `
  if (claim.length === 0) {
    return { ok: true, reason: "global_delivery_in_progress_or_done" }
  }

  try {
    const notify = readGatewayNotify(options.gatewayResp)
    const paymentNetwork = normalizePaymentNetwork(order.payment_network)
    const txHash = String(notify.block_transaction_id || notify.tx_hash || order.tx_hash || order.crypto_tx_hash || "")
    const receivedAmount = Number(notify.actual_amount || order.received_amount || order.expected_amount || order.amount || 0)
    const paymentAddress = String(notify.token || order.payment_address || "")
    const confirmations = getRequiredConfirmations(paymentNetwork)
    const gateway_resp = JSON.stringify(options.gatewayResp)
    const productName = order.product_title_snapshot || order.subject || (await getProductName(order.product_id))

    const paidUpdates = {
      status: "paid",
      paid_at: new Date(),
      gateway_resp,
      crypto_status: options.cryptoStatus || "bepusdt_verified",
      payment_status: "paid",
      received_amount: receivedAmount || Number(order.expected_amount || order.amount || 0),
      tx_hash: txHash || null,
      crypto_tx_hash: txHash || null,
      confirmations,
      payment_address: paymentAddress || order.payment_address || null,
    }

  if ((order.delivery_type || "auto") === "manual") {
    const reviewReason = "Manual service order. Payment confirmed, waiting for support handling."
    await updateGlobalOrder(options.orderNo, {
      ...paidUpdates,
      delivery_status: "manual_review",
      manual_review_reason: reviewReason,
    })
    await notifyGlobalOrderSuccess({
      orderNo: options.orderNo,
      email: order.email,
      amount: Number(order.amount),
      productName,
      quantity: order.quantity || 1,
      paymentNetwork,
      expectedAmount: Number(order.expected_amount || order.amount),
      receivedAmount,
      txHash,
      deliveryStatus: "manual_review",
      reviewReason,
    })
    return { ok: true, reason: "global_paid_manual_review" }
  }

  if (!order.product_id) {
    const reviewReason = "Missing product id for global delivery."
    await updateGlobalOrder(options.orderNo, {
      ...paidUpdates,
      delivery_status: "manual_review",
      manual_review_reason: reviewReason,
    })
    await notifyGlobalOrderSuccess({
      orderNo: options.orderNo,
      email: order.email,
      amount: Number(order.amount),
      productName,
      quantity: order.quantity || 1,
      paymentNetwork,
      expectedAmount: Number(order.expected_amount || order.amount),
      receivedAmount,
      txHash,
      deliveryStatus: "manual_review",
      reviewReason,
    })
    return { ok: true, reason: "global_paid_missing_product" }
  }

  const product = await Database.getProduct(order.product_id)
  const inventoryMode = normalizeInventoryMode((product as any)?.inventory_mode)
  const lockedCodes = await lockGlobalInventoryCodes({
    orderNo: options.orderNo,
    productId: order.product_id,
    quantity: order.quantity || 1,
    market: "GLOBAL",
    inventoryMode,
  })

  if (lockedCodes.length < (order.quantity || 1)) {
    const reviewReason = "Global inventory is missing or insufficient."
    await Database.releaseLockedCode(options.orderNo)
    await updateGlobalOrder(options.orderNo, {
      ...paidUpdates,
      delivery_status: "manual_review",
      manual_review_reason: reviewReason,
    })
    await notifyGlobalOrderSuccess({
      orderNo: options.orderNo,
      email: order.email,
      amount: Number(order.amount),
      productName,
      quantity: order.quantity || 1,
      paymentNetwork,
      expectedAmount: Number(order.expected_amount || order.amount),
      receivedAmount,
      txHash,
      deliveryStatus: "manual_review",
      reviewReason,
    })
    return { ok: true, reason: "global_paid_stock_missing" }
  }

  const soldCodes = await sellGlobalInventoryCodes(options.orderNo)
  if (soldCodes.length === 0) {
    const reviewReason = "Inventory lock succeeded but delivery update failed."
    await Database.releaseLockedCode(options.orderNo)
    await updateGlobalOrder(options.orderNo, {
      ...paidUpdates,
      delivery_status: "delivery_failed",
      manual_review_reason: reviewReason,
    })
    await notifyGlobalOrderSuccess({
      orderNo: options.orderNo,
      email: order.email,
      amount: Number(order.amount),
      productName,
      quantity: order.quantity || 1,
      paymentNetwork,
      expectedAmount: Number(order.expected_amount || order.amount),
      receivedAmount,
      txHash,
      deliveryStatus: "delivery_failed",
      reviewReason,
    })
    return { ok: false, reason: "global_code_sell_failed" }
  }

  const codesText = soldCodes.map((code) => code.code).join("\n")
  await updateGlobalOrder(options.orderNo, {
    ...paidUpdates,
    code: codesText,
    fulfilled_at: new Date(),
    delivery_status: "delivered",
  })

  try {
    await sendGlobalDeliveryMail({
      to: order.email,
      orderNo: options.orderNo,
      productName: productName || "Digital product",
      paymentNetwork,
      deliveryInfo: codesText,
      usageGuide: order.product_description_snapshot || "Please follow the instructions included with your digital delivery.",
    })
    await Database.updateOrder(options.orderNo, { email_sent: true, email_sent_at: new Date() })
  } catch (error) {
    console.error("[PaymentComplete] Global email failed:", error)
    await updateGlobalOrder(options.orderNo, {
      delivery_status: "manual_review",
      manual_review_reason: "Delivered, but delivery email failed. Admin should resend email.",
    })
  }

  try {
    await notifyGlobalOrderSuccess({
      orderNo: options.orderNo,
      email: order.email,
      amount: Number(order.amount),
      productName,
      quantity: order.quantity || 1,
      paymentNetwork,
      expectedAmount: Number(order.expected_amount || order.amount),
      receivedAmount,
      txHash,
      deliveryStatus: "delivered",
      deliveredCount: soldCodes.length,
    })
  } catch (error) {
    console.error("[PaymentComplete] Global Telegram notification failed:", error)
  }

    return { ok: true, reason: "global_paid_fulfilled", codes: soldCodes.map((code) => code.id) }
  } catch (error) {
    try {
      await releaseGlobalDeliveryClaim(options.orderNo)
    } catch (releaseError) {
      console.error("[PaymentComplete] Failed to release global delivery claim:", releaseError)
    }
    throw error
  }
}

export async function completePaidOrder(options: CompletePaidOrderOptions) {
  const order = await Database.getOrder(options.orderNo)
  if (!order) return { ok: false, reason: "order_not_found" }

  if (order.market === "GLOBAL") {
    return completeGlobalPaidOrder(options, order)
  }

  if (order.status === "paid" && order.fulfilled_at) {
    return { ok: true, reason: "already_fulfilled" }
  }

  if (order.status === "paid" && order.delivery_type === "manual") {
    return { ok: true, reason: "already_paid_manual" }
  }

  const claimed = await Database.claimOrderForDelivery(options.orderNo)
  if (!claimed) {
    return { ok: true, reason: "delivery_already_claimed" }
  }

  try {
    const orderQuantity = order.quantity || 1
    const orderDeliveryType = order.delivery_type || "auto"
    const productName = await getProductName(order.product_id)
    const gateway_resp = JSON.stringify(options.gatewayResp)

  if (orderDeliveryType === "manual") {
    await Database.updateOrder(options.orderNo, {
      status: "paid",
      paid_at: new Date(),
      gateway_resp,
      delivery_status: "manual_review",
      ...(options.cryptoStatus ? { crypto_status: options.cryptoStatus } : {}),
    })

    try {
      const manualServiceMessage = `您的订单已支付成功！

这是一个人工服务订单，请添加客服微信完成后续服务：

客服微信号：xbbdkj-com

添加时请备注您的订单号：${options.orderNo}

客服会在工作时间内尽快处理您的订单，感谢您的耐心等待。`

      await sendCodeMail({
        to: order.email,
        subject: productName ? `${productName} - 请添加客服微信完成服务` : "订单已支付 - 请添加客服微信完成服务",
        activationCode: manualServiceMessage,
        orderNo: options.orderNo,
        productName,
      })
      await Database.updateOrder(options.orderNo, { email_sent: true, email_sent_at: new Date() })
    } catch (error) {
      console.error("[PaymentComplete] Manual order email failed:", error)
    }

    try {
      await notifyOrderSuccess({
        orderNo: options.orderNo,
        email: order.email,
        amount: Number(order.amount),
        productName,
        quantity: orderQuantity,
        paymentMethod: options.paymentMethod,
        regionName: order.region_name || undefined,
      })
    } catch (error) {
      console.error("[PaymentComplete] Telegram notification failed:", error)
    }

    return { ok: true, reason: "paid_manual" }
  }

  const riskCheck = await checkOrderHighRisk(order.email, Number(order.amount))
  if (riskCheck.isHighRisk && riskCheck.reviewEnabled) {
    await Database.updateOrder(options.orderNo, {
      status: "paid",
      paid_at: new Date(),
      gateway_resp,
      is_high_risk: true,
      risk_reason: riskCheck.reasons.join("; "),
      review_status: "pending_review",
      delivery_status: "manual_review",
      ...(options.cryptoStatus ? { crypto_status: options.cryptoStatus } : {}),
    })

    try {
      await notifyHighRiskOrder({
        orderNo: options.orderNo,
        email: order.email,
        amount: Number(order.amount),
        productName,
        quantity: orderQuantity,
        riskReasons: riskCheck.reasons,
      })
    } catch (error) {
      console.error("[PaymentComplete] High risk notification failed:", error)
    }

    return { ok: true, reason: "paid_pending_review" }
  }

  const lockedCodes = order.product_id
    ? await Database.lockMultipleCodesByProduct(options.orderNo, order.product_id, orderQuantity)
    : await Promise.all(Array.from({ length: orderQuantity }, () => Database.lockCode(options.orderNo))).then((codes) => codes.filter(Boolean) as any[])

  if (lockedCodes.length < orderQuantity) {
    await Database.releaseLockedCode(options.orderNo)
    await Database.updateOrder(options.orderNo, {
      status: "paid",
      paid_at: new Date(),
      gateway_resp,
      delivery_status: "delivery_failed",
      ...(options.cryptoStatus ? { crypto_status: `${options.cryptoStatus}_stock_missing` } : {}),
    })

    try {
      await notifyOrderSuccess({
        orderNo: options.orderNo,
        email: order.email,
        amount: Number(order.amount),
        productName,
        quantity: orderQuantity,
        paymentMethod: options.paymentMethod,
        regionName: order.region_name || undefined,
      })
    } catch (error) {
      console.error("[PaymentComplete] Stock missing notification failed:", error)
    }

    return { ok: true, reason: "paid_stock_missing" }
  }

  const soldCodes = await Database.sellMultipleCodes(options.orderNo)
  if (soldCodes.length === 0) {
    await Database.releaseLockedCode(options.orderNo)
    await Database.updateOrder(options.orderNo, { delivery_status: "delivery_failed" })
    return { ok: false, reason: "code_sell_failed" }
  }

  const allCodes = soldCodes.map((code) => code.code)
  const codesText = allCodes.join("\n")

  await Database.updateOrder(options.orderNo, {
    status: "paid",
    code: codesText,
    paid_at: new Date(),
    fulfilled_at: new Date(),
    gateway_resp,
    delivery_status: "delivered",
    ...(options.cryptoStatus ? { crypto_status: options.cryptoStatus } : {}),
  })

  try {
    const qtyLabel = orderQuantity > 1 ? ` x${orderQuantity}` : ""
    await sendCodeMail({
      to: order.email,
      subject: productName ? `${productName}${qtyLabel} - 激活码已到账` : `激活码${qtyLabel}已到账`,
      activationCode: codesText,
      orderNo: options.orderNo,
      productName,
    })

    await Database.updateOrder(options.orderNo, { email_sent: true, email_sent_at: new Date() })
  } catch (error) {
    console.error("[PaymentComplete] Email failed:", error)
    await Database.updateOrder(options.orderNo, {
      email_failed: true,
      email_error: error instanceof Error ? error.message : "Unknown email error",
    })
  }

  try {
    await notifyOrderSuccess({
      orderNo: options.orderNo,
      email: order.email,
      amount: Number(order.amount),
      productName,
      quantity: orderQuantity,
      paymentMethod: options.paymentMethod,
      codes: allCodes,
      regionName: order.region_name || undefined,
    })

    if (order.product_id) {
      const remaining = await Database.getAvailableCodesCountByProduct(order.product_id)
      if (remaining <= 10) {
        await notifyLowStock({
          productId: order.product_id,
          productName,
          remaining,
          threshold: 10,
        })
      }
    }
  } catch (error) {
    console.error("[PaymentComplete] Telegram notification failed:", error)
  }

    return { ok: true, reason: "paid_fulfilled", codes: allCodes }
  } catch (error) {
    try {
      await Database.releaseDeliveryClaim(options.orderNo)
    } catch (releaseError) {
      console.error("[PaymentComplete] Failed to release delivery claim:", releaseError)
    }
    throw error
  }
}
