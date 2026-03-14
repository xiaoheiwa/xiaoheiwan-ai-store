import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {

    const page = Number.parseInt(request.nextUrl.searchParams.get("page") || "1")
    const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") || "50")
    const status = request.nextUrl.searchParams.get("status") || ""
    const productId = request.nextUrl.searchParams.get("productId") || ""
    const search = request.nextUrl.searchParams.get("search") || ""
    const offset = (page - 1) * limit

    // Build dynamic query conditions
    let codes
    let totalResult

    if (status && productId && search) {
      totalResult = await sql`SELECT COUNT(*) as count FROM activation_codes WHERE status = ${status} AND product_id = ${productId} AND code ILIKE ${"%" + search + "%"}`
      codes = await sql`
        SELECT ac.*, p.name as product_name FROM activation_codes ac
        LEFT JOIN products p ON ac.product_id = p.id
        WHERE ac.status = ${status} AND ac.product_id = ${productId} AND ac.code ILIKE ${"%" + search + "%"}
        ORDER BY ac.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (status && productId) {
      totalResult = await sql`SELECT COUNT(*) as count FROM activation_codes WHERE status = ${status} AND product_id = ${productId}`
      codes = await sql`
        SELECT ac.*, p.name as product_name FROM activation_codes ac
        LEFT JOIN products p ON ac.product_id = p.id
        WHERE ac.status = ${status} AND ac.product_id = ${productId}
        ORDER BY ac.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (status && search) {
      totalResult = await sql`SELECT COUNT(*) as count FROM activation_codes WHERE status = ${status} AND code ILIKE ${"%" + search + "%"}`
      codes = await sql`
        SELECT ac.*, p.name as product_name FROM activation_codes ac
        LEFT JOIN products p ON ac.product_id = p.id
        WHERE ac.status = ${status} AND ac.code ILIKE ${"%" + search + "%"}
        ORDER BY ac.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (productId && search) {
      totalResult = await sql`SELECT COUNT(*) as count FROM activation_codes WHERE product_id = ${productId} AND code ILIKE ${"%" + search + "%"}`
      codes = await sql`
        SELECT ac.*, p.name as product_name FROM activation_codes ac
        LEFT JOIN products p ON ac.product_id = p.id
        WHERE ac.product_id = ${productId} AND ac.code ILIKE ${"%" + search + "%"}
        ORDER BY ac.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (status) {
      totalResult = await sql`SELECT COUNT(*) as count FROM activation_codes WHERE status = ${status}`
      codes = await sql`
        SELECT ac.*, p.name as product_name FROM activation_codes ac
        LEFT JOIN products p ON ac.product_id = p.id
        WHERE ac.status = ${status}
        ORDER BY ac.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (productId) {
      totalResult = await sql`SELECT COUNT(*) as count FROM activation_codes WHERE product_id = ${productId}`
      codes = await sql`
        SELECT ac.*, p.name as product_name FROM activation_codes ac
        LEFT JOIN products p ON ac.product_id = p.id
        WHERE ac.product_id = ${productId}
        ORDER BY ac.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (search) {
      totalResult = await sql`SELECT COUNT(*) as count FROM activation_codes WHERE code ILIKE ${"%" + search + "%"}`
      codes = await sql`
        SELECT ac.*, p.name as product_name FROM activation_codes ac
        LEFT JOIN products p ON ac.product_id = p.id
        WHERE ac.code ILIKE ${"%" + search + "%"}
        ORDER BY ac.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      totalResult = await sql`SELECT COUNT(*) as count FROM activation_codes`
      codes = await sql`
        SELECT ac.*, p.name as product_name FROM activation_codes ac
        LEFT JOIN products p ON ac.product_id = p.id
        ORDER BY ac.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    }

    const total = Number.parseInt(totalResult[0].count)

    // Get status summary counts
    const statusCounts = await sql`
      SELECT status, COUNT(*) as count FROM activation_codes GROUP BY status
    `
    const summary = { available: 0, sold: 0, locked: 0 }
    for (const row of statusCounts) {
      if (row.status in summary) {
        summary[row.status as keyof typeof summary] = Number.parseInt(row.count)
      }
    }

    return NextResponse.json({
      codes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary,
    })
  } catch (error) {
    console.error("[v0] Admin codes API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { codeIds, status } = body

    if (!codeIds || !Array.isArray(codeIds) || codeIds.length === 0) {
      return NextResponse.json({ error: "请选择要操作的激活码" }, { status: 400 })
    }

    const validStatuses = ["available", "sold", "locked"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "无效的状态值" }, { status: 400 })
    }

    // Process updates one by one to avoid array casting issues with varchar id column
    let updatedCount = 0
    for (const codeId of codeIds) {
      const r = await sql`
        UPDATE activation_codes
        SET status = ${status},
            sold_at = ${status === "sold" ? new Date().toISOString() : null},
            locked_at = ${status === "locked" ? new Date().toISOString() : null}
        WHERE id = ${codeId}
        RETURNING id
      `
      if (r.length > 0) updatedCount++
    }

    const statusLabelMap: Record<string, string> = { available: "可用", sold: "已售", locked: "锁定" }
    return NextResponse.json({
      success: true,
      updatedCount,
      message: `成功更新 ${updatedCount} 个激活码状态为"${statusLabelMap[status]}"`,
    })
  } catch (error) {
    console.error("[v0] Admin codes PATCH API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {

    const body = await request.json()
    const { codeIds } = body

    if (!codeIds || !Array.isArray(codeIds) || codeIds.length === 0) {
      return NextResponse.json({ error: "Invalid code IDs" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM activation_codes 
      WHERE id = ANY(${codeIds}) AND status = 'available'
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      deletedCount: result.length,
      message: `成功删除 ${result.length} 个激活码`,
    })
  } catch (error) {
    console.error("[v0] Admin codes DELETE API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
