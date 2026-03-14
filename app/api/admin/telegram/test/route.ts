import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/admin-auth"
import { notifyOrderSuccess, notifyLowStock, notifyCryptoPending, sendTelegramMessage } from "@/lib/telegram"
import { neon } from "@neondatabase/serverless"

export async function POST(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { type } = await request.json()

    if (type === "order") {
      // Test order success notification
      await notifyOrderSuccess({
        orderNo: "TEST" + Date.now(),
        email: "test@example.com",
        amount: 99.99,
        productName: "测试商品",
        quantity: 1,
        paymentMethod: "alipay",
        codes: ["TEST-CODE-123"],
      })
      return NextResponse.json({ success: true, message: "订单成功通知已发送" })
    }

    if (type === "stock") {
      // Test low stock notification
      await notifyLowStock({
        productId: "test-product-id",
        productName: "测试商品",
        remaining: 5,
        threshold: 10,
      })
      return NextResponse.json({ success: true, message: "库存预警通知已发送" })
    }

    if (type === "crypto") {
      // Test crypto pending notification
      await notifyCryptoPending({
        orderNo: "CRYPTO-TEST" + Date.now(),
        email: "test@example.com",
        amount: 99.99,
        usdtAmount: "13.89",
        productName: "测试商品",
        txHash: "0x1234567890abcdef1234567890abcdef12345678",
      })
      return NextResponse.json({ success: true, message: "USDT待验证通知已发送" })
    }

    if (type === "daily-report") {
      // Generate daily sales report directly
      const sql = neon(process.env.DATABASE_URL!)
      
      // Get today's date range (China timezone UTC+8)
      const now = new Date()
      const chinaOffset = 8 * 60 * 60 * 1000
      const chinaTime = new Date(now.getTime() + chinaOffset)
      
      const todayStart = new Date(chinaTime)
      todayStart.setUTCHours(0, 0, 0, 0)
      const todayEnd = new Date(chinaTime)
      todayEnd.setUTCHours(23, 59, 59, 999)
      
      const startUTC = new Date(todayStart.getTime() - chinaOffset)
      const endUTC = new Date(todayEnd.getTime() - chinaOffset)

      const orders = await sql`
        SELECT subject, amount, quantity, pay_channel
        FROM orders
        WHERE status = 'paid'
          AND paid_at >= ${startUTC.toISOString()}
          AND paid_at < ${endUTC.toISOString()}
      `

      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.amount || "0"), 0)
      const totalQuantity = orders.reduce((sum, o) => sum + (o.quantity || 1), 0)

      const productStats: Record<string, { count: number; revenue: number }> = {}
      orders.forEach((order) => {
        const product = order.subject || "未知商品"
        if (!productStats[product]) productStats[product] = { count: 0, revenue: 0 }
        productStats[product].count++
        productStats[product].revenue += parseFloat(order.amount || "0")
      })

      const channelStats: Record<string, { count: number; revenue: number }> = {}
      orders.forEach((order) => {
        const channel = order.pay_channel || "未知"
        if (!channelStats[channel]) channelStats[channel] = { count: 0, revenue: 0 }
        channelStats[channel].count++
        channelStats[channel].revenue += parseFloat(order.amount || "0")
      })

      const dateStr = `${chinaTime.getFullYear()}-${String(chinaTime.getMonth() + 1).padStart(2, "0")}-${String(chinaTime.getDate()).padStart(2, "0")}`

      let message = `
<b>📊 每日销售报告</b>
<b>日期:</b> ${dateStr}

<b>📈 今日概况</b>
• 订单数: ${totalOrders} 笔
• 销售额: ¥${totalRevenue.toFixed(2)}
• 销售数量: ${totalQuantity} 个
`
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

      const sent = await sendTelegramMessage(message.trim())
      if (sent) {
        return NextResponse.json({ success: true, message: "每日销售报告已发送" })
      } else {
        return NextResponse.json({ error: "Telegram 发送失败" }, { status: 500 })
      }
    }

    // Default: send all test notifications
    await notifyOrderSuccess({
      orderNo: "TEST" + Date.now(),
      email: "test@example.com",
      amount: 99.99,
      productName: "测试商品",
      quantity: 1,
      paymentMethod: "alipay",
    })

    return NextResponse.json({ success: true, message: "测试通知已发送到Telegram" })
  } catch (error) {
    console.error("Telegram test error:", error)
    return NextResponse.json({ 
      error: "发送失败", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
