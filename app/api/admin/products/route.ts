import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const products = await Database.getAllProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] Failed to get products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const body = await request.json()
    const { name, description, details, price, original_price, sku, sort_order, delivery_type, price_tiers, category_id, region_options, require_region_selection } = body

    if (!name || !price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 })
    }

    const product = await Database.createProduct({
      name,
      description,
      details,
      price: Number.parseFloat(price),
      original_price: original_price ? Number.parseFloat(original_price) : undefined,
      sku,
      sort_order: sort_order ? Number.parseInt(sort_order) : 0,
      delivery_type: delivery_type || "auto",
      price_tiers: price_tiers || null,
      category_id: category_id || null,
      region_options: region_options || null,
      require_region_selection: require_region_selection || false,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("[v0] Failed to create product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    if (updates.price) updates.price = Number.parseFloat(updates.price)
    if (updates.original_price) updates.original_price = Number.parseFloat(updates.original_price)
    if (updates.sort_order !== undefined) updates.sort_order = Number.parseInt(updates.sort_order)
    if (updates.price_tiers !== undefined) updates.price_tiers = updates.price_tiers || null
    if (updates.category_id !== undefined) updates.category_id = updates.category_id || null
    if (updates.region_options !== undefined) updates.region_options = updates.region_options || null
    if (updates.require_region_selection !== undefined) updates.require_region_selection = !!updates.require_region_selection

    const product = await Database.updateProduct(id, updates)
    return NextResponse.json(product)
  } catch (error) {
    console.error("[v0] Failed to update product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    await Database.deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
