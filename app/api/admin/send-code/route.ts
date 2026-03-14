import { type NextRequest, NextResponse } from "next/server"
import { sendCodeMail } from "@/lib/resend"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { email, activationCode, orderNo, productId, productName, isManual, autoAssign } = body

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 })
    }

    // Check if order already has a code (prevent double-assignment for auto mode)
    if (orderNo && !isManual) {
      const existingOrder = await sql`
        SELECT code FROM orders WHERE out_trade_no = ${orderNo}
      `
      if (existingOrder.length > 0 && existingOrder[0].code) {
        return NextResponse.json(
          { error: `该订单已绑定激活码 "${existingOrder[0].code}"，不可重复自动发码。如需更换请使用手动发码。` },
          { status: 409 },
        )
      }
    }

    let codeToSend = activationCode

    // Auto-assign mode: server picks the correct product-matching code from DB
    if (autoAssign && !activationCode) {
      let availableCode

      // First try: match by product_id if order has one
      if (productId) {
        availableCode = await sql`
          SELECT id, code FROM activation_codes
          WHERE status = 'available' AND product_id = ${productId}
          ORDER BY created_at ASC
          LIMIT 1
        `
      }

      // If no product-specific code found, DO NOT fall back to a different product's code
      if (!availableCode || availableCode.length === 0) {
        if (productId) {
          // Order is tied to a specific product - don't send wrong product's code
          return NextResponse.json(
            { error: `该产品的激活码库存不足，请先导入对应产品的激活码` },
            { status: 400 },
          )
        }
        // No product specified - try any available code without a product_id (generic codes)
        availableCode = await sql`
          SELECT id, code FROM activation_codes
          WHERE status = 'available' AND product_id IS NULL
          ORDER BY created_at ASC
          LIMIT 1
        `
        if (!availableCode || availableCode.length === 0) {
          // Last resort: any available code
          availableCode = await sql`
            SELECT id, code FROM activation_codes
            WHERE status = 'available'
            ORDER BY created_at ASC
            LIMIT 1
          `
        }
      }

      if (!availableCode || availableCode.length === 0) {
        return NextResponse.json({ error: "没有可用的激活码，请先导入激活码" }, { status: 400 })
      }

      codeToSend = availableCode[0].code
    }

    if (!codeToSend) {
      return NextResponse.json({ error: "激活码不能为空" }, { status: 400 })
    }

    // For manual mode: warn if code belongs to a different product than the order
    if (isManual && orderNo && productId) {
      const codeInfo = await sql`
        SELECT product_id FROM activation_codes WHERE code = ${codeToSend}
      `
      if (codeInfo.length > 0 && codeInfo[0].product_id && codeInfo[0].product_id !== productId) {
        // Still allow it for manual mode, but log a warning
        console.warn("[v0] Manual send: code product_id mismatch", {
          codeProductId: codeInfo[0].product_id,
          orderProductId: productId,
          code: codeToSend,
          orderNo,
        })
      }
    }

    // For auto mode: verify the code is still available (race condition guard)
    if (!isManual) {
      const codeCheck = await sql`
        SELECT status FROM activation_codes WHERE code = ${codeToSend}
      `
      if (codeCheck.length > 0 && codeCheck[0].status !== "available") {
        return NextResponse.json(
          { error: `激活码 "${codeToSend}" 已被使用或已售出，请刷新后重试` },
          { status: 409 },
        )
      }
    }

    // Resolve product name if not provided
    let resolvedProductName = productName
    if (!resolvedProductName && orderNo) {
      const orderInfo = await sql`
        SELECT o.subject, p.name as product_name 
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        WHERE o.out_trade_no = ${orderNo}
      `
      if (orderInfo.length > 0) {
        resolvedProductName = orderInfo[0].product_name || orderInfo[0].subject || ""
      }
    }

    // Send the email
    await sendCodeMail({
      to: email,
      subject: resolvedProductName ? `${resolvedProductName} - 激活码已到账` : "您的激活码已到账",
      activationCode: codeToSend,
      orderNo: orderNo || "",
      productName: resolvedProductName || "",
    })

    // Update database only AFTER email is sent successfully
    if (orderNo) {
      try {
        // Mark activation code as sold in inventory
        await sql`
          UPDATE activation_codes 
          SET status = 'sold', sold_at = NOW()
          WHERE code = ${codeToSend} AND status = 'available'
        `

        // Update order: bind the activation code and mark as fulfilled
        await sql`
          UPDATE orders 
          SET code = ${codeToSend}, fulfilled_at = NOW(), updated_at = NOW()
          WHERE out_trade_no = ${orderNo}
        `
      } catch (dbError) {
        console.error("[v0] Database update error after email sent:", dbError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `激活码 ${codeToSend} 已发送至 ${email}`,
      code: codeToSend,
    })
  } catch (error) {
    console.error("[v0] Send code error:", error)
    return NextResponse.json(
      { error: "发送失败: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
