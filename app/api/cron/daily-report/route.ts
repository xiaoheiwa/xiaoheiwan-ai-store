import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendTelegramMessage } from "@/lib/telegram.tsx"

const sql = neon(process.env.DATABASE_URL!)

// Verify the request is from Vercel Cron
function verifyCronRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  
  // Vercel Cron uses Bearer token
  if (authHeader === `Bearer ${cronSecret}`) {
    return true
  }
  
  // Also check x-vercel-cron header (Vercel sets this automatically)
  const vercelCron = request.headers.get("x-vercel-cron")
  if (vercelCron === "1") {
    return true
  }
  
  // Allow in development
  if (process.env.NODE_ENV === "development") {
    return true
  }
  
  return false
}

export async function GET(request: Request) {
  // Verify request
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get today's date range (China timezone UTC+8)
    const now = new Date()
    const chinaOffset = 8 * 60 * 60 * 1000
    const chinaTime = new Date(now.getTime() + chinaOffset)
    
    // Get start and end of today in China time
    const todayStart = new Date(chinaTime)
    todayStart.setUTCHours(0, 0, 0, 0)
    const todayEnd = new Date(chinaTime)
    todayEnd.setUTCHours(23, 59, 59, 999)
    
    // Convert back to UTC for database query
    const startUTC = new Date(todayStart.getTime() - chinaOffset)
    const endUTC = new Date(todayEnd.getTime() - chinaOffset)

    // Query today's paid orders
    const orders = await sql`
      SELECT 
        o.out_trade_no,
        o.subject,
        o.amount,
        o.quantity,
        o.pay_channel,
        o.paid_at,
        o.email
      FROM orders o
      WHERE o.status = 'paid'
        AND o.paid_at >= ${startUTC.toISOString()}
        AND o.paid_at < ${endUTC.toISOString()}
      ORDER BY o.paid_at DESC
    `

    // Calculate statistics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.amount || "0"), 0)
    const totalQuantity = orders.reduce((sum, o) => sum + (o.quantity || 1), 0)

    // Group by product
    const productStats: Record<string, { count: number; revenue: number; quantity: number }> = {}
    orders.forEach((order) => {
      const product = order.subject || "未知商品"
      if (!productStats[product]) {
        productStats[product] = { count: 0, revenue: 0, quantity: 0 }
      }
      productStats[product].count++
      productStats[product].revenue += parseFloat(order.amount || "0")
      productStats[product].quantity += order.quantity || 1
    })

    // Group by payment channel
    const channelStats: Record<string, { count: number; revenue: number }> = {}
    orders.forEach((order) => {
      const channel = order.pay_channel || "未知"
      if (!channelStats[channel]) {
        channelStats[channel] = { count: 0, revenue: 0 }
      }
      channelStats[channel].count++
      channelStats[channel].revenue += parseFloat(order.amount || "0")
    })

    // Format date for display
    const dateStr = `${chinaTime.getFullYear()}-${String(chinaTime.getMonth() + 1).padStart(2, "0")}-${String(chinaTime.getDate()).padStart(2, "0")}`

    // Build message
    let message = `
<b>📊 每日销售报告</b>
<b>日期:</b> ${dateStr}

<b>📈 今日概况</b>
• 订单数: ${totalOrders} 笔
• 销售额: ¥${totalRevenue.toFixed(2)}
• 销售数量: ${totalQuantity} 个
`

    // Add product breakdown if there are orders
    if (totalOrders > 0) {
      message += `\n<b>🛒 商品明细</b>\n`
      Object.entries(productStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .forEach(([product, stats]) => {
          message += `• ${product}: ${stats.count}笔 / ¥${stats.revenue.toFixed(2)}\n`
        })

      message += `\n<b>💳 支付渠道</b>\n`
      Object.entries(channelStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .forEach(([channel, stats]) => {
          const channelName = channel === "alipay" ? "支付宝" : channel === "wechat" ? "微信" : channel === "crypto" ? "加密货币" : channel
          message += `• ${channelName}: ${stats.count}笔 / ¥${stats.revenue.toFixed(2)}\n`
        })
    } else {
      message += `\n<i>今日暂无订单</i>`
    }

    // Send to Telegram
    const sent = await sendTelegramMessage(message.trim())

    return NextResponse.json({
      success: true,
      sent,
      date: dateStr,
      stats: {
        totalOrders,
        totalRevenue,
        totalQuantity,
        productStats,
        channelStats,
      },
    })
  } catch (error) {
    console.error("Daily report error:", error)
    return NextResponse.json(
      { error: "Failed to generate daily report" },
      { status: 500 }
    )
  }
}
