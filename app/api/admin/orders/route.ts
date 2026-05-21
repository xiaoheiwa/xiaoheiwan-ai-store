import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const url = new URL(request.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(10, Number.parseInt(url.searchParams.get("limit") || "30")))
    const status = url.searchParams.get("status") || ""
    const search = url.searchParams.get("search") || ""
    const productId = url.searchParams.get("productId") || ""
    const market = url.searchParams.get("market") || ""
    const paymentNetwork = url.searchParams.get("paymentNetwork") || ""
    const paymentStatus = url.searchParams.get("paymentStatus") || ""
    const deliveryStatus = url.searchParams.get("deliveryStatus") || ""
    const offset = (page - 1) * limit

    const paymentStatusExpr =
      "COALESCE(NULLIF(o.payment_status, ''), CASE WHEN o.status = 'paid' THEN 'paid' WHEN o.status = 'failed' THEN 'failed' ELSE 'unpaid' END)"
    const deliveryStatusExpr =
      "COALESCE(NULLIF(o.delivery_status, ''), CASE WHEN o.fulfilled_at IS NOT NULL OR o.code IS NOT NULL THEN 'delivered' ELSE 'not_delivered' END)"
    const marketExpr = "COALESCE(NULLIF(o.market, ''), 'CN')"

    const conditions: string[] = []
    const values: unknown[] = []
    const addValue = (value: unknown) => {
      values.push(value)
      return `$${values.length}`
    }

    if (status) conditions.push(`o.status = ${addValue(status)}`)
    if (productId) conditions.push(`o.product_id = ${addValue(productId)}`)
    if (market) conditions.push(`${marketExpr} = ${addValue(market.toUpperCase())}`)
    if (paymentNetwork) conditions.push(`UPPER(COALESCE(o.payment_network, '')) = ${addValue(paymentNetwork.toUpperCase())}`)
    if (paymentStatus) conditions.push(`${paymentStatusExpr} = ${addValue(paymentStatus)}`)
    if (deliveryStatus) conditions.push(`${deliveryStatusExpr} = ${addValue(deliveryStatus)}`)
    if (search) {
      const searchValue = `%${search.toLowerCase()}%`
      const searchParam = addValue(searchValue)
      conditions.push(`(
        LOWER(COALESCE(o.out_trade_no, '')) LIKE ${searchParam}
        OR LOWER(COALESCE(o.email, '')) LIKE ${searchParam}
        OR LOWER(COALESCE(o.code, '')) LIKE ${searchParam}
        OR LOWER(COALESCE(o.tx_hash, '')) LIKE ${searchParam}
        OR LOWER(COALESCE(o.product_title_snapshot, '')) LIKE ${searchParam}
      )`)
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    // Summary counts (always unfiltered)
    const summaryResult = await sql.query(`
      SELECT
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
        SUM(CASE WHEN COALESCE(NULLIF(market, ''), 'CN') = 'CN' THEN 1 ELSE 0 END) as cn_count,
        SUM(CASE WHEN COALESCE(NULLIF(market, ''), 'CN') = 'GLOBAL' THEN 1 ELSE 0 END) as global_count,
        SUM(CASE WHEN COALESCE(NULLIF(market, ''), 'CN') = 'GLOBAL' AND status = 'pending' THEN 1 ELSE 0 END) as global_pending_count,
        SUM(CASE WHEN COALESCE(NULLIF(market, ''), 'CN') = 'GLOBAL' AND COALESCE(NULLIF(delivery_status, ''), '') = 'manual_review' THEN 1 ELSE 0 END) as global_manual_review_count,
        SUM(CASE WHEN payment_method = 'usdt' THEN 1 ELSE 0 END) as usdt_count,
        SUM(CASE WHEN UPPER(COALESCE(payment_network, '')) = 'TRC20' THEN 1 ELSE 0 END) as trc20_count,
        SUM(CASE WHEN UPPER(COALESCE(payment_network, '')) = 'BEP20' THEN 1 ELSE 0 END) as bep20_count,
        COALESCE(SUM(CASE WHEN COALESCE(NULLIF(market, ''), 'CN') = 'GLOBAL' AND status = 'paid' THEN amount ELSE 0 END), 0) as global_revenue
      FROM orders
    `)

    const totalResult = await sql.query(
      `
        SELECT COUNT(*) as count
        FROM orders o
        ${whereSql}
      `,
      values,
    )
    const orders = await sql.query(
      `
        SELECT
          o.*,
          p.name as product_name,
          p.inventory_mode as product_inventory_mode,
          ${marketExpr} as normalized_market,
          ${paymentStatusExpr} as normalized_payment_status,
          ${deliveryStatusExpr} as normalized_delivery_status
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        ${whereSql}
        ORDER BY o.created_at DESC
        LIMIT ${addValue(limit)} OFFSET ${addValue(offset)}
      `,
      values,
    )

    const total = Number.parseInt(totalResult[0]?.count || "0")
    const summary = summaryResult[0] || {}

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        paid: Number.parseInt(summary.paid_count || "0"),
        pending: Number.parseInt(summary.pending_count || "0"),
        failed: Number.parseInt(summary.failed_count || "0"),
        total: Number.parseInt(summary.total_count || "0"),
        totalRevenue: Number.parseFloat(summary.total_revenue || "0"),
        cnOrders: Number.parseInt(summary.cn_count || "0"),
        globalOrders: Number.parseInt(summary.global_count || "0"),
        globalPending: Number.parseInt(summary.global_pending_count || "0"),
        globalManualReview: Number.parseInt(summary.global_manual_review_count || "0"),
        usdtOrders: Number.parseInt(summary.usdt_count || "0"),
        trc20Orders: Number.parseInt(summary.trc20_count || "0"),
        bep20Orders: Number.parseInt(summary.bep20_count || "0"),
        globalRevenue: Number.parseFloat(summary.global_revenue || "0"),
      },
    })
  } catch (error) {
    console.error("[v0] Error in orders API:", error)
    return NextResponse.json(
      { error: "服务器错误", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { orderIds } = await request.json()
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "请选择要删除的订单" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM orders WHERE out_trade_no = ANY(${orderIds})
    `

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `成功删除 ${result.count} 个订单`,
    })
  } catch (error) {
    console.error("[v0] Error deleting orders:", error)
    return NextResponse.json(
      { error: "删除订单失败", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
