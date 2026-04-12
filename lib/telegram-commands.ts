"use strict"

/**
 * Telegram Bot 命令处理器
 * 处理 /start, /products, /order, /help 等命令
 */

import { neon } from "@neondatabase/serverless"
import {
  sendMessage,
  editMessage,
  answerCallbackQuery,
  buildInlineKeyboard,
  kb,
  formatPrice,
  escapeHtml,
  type TelegramMessage,
  type TelegramCallbackQuery,
} from "./telegram-bot"

const sql = neon(process.env.DATABASE_URL!)

// 站点配置
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://upgrade.xiaoheiwan.com"
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID

// ==================== 主入口函数 ====================

/**
 * 处理用户发送的消息
 * 这是 Webhook 调用的入口函数
 */
export async function handleUserCommand(message: TelegramMessage) {
  const text = message.text || ""
  const chatId = message.chat.id
  
  console.log("[v0] handleUserCommand called, chatId:", chatId, "text:", text)
  
  // 解析命令
  if (text.startsWith("/start")) {
    await handleStart(message)
  } else if (text.startsWith("/products")) {
    await handleProducts(message)
  } else if (text.startsWith("/order")) {
    const args = text.replace(/^\/order\s*/, "").trim()
    await handleOrder(message, args)
  } else if (text.startsWith("/help")) {
    await handleHelp(message)
  } else if (text.startsWith("/buy")) {
    const productId = text.replace(/^\/buy\s*/, "").trim()
    if (productId) {
      await startPurchase(chatId, productId)
    } else {
      await sendMessage(chatId, "请指定产品ID，例如：/buy 产品ID\n\n发送 /products 查看产品列表")
    }
  } else {
    // 检查是否在等待用户输入（如邮箱）
    const handled = await handlePendingInput(message)
    if (!handled) {
      // 未识别的消息，显示帮助
      await sendMessage(chatId, `抱歉，我不太理解您的意思。\n\n发送 /help 查看可用命令。`)
    }
  }
}



// ==================== 辅助函数 ====================

// 发起购买流程（用于 /buy 命令和按钮点击）
async function startPurchase(chatId: number, productId: string) {
  const products = await sql`
    SELECT p.*, pc.name as category_name
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.id = ${productId}
  `

  if (products.length === 0) {
    await sendMessage(chatId, "产品不存在，请重新选择。\n\n发送 /products 查看产品列表")
    return
  }

  const p = products[0]
  
  // 生成购买链接（直接跳转网站支付）
  const buyUrl = `${SITE_URL}/purchase?product=${productId}&from=telegram&chat_id=${chatId}`
  
  const text = `<b>购买 ${escapeHtml(p.name)}</b>

价格：${formatPrice(Number(p.price))}

请点击下方按钮跳转到支付页面完成购买。
支付成功后，激活码将自动发送到此对话。`

  await sendMessage(chatId, text, {
    replyMarkup: buildInlineKeyboard([
      [kb.url("前往支付", buyUrl)],
      [kb.callback("查看其他产品", "cmd:products")],
    ])
  })
}

// 处理待输入状态（目前暂不使用，保留扩展）
async function handlePendingInput(message: TelegramMessage): Promise<boolean> {
  // 暂时不处理待输入状态，直接返回 false
  // 未来可扩展：邮箱输入、订单号输入等
  return false
}

// ==================== 命令处理 ====================

// /start 命令 - 欢迎消息
export async function handleStart(message: TelegramMessage) {
  const chatId = message.chat.id
  const firstName = message.from?.first_name || "用户"
  
  // 保存用户信息
  await saveUser(message)
  
  const text = `欢迎使用小黑丸 AI 服务商店！

${firstName}，我可以帮你：
• 浏览和购买 AI 会员服务
• 查询订单状态和激活码
• 联系客服获取帮助

点击下方按钮开始：`

  const keyboard = buildInlineKeyboard([
    [kb.callback("浏览产品", "cmd:products")],
    [kb.callback("查询订单", "cmd:order_input"), kb.callback("帮助说明", "cmd:help")],
    [kb.url("访问网站", SITE_URL), kb.url("联系客服", "https://t.me/jialiao2025")],
  ])

  await sendMessage(chatId, text, { replyMarkup: keyboard })
}

// /products 命令 - 产品分类列表
export async function handleProducts(message: TelegramMessage) {
  const chatId = message.chat.id
  await showCategories(chatId)
}

