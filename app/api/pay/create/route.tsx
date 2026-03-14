import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"
import { getEnv } from "@/lib/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const sql = neon(getEnv("DATABASE_URL")!)

export async function POST(request: NextRequest) {
  console.log("[v0] Order create API called with Node runtime")

  try {
    if (!getEnv("DATABASE_URL")) {
      console.error("[v0] DATABASE_URL environment variable is missing")
      return NextResponse.json(
        {
          error: "数据库配置错误",
          details: "DATABASE_URL not configured",
        },
        { status: 500 },
      )
    }

    const body = await request.json()
    console.log("[v0] Request body:", body)

    const { email, paymentMethod, amount } = body

    if (!email || !paymentMethod) {
      console.log("[v0] Missing required fields:", { email, paymentMethod })
      return NextResponse.json({ error: "邮箱和支付方式不能为空" }, { status: 400 })
    }

    let currentPrice = 99
    try {
      const priceResult = await sql`
        SELECT price FROM price_config WHERE id = 1
      `
      if (priceResult && priceResult[0]) {
        currentPrice = Number.parseFloat(priceResult[0].price) || 99
      }
    } catch (priceError) {
      console.error("[v0] Error fetching price:", priceError)
    }

    const finalAmount = amount || currentPrice
    const orderNo = `AC${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    console.log("[v0] Creating order:", { orderNo, email, finalAmount, paymentMethod })

    await sql`
      INSERT INTO orders (out_trade_no, email, amount, subject, status, pay_channel, created_at, updated_at)
      VALUES (${orderNo}, ${email}, ${finalAmount}, '激活码购买', 'pending', ${paymentMethod}, NOW(), NOW())
    `

    const paymentData = {
      pid: "2729",
      type: "alipay",
      out_trade_no: orderNo,
      notify_url: `${getEnv("SITE_BASE")}/api/pay/notify`,
      return_url: `${getEnv("SITE_BASE")}/success?orderNo=${orderNo}`,
      name: "激活码购买",
      money: finalAmount.toString(),
      sitename: "激活码商城",
    }

    // Generate signature
    const signStr =
      Object.keys(paymentData)
        .sort()
        .map((key) => `${key}=${paymentData[key as keyof typeof paymentData]}`)
        .join("&") + getEnv("EPAY_KEY")

    const paymentForm = `
      <form id="paymentForm" action="https://code.ymyu.cn/submit.php" method="post">
        ${Object.entries(paymentData)
          .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
          .join("")}
        <input type="hidden" name="sign" value="${crypto.createHash("md5").update(signStr).digest("hex")}">
        <input type="hidden" name="sign_type" value="MD5">
      </form>
      <script>document.getElementById('paymentForm').submit();</script>
    `

    console.log("[v0] Order created successfully:", orderNo)
    console.log("[v0] Payment URLs:", {
      notify_url: paymentData.notify_url,
      return_url: paymentData.return_url,
    })

    return NextResponse.json({
      success: true,
      orderNo,
      paymentUrl: "https://code.ymyu.cn/submit.php",
      paymentForm,
    })
  } catch (error) {
    console.error("[v0] Error in order create API:", error)
    return NextResponse.json(
      {
        error: "创建订单失败",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
