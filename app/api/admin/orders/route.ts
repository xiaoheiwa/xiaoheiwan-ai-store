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
    const offset = (page - 1) * limit

    // Build WHERE conditions
    const conditions: string[] = []
    if (status) conditions.push(`o.status = '${status}'`)
    if (productId) conditions.push(`o.product_id = '${productId}'`)

    // Summary counts (always unfiltered)
    const summaryResult = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COUNT(*) as total_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as total_revenue
      FROM orders
    `

    // Use parameterized queries for search - build dynamic SQL safely
    let orders
    let totalResult

    if (search && status && productId) {
      totalResult = await sql`
        SELECT COUNT(*) as count FROM orders o
        WHERE (o.out_trade_no ILIKE ${'%' + search + '%'} OR o.email ILIKE ${'%' + search + '%'} OR o.code ILIKE ${'%' + search + '%'})
        AND o.status = ${status} AND o.product_id = ${productId}::uuid
      `
      orders = await sql`
        SELECT o.*, p.name as product_name
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        WHERE (o.out_trade_no ILIKE ${'%' + search + '%'} OR o.email ILIKE ${'%' + search + '%'} OR o.code ILIKE ${'%' + search + '%'})
        AND o.status = ${status} AND o.product_id = ${productId}::uuid
        ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (search && status) {
      totalResult = await sql`
        SELECT COUNT(*) as count FROM orders o
        WHERE (o.out_trade_no ILIKE ${'%' + search + '%'} OR o.email ILIKE ${'%' + search + '%'} OR o.code ILIKE ${'%' + search + '%'})
        AND o.status = ${status}
      `
      orders = await sql`
        SELECT o.*, p.name as product_name
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        WHERE (o.out_trade_no ILIKE ${'%' + search + '%'} OR o.email ILIKE ${'%' + search + '%'} OR o.code ILIKE ${'%' + search + '%'})
        AND o.status = ${status}
        ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (search && productId) {
      totalResult = await sql`
        SELECT COUNT(*) as count FROM orders o
        WHERE (o.out_trade_no ILIKE ${'%' + search + '%'} OR o.email ILIKE ${'%' + search + '%'} OR o.code ILIKE ${'%' + search + '%'})
        AND o.product_id = ${productId}::uuid
      `
      orders = await sql`
        SELECT o.*, p.name as product_name
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        WHERE (o.out_trade_no ILIKE ${'%' + search + '%'} OR o.email ILIKE ${'%' + search + '%'} OR o.code ILIKE ${'%' + search + '%'})
        AND o.product_id = ${productId}::uuid
        ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (search) {
      totalResult = await sql`
        SELECT COUNT(*) as count FROM orders o
        WHERE (o.out_trade_no ILIKE ${'%' + search + '%'} OR o.email ILIKE ${'%' + search + '%'} OR o.code ILIKE ${'%' + search + '%'})
      `
      orders = await sql`
        SELECT o.*, p.name as product_name
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        WHERE (o.out_trade_no ILIKE ${'%' + search + '%'} OR o.email ILIKE ${'%' + search + '%'} OR o.code ILIKE ${'%' + search + '%'})
        ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (status && productId) {
      totalResult = await sql`
        SELECT COUNT(*) as count FROM orders o
        WHERE o.status = ${status} AND o.product_id = ${productId}::uuid
      `
      orders = await sql`
        SELECT o.*, p.name as product_name
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        WHERE o.status = ${status} AND o.product_id = ${productId}::uuid
        ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (status) {
      totalResult = await sql`
        SELECT COUNT(*) as count FROM orders o WHERE o.status = ${status}
      `
      orders = await sql`
        SELECT o.*, p.name as product_name
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        WHERE o.status = ${status}
        ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (productId) {
      totalResult = await sql`
        SELECT COUNT(*) as count FROM orders o WHERE o.product_id = ${productId}::uuid
      `
      orders = await sql`
        SELECT o.*, p.name as product_name
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        WHERE o.product_id = ${productId}::uuid
        ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      totalResult = await sql`SELECT COUNT(*) as count FROM orders`
      orders = await sql`
        SELECT o.*, p.name as product_name
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    }

    const total = Number.parseInt(totalResult[0]?.count || "0")

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        paid: Number.parseInt(summaryResult[0]?.paid_count || "0"),
        pending: Number.parseInt(summaryResult[0]?.pending_count || "0"),
        failed: Number.parseInt(summaryResult[0]?.failed_count || "0"),
        total: Number.parseInt(summaryResult[0]?.total_count || "0"),
        totalRevenue: Number.parseFloat(summaryResult[0]?.total_revenue || "0"),
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