// /order 命令 - 订单查询
export async function handleOrder(message: TelegramMessage, args: string) {
  const chatId = message.chat.id
  
  if (!args) {
    await sendMessage(chatId, `请输入订单号查询：

格式：<code>/order 订单号</code>

例如：<code>/order XH1234567890</code>

或点击下方按钮输入邮箱查询所有订单：`, {
      replyMarkup: buildInlineKeyboard([
        [kb.callback("输入邮箱查询", "cmd:order_by_email")],
      ])
    })
    return
  }
  
  await queryOrder(chatId, args.trim())
}

// /help 命令 - 帮助说明
export async function handleHelp(message: TelegramMessage) {
  const chatId = message.chat.id
  
  const text = `<b>小黑丸 Bot 使用帮助</b>

<b>可用命令：</b>
/start - 显示主菜单
/products - 浏览产品列表
/order 订单号 - 查询订单状态
/help - 显示本帮助

<b>购买流程：</b>
1. 发送 /products 浏览产品
2. 选择分类和产品
3. 点击购买，输入邮箱
4. 跳转支付页面完成支付
5. 支付成功后自动收到激活码

<b>客服时间：</b>
08:00 - 24:00

如有问题请联系 @jialiao2025`

  await sendMessage(chatId, text, {
    replyMarkup: buildInlineKeyboard([
      [kb.callback("返回主菜单", "cmd:start")],
    ])
  })
}

// ==================== Callback Query 处理 ====================

export async function handleCallbackQuery(query: TelegramCallbackQuery) {
  const chatId = query.message?.chat.id
  const messageId = query.message?.message_id
  const data = query.data
  
  if (!chatId || !messageId || !data) {
    await answerCallbackQuery(query.id)
    return
  }

  // 先回应 callback，避免加载图标
  await answerCallbackQuery(query.id)

  // 解析 callback_data
  const [action, ...params] = data.split(":")
  
  switch (action) {
    case "cmd":
      await handleCommandCallback(chatId, messageId, params[0])
      break
    case "cat":
      await showCategoryProducts(chatId, messageId, params[0])
      break
    case "prod":
      await showProductDetail(chatId, messageId, params[0])
      break
    case "buy":
      await initiatePurchase(chatId, messageId, params[0])
      break
    case "back":
      await handleBack(chatId, messageId, params[0])
      break
    default:
      console.log("[Telegram Bot] Unknown callback:", data)
  }
}

// 命令类 callback
async function handleCommandCallback(chatId: number, messageId: number, cmd: string) {
  switch (cmd) {
    case "start":
      await showMainMenu(chatId, messageId)
      break
    case "products":
      await showCategories(chatId, messageId)
      break
    case "help":
      await showHelp(chatId, messageId)
      break
    case "order_input":
      await promptOrderInput(chatId)
      break
    case "order_by_email":
      await promptEmailInput(chatId)
      break
  }
}

// ==================== 显示功能 ====================

// 显示主菜单
async function showMainMenu(chatId: number, messageId?: number) {
  const text = `小黑丸 AI 服务商店

我可以帮你：
• 浏览和购买 AI 会员服务
• 查询订单状态和激活码
• 联系客服获取帮助

点击下方按钮开始：`

  const keyboard = buildInlineKeyboard([
    [kb.callback("浏览产品", "cmd:products")],
    [kb.callback("查询订单", "cmd:order_input"), kb.callback("帮助说明", "cmd:help")],
    [kb.url("访问网站", SITE_URL), kb.url("联系客服", "https://t.me/jialiao2025")],
  ])

  if (messageId) {
    await editMessage(chatId, messageId, text, { replyMarkup: keyboard })
  } else {
    await sendMessage(chatId, text, { replyMarkup: keyboard })
  }
}

// 显示产品分类
async function showCategories(chatId: number, messageId?: number) {
  const categories = await sql`
    SELECT id, name, slug, description 
    FROM product_categories 
    WHERE is_active = true 
    ORDER BY sort_order ASC
  `

  if (categories.length === 0) {
    const text = "暂无可用产品分类"
    if (messageId) {
      await editMessage(chatId, messageId, text)
    } else {
      await sendMessage(chatId, text)
    }
    return
  }

  const text = `<b>选择产品分类</b>

请点击分类查看产品：`

  const buttons = categories.map((cat) => [
    kb.callback(cat.name, `cat:${cat.id}`)
  ])
  buttons.push([kb.callback("返回主菜单", "cmd:start")])

  const keyboard = buildInlineKeyboard(buttons)

  if (messageId) {
    await editMessage(chatId, messageId, text, { replyMarkup: keyboard })
  } else {
    await sendMessage(chatId, text, { replyMarkup: keyboard })
  }
}

