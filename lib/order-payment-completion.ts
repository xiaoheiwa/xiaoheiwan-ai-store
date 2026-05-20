import { Database } from "@/lib/database"
import { sendCodeMail } from "@/lib/resend"
import { checkOrderHighRisk } from "@/lib/risk-control"
import { notifyHighRiskOrder, notifyLowStock, notifyOrderSuccess } from "@/lib/telegram"

interface CompletePaidOrderOptions {
  orderNo: string
  paymentMethod: "alipay" | "usdt"
  gatewayResp: unknown
  cryptoStatus?: string
}

async function getProductName(productId?: string | null) {
  if (!productId) return undefined
  const product = await Database.getProduct(productId)
  return product?.name
}

export async function completePaidOrder(options: CompletePaidOrderOptions) {
  const order = await Database.getOrder(options.orderNo)
  if (!order) return { ok: false, reason: "order_not_found" }

  if (order.status === "paid" && order.fulfilled_at) {
    return { ok: true, reason: "already_fulfilled" }
  }

  if (order.status === "paid" && order.delivery_type === "manual") {
    return { ok: true, reason: "already_paid_manual" }
  }

  const orderQuantity = order.quantity || 1
  const orderDeliveryType = order.delivery_type || "auto"
  const productName = await getProductName(order.product_id)
  const gateway_resp = JSON.stringify(options.gatewayResp)

  if (orderDeliveryType === "manual") {
    await Database.updateOrder(options.orderNo, {
      status: "paid",
      paid_at: new Date(),
      gateway_resp,
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
}
