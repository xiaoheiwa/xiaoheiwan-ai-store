import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Database } from "@/lib/database"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    // 1. Overall summary: total cost, total revenue, profit
    // Include both auto (activation_codes sold) and manual (order quantity) sales
    const [costResult, revenueResult, autoSoldResult, manualSoldResult, stockResult] = await Promise.all([
      sql`SELECT COALESCE(SUM(total_cost), 0) as total_cost FROM purchase_batches`,
      sql`SELECT COALESCE(SUM(amount), 0) as total_revenue FROM orders WHERE status = 'paid'`,
      sql`SELECT COUNT(*) as count FROM activation_codes WHERE status = 'sold'`,
      sql`SELECT COALESCE(SUM(COALESCE(quantity, 1)), 0) as count FROM orders WHERE status = 'paid' AND delivery_type = 'manual' AND fulfilled_at IS NOT NULL`,
      sql`SELECT COUNT(*) as count FROM activation_codes WHERE status = 'available'`,
    ])

    const totalCost = Number.parseFloat(costResult[0].total_cost)
    const totalRevenue = Number.parseFloat(revenueResult[0].total_revenue)
    const totalSold = Number.parseInt(autoSoldResult[0].count) + Number.parseInt(manualSoldResult[0].count)
    const totalStock = Number.parseInt(stockResult[0].count)

    // 2. Per-product breakdown: cost, revenue, profit, stock, sold
    // Combines activation_codes sold (auto) + manual order quantities (manual fulfilled)
    const productStats = await sql`
      SELECT 
        p.id,
        p.name,
        p.price as sale_price,
        p.delivery_type,
        COALESCE(pb_agg.total_cost, 0) as total_cost,
        COALESCE(pb_agg.total_purchased, 0) as total_purchased,
        COALESCE(pb_agg.avg_unit_cost, 0) as avg_unit_cost,
        COALESCE(ac_agg.sold_count, 0) as auto_sold_count,
        COALESCE(ac_agg.available_count, 0) as available_count,
        COALESCE(manual_agg.manual_sold_count, 0) as manual_sold_count,
        COALESCE(order_agg.revenue, 0) as revenue,
        COALESCE(order_agg.total_qty_sold, 0) as total_qty_sold,
        COALESCE(order_agg.pending_fulfill_count, 0) as pending_fulfill_count
      FROM products p
      LEFT JOIN (
        SELECT product_id, 
          SUM(total_cost) as total_cost, 
          SUM(quantity) as total_purchased,
          CASE WHEN SUM(quantity) > 0 THEN SUM(total_cost) / SUM(quantity) ELSE 0 END as avg_unit_cost
        FROM purchase_batches 
        GROUP BY product_id
      ) pb_agg ON pb_agg.product_id = p.id
      LEFT JOIN (
        SELECT product_id,
          COUNT(*) FILTER (WHERE status = 'sold') as sold_count,
          COUNT(*) FILTER (WHERE status = 'available') as available_count
        FROM activation_codes
        GROUP BY product_id
      ) ac_agg ON ac_agg.product_id = p.id
      LEFT JOIN (
        SELECT product_id, 
          SUM(COALESCE(quantity, 1)) as manual_sold_count
        FROM orders 
        WHERE status = 'paid' AND delivery_type = 'manual' AND fulfilled_at IS NOT NULL
        GROUP BY product_id
      ) manual_agg ON manual_agg.product_id = p.id
      LEFT JOIN (
        SELECT product_id, 
          SUM(amount) as revenue,
          SUM(COALESCE(quantity, 1)) as total_qty_sold,
          SUM(CASE WHEN delivery_type = 'manual' AND fulfilled_at IS NULL THEN 1 ELSE 0 END) as pending_fulfill_count
        FROM orders WHERE status = 'paid'
        GROUP BY product_id
      ) order_agg ON order_agg.product_id = p.id
      ORDER BY p.name
    `

    const products = productStats.map((p: any) => ({
      id: p.id,
      name: p.name,
      salePrice: Number.parseFloat(p.sale_price || 0),
      deliveryType: p.delivery_type || "auto",
      totalCost: Number.parseFloat(p.total_cost),
      totalPurchased: Number.parseInt(p.total_purchased),
      avgUnitCost: Number.parseFloat(p.avg_unit_cost),
      soldCount: Number.parseInt(p.auto_sold_count) + Number.parseInt(p.manual_sold_count),
      availableCount: Number.parseInt(p.available_count),
      pendingFulfillCount: Number.parseInt(p.pending_fulfill_count),
      revenue: Number.parseFloat(p.revenue),
      profit: Number.parseFloat(p.revenue) - Number.parseFloat(p.total_cost),
    }))

    // 3. Monthly trend (last 6 months)
    const monthlyTrend = await sql`
      SELECT 
        months.month,
        COALESCE(cost_agg.cost, 0) as cost,
        COALESCE(rev_agg.revenue, 0) as revenue
      FROM (
        SELECT TO_CHAR(generate_series(
          DATE_TRUNC('month', NOW()) - INTERVAL '5 months',
          DATE_TRUNC('month', NOW()),
          '1 month'
        ), 'YYYY-MM') as month
      ) months
      LEFT JOIN (
        SELECT TO_CHAR(created_at, 'YYYY-MM') as month, SUM(total_cost) as cost
        FROM purchase_batches
        WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ) cost_agg ON cost_agg.month = months.month
      LEFT JOIN (
        SELECT TO_CHAR(created_at, 'YYYY-MM') as month, SUM(amount) as revenue
        FROM orders
        WHERE status = 'paid' AND created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ) rev_agg ON rev_agg.month = months.month
      ORDER BY months.month
    `

    const trend = monthlyTrend.map((m: any) => ({
      month: m.month,
      cost: Number.parseFloat(m.cost),
      revenue: Number.parseFloat(m.revenue),
      profit: Number.parseFloat(m.revenue) - Number.parseFloat(m.cost),
    }))

    // 4. Purchase batches
    const batches = await Database.getPurchaseBatches(50, 0)

    return NextResponse.json({
      ok: true,
      summary: {
        totalCost,
        totalRevenue,
        totalProfit: totalRevenue - totalCost,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0,
        totalSold,
        totalStock,
      },
      products,
      trend,
      batches,
    })
  } catch (error: any) {
    console.error("[v0] Finance API error:", error)
    return NextResponse.json({ ok: false, msg: error.message }, { status: 500 })
  }
}
