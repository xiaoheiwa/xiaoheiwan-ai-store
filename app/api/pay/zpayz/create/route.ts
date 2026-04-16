import { type NextRequest, NextResponse } from "next/server"
import { ZPayz } from "@/lib/zpayz-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderNo, amount, paymentType = "alipay", clientip, device } = body

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

    // 微信支付在手机端使用 API 方式（支持 JSAPI）
    if (paymentType === "wxpay" && clientip) {
      console.log("[v0] 使用微信 API 支付方式, clientip:", clientip, "device:", device)
      const apiResult = await ZPayz.createApiPayment({
        ...paymentParams,
        clientip,
        device: device || "mobile",
      })

      if (apiResult.code === 1 || apiResult.code === "1") {
        // API 返回成功，返回支付信息
        return NextResponse.json({
          success: true,
          paymentUrl: apiResult.payurl || apiResult.qrcode || apiResult.urlscheme,
          qrcode: apiResult.qrcode,
          orderNo,
          amount,
          apiResult,
        })
      } else {
        console.error("[v0] 微信 API 支付失败:", apiResult)
        return NextResponse.json({ 
          error: apiResult.msg || "微信支付创建失败", 
          details: apiResult 
        }, { status: 400 })
      }
    }

    // 支付宝或其他情况使用页面跳转方式
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
