/**
 * Telegram Bot Notification Utility
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

interface OrderNotification {
  orderNo: string
  email: string
  amount: number
  productName?: string
  quantity: number
  paymentMethod: string
  codes?: string[]
}

interface StockNotification {
  productId?: string
  productName?: string
  remaining: number
  threshold?: number
}

function escapeMarkdown(text: string): string {
  // Escape special characters for Telegram MarkdownV2
  return text.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&')
}

export async function sendTelegramMessage(message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[Telegram] Bot token or chat ID not configured, skipping notification")
    return false
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("[Telegram] Failed to send message:", error)
      return false
    }

    console.log("[Telegram] Message sent successfully")
    return true
  } catch (error) {
    console.error("[Telegram] Error sending message:", error)
    return false
  }
}

// Send message and return message_id for reply tracking
export async function sendTelegramMessageWithId(message: string): Promise<{ ok: boolean; messageId?: number }> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { ok: false }
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    )

    if (!response.ok) {
      return { ok: false }
    }

    const data = await response.json()
    return { ok: true, messageId: data.result?.message_id }
  } catch (error) {
    console.error("[Telegram] Error:", error)
    return { ok: false }
  }
}

export async function notifyOrderSuccess(data: OrderNotification): Promise<boolean> {
  const paymentLabel = data.paymentMethod === "usdt" ? "USDT" : "支付宝"
  const codesPreview = data.codes?.length 
    ? `\n<b>激活码:</b> <code>${data.codes.slice(0, 3).join(", ")}${data.codes.length > 3 ? ` (+${data.codes.length - 3}个)` : ""}</code>` 
    : ""

  const message = `
<b>🎉 新订单成功</b>

<b>订单号:</b> <code>${data.orderNo}</code>
<b>邮箱:</b> ${data.email}
<b>产品:</b> ${data.productName || "激活码"}
<b>数量:</b> ${data.quantity}
<b>金额:</b> ¥${data.amount}
<b>支付方式:</b> ${paymentLabel}${codesPreview}

<i>⏰ ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</i>
`.trim()

  return sendTelegramMessage(message)
}

export async function notifyLowStock(data: StockNotification): Promise<boolean> {
  const threshold = data.threshold || 10
  const emoji = data.remaining <= 5 ? "🚨" : "⚠️"

  const message = `
<b>${emoji} 库存预警</b>

<b>产品:</b> ${data.productName || "通用激活码"}
<b>剩余库存:</b> ${data.remaining}
<b>预警阈值:</b> ${threshold}

<i>请及时补充库存！</i>
`.trim()

  return sendTelegramMessage(message)
}

export async function notifyCryptoPending(data: {
  orderNo: string
  email: string
  amount: number
  usdtAmount: string
  productName?: string
  txHash: string
  verifyError?: string
}): Promise<boolean> {
  const errorLine = data.verifyError 
    ? `\n<b>自动验证:</b> ❌ ${data.verifyError}` 
    : ""
  
  const message = `
<b>💰 USDT待验证</b>

<b>订单号:</b> <code>${data.orderNo}</code>
<b>邮箱:</b> ${data.email}
<b>产品:</b> ${data.productName || "激活码"}
<b>金额:</b> ¥${data.amount} (${data.usdtAmount} USDT)
<b>交易哈希:</b> <code>${data.txHash}</code>${errorLine}

<i>请前往后台验证支付</i>
`.trim()

  return sendTelegramMessage(message)
}
