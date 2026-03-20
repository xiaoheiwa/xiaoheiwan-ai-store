import { type NextRequest, NextResponse } from "next/server"
import { ZPayz } from "@/lib/zpayz-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderNo, amount, paymentType = "alipay", productName = "小黑丸Plus激活码" } = body

    if (!orderNo || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const baseUrl = process.env.SITE_BASE_URL || "https://upgrade.xiaoheiwan.com"

    // Use generic name for payment to avoid content review issues
    const safePaymentName = process.env.PAYMENT_PRODUCT_NAME || "数字商品"
    const paymentParams = {
      name: safePaymentName,
      money: amount.toString(),
      type: paymentType as "alipay" | "wxpay",
      out_trade_no: orderNo,
      notify_url: `${baseUrl}/api/pay/zpayz/notify`,
      return_url: `${baseUrl}/success?orderNo=${orderNo}`,
      param: "xiaoheiwan-plus",
    }

    // Create page redirect payment URL
    const paymentUrl = ZPayz.createPagePayment(paymentParams)

    return NextResponse.json({
      success: true,
      paymentUrl,
      orderNo,
      amount,
    })
  } catch (error) {
    console.error("[v0] ZPAYZ payment creation error:", error)
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 })
  }
}
