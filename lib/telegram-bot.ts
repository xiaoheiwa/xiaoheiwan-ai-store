"use strict"

/**
 * Telegram Bot API 封装
 * 提供消息发送、Inline Keyboard、Callback 处理等功能
 */

const TELEGRAM_API = "https://api.telegram.org/bot"

// 获取 Bot Token
function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured")
  }
  return token
}

// API 请求封装
async function telegramRequest(method: string, params: Record<string, unknown> = {}) {
  const token = getBotToken()
  const url = `${TELEGRAM_API}${token}/${method}`
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  
  const data = await response.json()
  
  if (!data.ok) {
    console.error(`[Telegram API Error] ${method}:`, data)
    throw new Error(data.description || "Telegram API error")
  }
  
  return data.result
}

// Inline Keyboard 按钮类型
export interface InlineButton {
  text: string
  callback_data?: string
  url?: string
}

// Inline Keyboard 构建
export function buildInlineKeyboard(buttons: InlineButton[][]): { inline_keyboard: InlineButton[][] } {
  return { inline_keyboard: buttons }
}

// 快捷按钮构建器
export const kb = {
  // 回调按钮
  callback: (text: string, data: string): InlineButton => ({
    text,
    callback_data: data,
  }),
  // URL 按钮
  url: (text: string, url: string): InlineButton => ({
    text,
    url,
  }),
}

// 发送消息
export async function sendMessage(
  chatId: string | number,
  text: string,
  options: {
    parseMode?: "HTML" | "Markdown" | "MarkdownV2"
    replyMarkup?: ReturnType<typeof buildInlineKeyboard>
    disableWebPagePreview?: boolean
  } = {}
) {
  return telegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: options.parseMode || "HTML",
    reply_markup: options.replyMarkup,
    disable_web_page_preview: options.disableWebPagePreview,
  })
}

// 编辑消息
export async function editMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  options: {
    parseMode?: "HTML" | "Markdown" | "MarkdownV2"
    replyMarkup?: ReturnType<typeof buildInlineKeyboard>
  } = {}
) {
  return telegramRequest("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: options.parseMode || "HTML",
    reply_markup: options.replyMarkup,
  })
}

// 回应 Callback Query
export async function answerCallbackQuery(
  callbackQueryId: string,
  options: {
    text?: string
    showAlert?: boolean
  } = {}
) {
  return telegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: options.text,
    show_alert: options.showAlert,
  })
}

// 删除消息
export async function deleteMessage(chatId: string | number, messageId: number) {
  return telegramRequest("deleteMessage", {
    chat_id: chatId,
    message_id: messageId,
  })
}

// 设置 Webhook
export async function setWebhook(url: string, secretToken?: string) {
  return telegramRequest("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
  })
}

// 删除 Webhook
export async function deleteWebhook() {
  return telegramRequest("deleteWebhook", { drop_pending_updates: true })
}

// 获取 Webhook 信息
export async function getWebhookInfo() {
  return telegramRequest("getWebhookInfo")
}

// 消息类型定义
export interface TelegramMessage {
  message_id: number
  from?: {
    id: number
    is_bot: boolean
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
  }
  chat: {
    id: number
    type: "private" | "group" | "supergroup" | "channel"
    title?: string
    username?: string
    first_name?: string
    last_name?: string
  }
  date: number
  text?: string
  entities?: Array<{
    type: string
    offset: number
    length: number
  }>
}

export interface TelegramCallbackQuery {
  id: string
  from: {
    id: number
    is_bot: boolean
    first_name: string
    last_name?: string
    username?: string
  }
  message?: TelegramMessage
  chat_instance: string
  data?: string
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

// 解析命令
export function parseCommand(text: string): { command: string; args: string } | null {
  if (!text || !text.startsWith("/")) return null
  
  const parts = text.split(/\s+/)
  const commandPart = parts[0]
  
  // 移除 @bot 后缀
  const command = commandPart.split("@")[0].substring(1).toLowerCase()
  const args = parts.slice(1).join(" ")
  
  return { command, args }
}

// 格式化金额
export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`
}

// 转义 HTML 特殊字符
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

// 支付成功通知
export async function notifyPaymentSuccess(
  chatId: string | number,
  orderInfo: {
    orderNo: string
    productName: string
    code?: string
    amount: number
  }
) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://upgrade.xiaoheiwan.com"
  
  let text = `<b>✅ 支付成功！</b>

订单号：<code>${orderInfo.orderNo}</code>
产品：${escapeHtml(orderInfo.productName)}
金额：${formatPrice(orderInfo.amount)}`

  if (orderInfo.code) {
    text += `

<b>🔑 您的激活码：</b>
<code>${orderInfo.code}</code>`
  }

  text += `

<a href="${SITE_URL}/order/${orderInfo.orderNo}">查看订单详情</a>`

  await sendMessage(chatId, text, {
    disableWebPagePreview: true,
  })
}
