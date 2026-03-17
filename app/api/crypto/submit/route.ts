import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { notifyCryptoPending, notifyOrderSuccess, notifyLowStock } from "@/lib/telegram"
import { verifyUsdtTransaction } from "@/lib/tron-verify"
import { sendCodeMail } from "@/lib/resend"

const sql = neon(process.env.DATABASE_URL!)

// Get USDT exchange rate from database or use default
async function getUsdtRate(): Promise<number> {
  try {
    const result = await sql`SELECT value FROM site_config WHERE key = 'usdt_cny_rate' LIMIT 1`
    if (result.length > 0 && result[0].value) {
      return Number(result[0].value)
    }
  } catch (e) {
    console.error("Failed to get USDT rate from DB:", e)
  }
  return Number(process.env.USDT_CNY_RATE || 7.2)
}

export async function POST(request: Request) {
  try {
    const { orderNo, txHash } = await request.json()

    if (!orderNo || !txHash) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // Validate tx hash format (TRC20 tx hash is 64 hex characters)
    const cleanTxHash = txHash.trim()
    if (!/^[a-fA-F0-9]{64}$/.test(cleanTxHash)) {
      return NextResponse.json({ error: "无效的交易哈希格式" }, { status: 400 })
    }

    // Check if order exists and is pending
    const orders = await sql`
      SELECT * FROM orders WHERE out_trade_no = ${orderNo}
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }

    const order = orders[0]
    
    if (order.status !== "pending") {
      return NextResponse.json({ error: "订单状态无效" }, { status: 400 })
    }

    // SECURITY: Check if this tx hash has been used for another order
    const existingTx = await sql`
      SELECT out_trade_no FROM orders 
      WHERE crypto_tx_hash = ${cleanTxHash} 
      AND out_trade_no != ${orderNo}
      LIMIT 1
    `
    if (existingTx.length > 0) {
      console.error("[v0] SECURITY: Duplicate tx hash detected!", { txHash, orderNo, existingOrder: existingTx[0].out_trade_no })
      return NextResponse.json({ error: "该交易哈希已被使用" }, { status: 400 })
    }

    // Calculate expected USDT amount from database rate
    const rate = await getUsdtRate()
    const expectedUsdt = Number(order.amount) / rate
    const walletAddress = process.env.USDT_WALLET_ADDRESS

    // Update order with tx hash first
    await sql`
      UPDATE orders SET 
        crypto_tx_hash = ${cleanTxHash},
        crypto_status = 'submitted',
        updated_at = NOW()
      WHERE out_trade_no = ${orderNo}
    `

    // Try auto-verification if wallet address is configured
    if (walletAddress) {
      const verifyResult = await verifyUsdtTransaction(
        cleanTxHash,
        walletAddress,
        expectedUsdt,
        0.02 // 2% tolerance
      )

      if (verifyResult.success) {
        // Auto-verify successful - process order automatically
        const quantity = order.quantity || 1

        // Update order status to paid
        await sql`
          UPDATE orders SET 
            status = 'paid',
            crypto_status = 'verified',
            paid_at = NOW(),
            updated_at = NOW()
          WHERE out_trade_no = ${orderNo}
        `

        // Handle auto delivery
        if (order.delivery_type !== "manual") {
          // Get available codes
          let codesQuery
          if (order.product_id) {
            codesQuery = await sql`
              SELECT id, code FROM activation_codes 
              WHERE status = 'available' 
              AND (product_id = ${order.product_id} OR product_id IS NULL)
              ORDER BY product_id DESC NULLS LAST, created_at ASC
              LIMIT ${quantity}
            `
          } else {
            codesQuery = await sql`
              SELECT id, code FROM activation_codes 
              WHERE status = 'available' 
              ORDER BY created_at ASC
              LIMIT ${quantity}
            `
          }

          if (codesQuery.length >= quantity) {
            const codes = codesQuery.map((c: any) => c.code)
            const codeIds = codesQuery.map((c: any) => c.id)

            // Mark codes as used
            await sql`
              UPDATE activation_codes SET 
                status = 'used',
                used_at = NOW(),
                used_by_order = ${orderNo}
              WHERE id = ANY(${codeIds})
            `

            // Update order with codes
            await sql`
              UPDATE orders SET 
                activation_code = ${codes.join(", ")},
                fulfilled_at = NOW()
              WHERE out_trade_no = ${orderNo}
            `

            // Send email
            try {
              await sendCodeMail({
                to: order.email,
                orderNo,
                codes,
                productName: order.product_name || order.subject,
              })
            } catch (emailErr) {
              console.error("Email send failed:", emailErr)
            }

            // Send Telegram notification
            try {
              await notifyOrderSuccess({
                orderNo,
                email: order.email,
                amount: Number(order.amount),
                productName: order.product_name || order.subject,
                quantity,
                paymentMethod: "usdt",
                codes,
                regionName: order.region_name || undefined,
              })

              // Check stock
              if (order.product_id) {
                const stockResult = await sql`
                  SELECT COUNT(*) as count FROM activation_codes 
                  WHERE status = 'available' 
                  AND (product_id = ${order.product_id} OR product_id IS NULL)
                `
                const remaining = Number(stockResult[0]?.count || 0)
                if (remaining <= 10) {
                  await notifyLowStock({
                    productId: order.product_id,
                    productName: order.product_name,
                    remaining,
                    threshold: 10,
                  })
                }
              }
            } catch (tgErr) {
              console.error("Telegram notification failed:", tgErr)
            }

            return NextResponse.json({ 
              success: true, 
              verified: true,
              message: "支付已自动验证，激活码已发送到您的邮箱" 
            })
          }
        }

        // Manual delivery order - just mark as paid
        try {
          await notifyOrderSuccess({
            orderNo,
            email: order.email,
            amount: Number(order.amount),
            productName: order.product_name || order.subject,
            quantity,
            paymentMethod: "usdt",
            regionName: order.region_name || undefined,
          })
        } catch (tgErr) {
          console.error("Telegram notification failed:", tgErr)
        }

        return NextResponse.json({ 
          success: true, 
          verified: true,
          message: "支付已自动验证，订单正在处理中" 
        })
      } else {
        // Verification failed - notify admin for manual check
        try {
          await notifyCryptoPending({
            orderNo,
            email: order.email,
            amount: Number(order.amount),
            usdtAmount: expectedUsdt.toFixed(2),
            productName: order.product_name || order.subject,
            txHash: cleanTxHash,
            verifyError: verifyResult.error,
          })
        } catch (tgErr) {
          console.error("Telegram notification failed:", tgErr)
        }

        return NextResponse.json({ 
          success: true, 
          verified: false,
          message: verifyResult.error || "交易验证中，请等待人工确认"
        })
      }
    }

    // No wallet configured - just notify admin
    try {
      await notifyCryptoPending({
        orderNo,
        email: order.email,
        amount: Number(order.amount),
        usdtAmount: expectedUsdt.toFixed(2),
        productName: order.product_name || order.subject,
        txHash: cleanTxHash,
      })
    } catch (tgError) {
      console.error("Telegram notification failed:", tgError)
    }

    return NextResponse.json({ success: true, message: "交易哈希已提交，等待人工确认" })
  } catch (error: any) {
    console.error("Crypto submit error:", error)
    return NextResponse.json({ error: error?.message || "提交失败" }, { status: 500 })
  }
}
