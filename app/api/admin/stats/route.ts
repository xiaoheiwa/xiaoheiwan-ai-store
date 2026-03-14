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

    const [totalOrdersResult, paidOrdersResult, stockCountResult, currentPriceResult, totalRevenueResult, pendingFulfillResult] =
      await Promise.all([
        sql`SELECT COUNT(*) as count FROM orders`,
        sql`SELECT COUNT(*) as count FROM orders WHERE status = 'paid'`,
        sql`SELECT COUNT(*) as count FROM activation_codes WHERE status = 'available'`,
        sql`SELECT global_price FROM price_config ORDER BY id DESC LIMIT 1`,
        sql`SELECT COALESCE(SUM(amount), 0) as total_revenue FROM orders WHERE status = 'paid'`,
        sql`SELECT COUNT(*) as count FROM orders WHERE status = 'paid' AND delivery_type = 'manual' AND fulfilled_at IS NULL`,
      ])

    const stats = {
      totalOrders: Number.parseInt(totalOrdersResult[0].count),
      paidOrders: Number.parseInt(paidOrdersResult[0].count),
      stockCount: Number.parseInt(stockCountResult[0].count),
      currentPrice: currentPriceResult[0]?.global_price || 99,
      totalRevenue: Number.parseFloat(totalRevenueResult[0].total_revenue),
      pendingFulfill: Number.parseInt(pendingFulfillResult[0].count),
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
