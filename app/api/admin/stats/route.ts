import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {

    const [totalOrdersResult, paidOrdersResult, stockCountResult, currentPriceResult, totalRevenueResult, pendingFulfillResult, marketStatsResult] =
      await Promise.all([
        sql`SELECT COUNT(*) as count FROM orders`,
        sql`SELECT COUNT(*) as count FROM orders WHERE status = 'paid'`,
        sql`SELECT COUNT(*) as count FROM activation_codes WHERE status = 'available'`,
        sql`SELECT global_price FROM price_config ORDER BY id DESC LIMIT 1`,
        sql`SELECT COALESCE(SUM(amount), 0) as total_revenue FROM orders WHERE status = 'paid'`,
        sql`SELECT COUNT(*) as count FROM orders WHERE status = 'paid' AND delivery_type = 'manual' AND fulfilled_at IS NULL`,
        sql`
          SELECT
            SUM(CASE WHEN COALESCE(NULLIF(market, ''), 'CN') = 'CN' THEN 1 ELSE 0 END) as cn_orders,
            SUM(CASE WHEN COALESCE(NULLIF(market, ''), 'CN') = 'GLOBAL' THEN 1 ELSE 0 END) as global_orders,
            COALESCE(SUM(CASE WHEN COALESCE(NULLIF(market, ''), 'CN') = 'CN' AND status = 'paid' THEN amount ELSE 0 END), 0) as cn_revenue,
            COALESCE(SUM(CASE WHEN COALESCE(NULLIF(market, ''), 'CN') = 'GLOBAL' AND status = 'paid' THEN amount ELSE 0 END), 0) as global_revenue,
            SUM(CASE WHEN COALESCE(NULLIF(market, ''), 'CN') = 'GLOBAL' AND COALESCE(NULLIF(payment_status, ''), '') IN ('underpaid', 'overpaid', 'expired', 'failed') THEN 1 ELSE 0 END) as global_payment_abnormal,
            SUM(CASE WHEN COALESCE(NULLIF(market, ''), 'CN') = 'GLOBAL' AND COALESCE(NULLIF(delivery_status, ''), '') = 'manual_review' THEN 1 ELSE 0 END) as global_manual_review,
            SUM(CASE WHEN UPPER(COALESCE(payment_network, '')) = 'TRC20' THEN 1 ELSE 0 END) as trc20_orders,
            SUM(CASE WHEN UPPER(COALESCE(payment_network, '')) = 'BEP20' THEN 1 ELSE 0 END) as bep20_orders
          FROM orders
        `,
      ])
    const marketStats = marketStatsResult[0] || {}

    const stats = {
      totalOrders: Number.parseInt(totalOrdersResult[0].count),
      paidOrders: Number.parseInt(paidOrdersResult[0].count),
      stockCount: Number.parseInt(stockCountResult[0].count),
      currentPrice: currentPriceResult[0]?.global_price || 99,
      totalRevenue: Number.parseFloat(totalRevenueResult[0].total_revenue),
      pendingFulfill: Number.parseInt(pendingFulfillResult[0].count),
      cnOrders: Number.parseInt(marketStats.cn_orders || "0"),
      globalOrders: Number.parseInt(marketStats.global_orders || "0"),
      cnRevenue: Number.parseFloat(marketStats.cn_revenue || "0"),
      globalRevenue: Number.parseFloat(marketStats.global_revenue || "0"),
      globalPaymentAbnormal: Number.parseInt(marketStats.global_payment_abnormal || "0"),
      globalManualReview: Number.parseInt(marketStats.global_manual_review || "0"),
      trc20Orders: Number.parseInt(marketStats.trc20_orders || "0"),
      bep20Orders: Number.parseInt(marketStats.bep20_orders || "0"),
    }

    console.log("[v0] Stats API: Retrieved stats:", stats)

    const response = {
      ok: true,
      totalOrders: stats.totalOrders,
      paidOrders: stats.paidOrders,
      stockCount: stats.stockCount,
      usedCodes: 0,
      currentPrice: stats.currentPrice,
      totalRevenue: stats.totalRevenue,
      pendingFulfill: stats.pendingFulfill,
      cnOrders: stats.cnOrders,
      globalOrders: stats.globalOrders,
      cnRevenue: stats.cnRevenue,
      globalRevenue: stats.globalRevenue,
      globalPaymentAbnormal: stats.globalPaymentAbnormal,
      globalManualReview: stats.globalManualReview,
      trc20Orders: stats.trc20Orders,
      bep20Orders: stats.bep20Orders,
    }

    console.log("[v0] Stats API: Returning successful response", response)
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    })
  } catch (error: any) {
    console.error("[v0] Stats API: Unexpected error in GET function", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    return NextResponse.json(
      {
        ok: false,
        msg: `Server error: ${error.message}`,
        error: error.name,
      },
      { status: 500 },
    )
  }
}