// 显示分类下的产品
async function showCategoryProducts(chatId: number, messageId: number, categoryId: string) {
  const category = await sql`
    SELECT name FROM product_categories WHERE id = ${categoryId}
  `
  
  const products = await sql`
    SELECT p.id, p.name, p.price, p.description,
           COALESCE((SELECT COUNT(*) FROM activation_codes ac WHERE ac.product_id = p.id AND ac.status = 'available'), 0) as stock
    FROM products p
    WHERE p.category_id = ${categoryId}
    ORDER BY p.sort_order ASC
  `

  if (products.length === 0) {
    await editMessage(chatId, messageId, "该分类暂无产品", {
      replyMarkup: buildInlineKeyboard([[kb.callback("返回分类", "cmd:products")]])
    })
    return
  }

  const categoryName = category[0]?.name || "产品"
  let text = `<b>${escapeHtml(categoryName)}</b>\n\n`

  products.forEach((p, i) => {
    const stockText = p.stock > 0 ? `库存: ${p.stock}` : "库存: 手工发货"
    text += `${i + 1}. <b>${escapeHtml(p.name)}</b>\n`
    text += `   ${formatPrice(Number(p.price))} | ${stockText}\n\n`
  })

  const buttons = products.map((p) => [
    kb.callback(`${p.name} - ${formatPrice(Number(p.price))}`, `prod:${p.id}`)
  ])
  buttons.push([kb.callback("返回分类列表", "cmd:products")])

  await editMessage(chatId, messageId, text, {
    replyMarkup: buildInlineKeyboard(buttons)
  })
}

// 显示产品详情
async function showProductDetail(chatId: number, messageId: number, productId: string) {
  const products = await sql`
    SELECT p.*, pc.name as category_name,
           COALESCE((SELECT COUNT(*) FROM activation_codes ac WHERE ac.product_id = p.id AND ac.status = 'available'), 0) as stock
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.id = ${productId}
  `

  if (products.length === 0) {
    await editMessage(chatId, messageId, "产品不存在", {
      replyMarkup: buildInlineKeyboard([[kb.callback("返回", "cmd:products")]])
    })
    return
  }

  const p = products[0]
  const isManual = p.delivery_type === "manual"
  const stockText = isManual ? "手工发货 (24小时内)" : (p.stock > 0 ? `有货 (${p.stock}件)` : "缺货")

  let text = `<b>${escapeHtml(p.name)}</b>\n\n`
  text += `分类：${escapeHtml(p.category_name || "未分类")}\n`
  text += `价格：<b>${formatPrice(Number(p.price))}</b>\n`
  text += `库存：${stockText}\n\n`
  
  if (p.description) {
    text += `${escapeHtml(p.description)}\n\n`
  }

  const buttons = [
    [kb.callback(`立即购买 ${formatPrice(Number(p.price))}`, `buy:${p.id}`)],
    [kb.callback("返回产品列表", `cat:${p.category_id}`)],
  ]

  await editMessage(chatId, messageId, text, {
    replyMarkup: buildInlineKeyboard(buttons)
  })
}

// 发起购买
async function initiatePurchase(chatId: number, messageId: number, productId: string) {
  const products = await sql`
    SELECT p.*, pc.name as category_name
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.id = ${productId}
  `

  if (products.length === 0) {
    await editMessage(chatId, messageId, "产品不存在")
    return
  }

  const p = products[0]
  
  // 生成购买链接
  const buyUrl = `${SITE_URL}/purchase?product=${productId}&from=telegram&chat_id=${chatId}`
  
  const text = `<b>购买 ${escapeHtml(p.name)}</b>

价格：${formatPrice(Number(p.price))}

请点击下方按钮跳转到支付页面完成购买。
支付成功后，激活码将自动发送到此对话。`

  await editMessage(chatId, messageId, text, {
    replyMarkup: buildInlineKeyboard([
      [kb.url("前往支付", buyUrl)],
      [kb.callback("返回产品详情", `prod:${productId}`)],
    ])
  })
}

// 显示帮助
async function showHelp(chatId: number, messageId: number) {
  const text = `<b>小黑丸 Bot 使用帮助</b>

<b>可用命令：</b>
/start - 显示主菜单
/products - 浏览产品列表
/order 订单号 - 查询订单状态
/help - 显示本帮助

<b>购买流程：</b>
1. 点击 "浏览产品" 选择商品
2. 点击购买跳转支付页面
3. 填写邮箱并完成支付
4. 激活码自动发送到此对话

<b>客服时间：</b>08:00 - 24:00`

  await editMessage(chatId, messageId, text, {
    replyMarkup: buildInlineKeyboard([
      [kb.callback("返回主菜单", "cmd:start")],
    ])
  })
}

// 提示输入订单号
async function promptOrderInput(chatId: number) {
  await sendMessage(chatId, `请发送订单号查询：

格式：<code>/order 订单号</code>

例如：<code>/order XH1234567890</code>`)
}

