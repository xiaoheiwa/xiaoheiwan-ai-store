import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("category")

    let products
    if (categoryId && categoryId !== "all") {
      products = await sql`
        SELECT 
          p.*,
          c.name as category_name,
          c.slug as category_slug,
          COALESCE((
            SELECT COUNT(*) FROM activation_codes ac 
            WHERE ac.product_id = p.id AND ac.status = 'available'
          ), 0) as stock_count
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        WHERE p.status = 'active' AND p.category_id = ${categoryId}
        ORDER BY p.sort_order ASC, p.created_at DESC
      `
    } else {
      products = await sql`
        SELECT 
          p.*,
          c.name as category_name,
          c.slug as category_slug,
          COALESCE((
            SELECT COUNT(*) FROM activation_codes ac 
            WHERE ac.product_id = p.id AND ac.status = 'available'
          ), 0) as stock_count
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        WHERE p.status = 'active'
        ORDER BY p.sort_order ASC, p.created_at DESC
      `
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] Failed to get active products:", error)
    return NextResponse.json([], { status: 500 })
  }
}
