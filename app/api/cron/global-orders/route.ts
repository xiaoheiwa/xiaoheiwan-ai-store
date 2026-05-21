import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function verifyCronRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  if (request.headers.get("x-vercel-cron") === "1") return true
  if (process.env.NODE_ENV === "development") return true
  return false
}

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const pendingOrders = await sql`
      SELECT out_trade_no, payment_expired_at
      FROM orders
      WHERE COALESCE(NULLIF(market, ''), 'CN') = 'GLOBAL'
        AND status = 'pending'
        AND COALESCE(NULLIF(payment_status, ''), 'unpaid') IN ('unpaid', 'confirming')
        AND payment_expired_at IS NOT NULL
      ORDER BY created_at ASC
      LIMIT 200
    `

    const now = Date.now()
    const expiredOrderNos = pendingOrders
      .filter((order: any) => {
        const expiresAt = new Date(order.payment_expired_at).getTime()
        return Number.isFinite(expiresAt) && expiresAt <= now
      })
      .map((order: any) => order.out_trade_no)

    if (expiredOrderNos.length > 0) {
      await sql`
        UPDATE orders
        SET status = 'expired',
            payment_status = 'expired',
            delivery_status = 'not_delivered',
            manual_review_reason = 'Payment window expired before confirmed on-chain payment.',
            updated_at = CURRENT_TIMESTAMP
        WHERE out_trade_no = ANY(${expiredOrderNos})
      `
    }

    return NextResponse.json({
      success: true,
      checked: pendingOrders.length,
      expired: expiredOrderNos.length,
    })
  } catch (error) {
    console.error("[CronGlobalOrders] Failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to maintain global orders" },
      { status: 500 },
    )
  }
}