// 提示输入邮箱
async function promptEmailInput(chatId: number) {
  await sendMessage(chatId, `请发送邮箱查询所有订单：

直接发送您购买时使用的邮箱地址即可。`)
}

// 查询订单
async function queryOrder(chatId: number, orderNo: string) {
  const orders = await sql`
    SELECT o.*, p.name as product_name
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.order_no = ${orderNo}
  `

  if (orders.length === 0) {
    await sendMessage(chatId, `未找到订单 <code>${escapeHtml(orderNo)}</code>

请检查订单号是否正确。`, {
      replyMarkup: buildInlineKeyboard([
        [kb.callback("返回主菜单", "cmd:start")],
      ])
    })
    return
  }

  const o = orders[0]
  const statusMap: Record<string, string> = {
    pending: "待支付",
    paid: "已支付",
    completed: "已完成",
    cancelled: "已取消",
    refunded: "已退款",
  }

  let text = `<b>订单详情</b>\n\n`
  text += `订单号：<code>${o.order_no}</code>\n`
  text += `产品：${escapeHtml(o.product_name || "未知")}\n`
  text += `金额：${formatPrice(Number(o.amount))}\n`
  text += `状态：${statusMap[o.status] || o.status}\n`
  text += `邮箱：${o.email}\n`
  text += `时间：${new Date(o.created_at).toLocaleString("zh-CN")}\n\n`

  if (o.code && o.status === "completed") {
    text += `<b>激活码：</b>\n<code>${o.code}</code>\n\n`
    text += `前往激活：${SITE_URL}/activate`
  } else if (o.status === "pending") {
    text += `订单待支付，请完成支付。`
  } else if (o.status === "paid" && !o.code) {
    text += `订单已支付，激活码正在处理中...`
  }

  await sendMessage(chatId, text, {
    replyMarkup: buildInlineKeyboard([
      [kb.callback("返回主菜单", "cmd:start")],
    ])
  })
}

// 返回处理
async function handleBack(chatId: number, messageId: number, target: string) {
  switch (target) {
    case "main":
      await showMainMenu(chatId, messageId)
      break
    case "categories":
      await showCategories(chatId, messageId)
      break
    default:
      await showMainMenu(chatId, messageId)
  }
}

// ==================== 用户管理 ====================

// 保存用户信息
async function saveUser(message: TelegramMessage) {
  const chatId = message.chat.id.toString()
  const username = message.from?.username || null
  const firstName = message.from?.first_name || null
  
  try {
    await sql`
      INSERT INTO telegram_users (chat_id, username, first_name, last_active_at)
      VALUES (${chatId}, ${username}, ${firstName}, NOW())
      ON CONFLICT (chat_id) 
      DO UPDATE SET 
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_active_at = NOW()
    `
  } catch (error) {
    // 表可能不存在，忽略错误
    console.log("[Telegram Bot] Failed to save user:", error)
  }
}

// ==================== 通知功能 ====================

// 发送订单完成通知 (支付成功后调用)
export async function notifyOrderComplete(chatId: string, order: {
  orderNo: string
  productName: string
  amount: number
  code?: string
  activateUrl?: string
}) {
  let text = `<b>支付成功！</b>\n\n`
  text += `订单号：<code>${order.orderNo}</code>\n`
  text += `产品：${escapeHtml(order.productName)}\n`
  text += `金额：${formatPrice(order.amount)}\n\n`

  if (order.code) {
    text += `<b>激活码：</b>\n<code>${order.code}</code>\n\n`
    if (order.activateUrl) {
      text += `前往激活：${order.activateUrl}`
    }
  } else {
    text += `激活码将在处理后发送给您。`
  }

  await sendMessage(chatId, text, {
    replyMarkup: buildInlineKeyboard([
      [kb.url("前往激活", order.activateUrl || `${SITE_URL}/activate`)],
      [kb.callback("查看更多产品", "cmd:products")],
    ])
  })
}

// 通知管理员新订单
export async function notifyAdminNewOrder(order: {
  orderNo: string
  productName: string
  amount: number
  email: string
  telegramChatId?: string
}) {
  if (!ADMIN_CHAT_ID) return

  let text = `<b>新订单通知</b>\n\n`
  text += `订单号：<code>${order.orderNo}</code>\n`
  text += `产品：${escapeHtml(order.productName)}\n`
  text += `金额：${formatPrice(order.amount)}\n`
  text += `邮箱：${order.email}\n`
  if (order.telegramChatId) {
    text += `Telegram: ${order.telegramChatId}\n`
  }

  await sendMessage(ADMIN_CHAT_ID, text)
}
