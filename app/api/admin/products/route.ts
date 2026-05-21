import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { requireAdmin } from "@/lib/admin-auth"
import { getProductMarketListing, upsertProductMarketListing } from "@/lib/global-market"
import { normalizeInventoryMode, normalizeListingStatus } from "@/lib/market"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError
  try {
    const products = await Database.getAllProducts()
    const productsWithListings = await Promise.all(
      products.map(async (product) => ({
        ...product,
        global_listing: await getProductMarketListing(product.id, "GLOBAL"),
      })),
    )
    return NextResponse.json(productsWithListings)
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
    const { name, description, details, price, original_price, sku, sort_order, delivery_type, price_tiers, category_id, region_options, require_region_selection, activate_channel, product_type, inventory_mode, base_cost, gallery_images } = body

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
      activate_channel: activate_channel || null,
      product_type: product_type || "digital_code",
      inventory_mode: normalizeInventoryMode(inventory_mode),
      base_cost: base_cost ? Number.parseFloat(base_cost) : null,
      gallery_images: Array.isArray(gallery_images) ? gallery_images : null,
    })

    await saveGlobalListingIfPresent(product.id, body, name)

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
    console.log("[v0] PUT /api/admin/products received body:", JSON.stringify(body))
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    if (updates.price) updates.price = Number.parseFloat(updates.price)
    if (updates.original_price !== undefined) {
      updates.original_price = updates.original_price ? Number.parseFloat(updates.original_price) : null
    }
    if (updates.sort_order !== undefined) updates.sort_order = Number.parseInt(updates.sort_order) || 0
    if (updates.price_tiers !== undefined) updates.price_tiers = updates.price_tiers?.length > 0 ? updates.price_tiers : null
    if (updates.category_id !== undefined) updates.category_id = updates.category_id || null
    if (updates.region_options !== undefined) updates.region_options = updates.region_options?.length > 0 ? updates.region_options : null
    if (updates.require_region_selection !== undefined) updates.require_region_selection = !!updates.require_region_selection
    if (updates.details !== undefined) updates.details = updates.details || null
    if (updates.image_url !== undefined) updates.image_url = updates.image_url || null
    if (updates.activate_channel !== undefined) updates.activate_channel = updates.activate_channel || null
    if (updates.inventory_mode !== undefined) updates.inventory_mode = normalizeInventoryMode(updates.inventory_mode)
    if (updates.product_type !== undefined) updates.product_type = updates.product_type || "digital_code"
    if (updates.base_cost !== undefined) updates.base_cost = updates.base_cost ? Number.parseFloat(updates.base_cost) : null
    if (updates.gallery_images !== undefined) updates.gallery_images = Array.isArray(updates.gallery_images) ? updates.gallery_images : null

    const globalFields = pickGlobalListingFields(updates)
    for (const key of Object.keys(globalFields)) {
      delete updates[key]
    }

    console.log("[v0] Calling Database.updateProduct with id:", id, "updates:", JSON.stringify(updates))
    const product = await Database.updateProduct(id, updates)
    await saveGlobalListingIfPresent(id, globalFields, updates.name)
    console.log("[v0] Database.updateProduct returned:", JSON.stringify(product))
    return NextResponse.json(product)
  } catch (error) {
    console.error("[v0] Failed to update product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

function pickGlobalListingFields(updates: Record<string, any>) {
  const keys = [
    "global_enabled",
    "global_status",
    "global_title",
    "global_slug",
    "global_short_description",
    "global_description",
    "global_price",
    "global_compare_at_price",
    "global_service_level",
    "global_refund_policy",
    "global_risk_notice",
    "global_seo_title",
    "global_seo_description",
  ]

  return Object.fromEntries(keys.filter((key) => key in updates).map((key) => [key, updates[key]]))
}

async function saveGlobalListingIfPresent(productId: string, source: Record<string, any>, fallbackTitle?: string) {
  const hasGlobalFields = Object.keys(pickGlobalListingFields(source)).length > 0
  if (!hasGlobalFields) return

  const enabled = Boolean(source.global_enabled)
  const title = String(source.global_title || fallbackTitle || "").trim()
  const rawPrice = source.global_price
  const price = rawPrice === "" || rawPrice === null || rawPrice === undefined ? NaN : Number(rawPrice)

  if ((enabled || title || rawPrice) && (!title || !Number.isFinite(price))) {
    throw new Error("Global listing requires title and USDT price")
  }

  if (!title || !Number.isFinite(price)) return

  await upsertProductMarketListing({
    productId,
    market: "GLOBAL",
    enabled,
    status: normalizeListingStatus(source.global_status || (enabled ? "published" : "draft")),
    title,
    slug: source.global_slug || title,
    shortDescription: source.global_short_description || null,
    description: source.global_description || null,
    currency: "USDT",
    price,
    compareAtPrice: source.global_compare_at_price ? Number(source.global_compare_at_price) : null,
    serviceLevel: source.global_service_level || "USDT Self-Service Edition",
    refundPolicy: source.global_refund_policy || "Digital products are non-refundable after delivery.",
    riskNotice: source.global_risk_notice || "Wrong-network payments may result in permanent loss.",
    seoTitle: source.global_seo_title || null,
    seoDescription: source.global_seo_description || null,
  })
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
