import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const categories = await sql`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM product_categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `
    
    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return NextResponse.json({ error: "获取分类失败" }, { status: 500 })
  }
}
