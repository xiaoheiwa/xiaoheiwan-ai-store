import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdmin } from "@/lib/admin-auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const categories = await sql`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM product_categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `
    
    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return NextResponse.json({ error: "获取分类失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { name, description, icon, sort_order } = body
    
    if (!name) {
      return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 })
    }

    // Auto-generate slug if not provided
    let slug = body.slug?.trim()
    if (!slug) {
      slug = name.toLowerCase()
        .replace(/[\s]+/g, "-")
        .replace(/[^\w\u4e00-\u9fa5-]/g, "")
      // Add random suffix to ensure uniqueness
      slug = slug + "-" + Date.now().toString(36)
    }

    // Check slug uniqueness
    const existing = await sql`SELECT id FROM product_categories WHERE slug = ${slug}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "分类标识已存在" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO product_categories (name, slug, description, icon, sort_order)
      VALUES (${name}, ${slug}, ${description || null}, ${icon || null}, ${sort_order || 0})
      RETURNING *
    `

    return NextResponse.json({ category: result[0] })
  } catch (error) {
    console.error("Failed to create category:", error)
    return NextResponse.json({ error: "创建分类失败" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, name, description, icon, sort_order } = body

    if (!id || !name) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 })
    }

    // Auto-generate slug if not provided
    let slug = body.slug?.trim()
    if (!slug) {
      slug = name.toLowerCase()
        .replace(/[\s]+/g, "-")
        .replace(/[^\w\u4e00-\u9fa5-]/g, "")
      slug = slug + "-" + Date.now().toString(36)
    }

    // Check slug uniqueness (excluding current category)
    const existing = await sql`SELECT id FROM product_categories WHERE slug = ${slug} AND id != ${id}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "分类标识已存在" }, { status: 400 })
    }

    const result = await sql`
      UPDATE product_categories 
      SET name = ${name}, slug = ${slug}, description = ${description || null}, 
          icon = ${icon || null}, sort_order = ${sort_order || 0}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ category: result[0] })
  } catch (error) {
    console.error("Failed to update category:", error)
    return NextResponse.json({ error: "更新分类失败" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "缺少分类ID" }, { status: 400 })
    }

    // Check if category has products
    const products = await sql`SELECT COUNT(*) as count FROM products WHERE category_id = ${id}`
    if (Number(products[0]?.count) > 0) {
      return NextResponse.json({ error: "该分类下还有商品，请先移除商品" }, { status: 400 })
    }

    await sql`DELETE FROM product_categories WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete category:", error)
    return NextResponse.json({ error: "删除分类失败" }, { status: 500 })
  }
}
