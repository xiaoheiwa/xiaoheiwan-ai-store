import { neon } from "@/lib/db-client"
import {
  type InventoryMode,
  type ListingStatus,
  type Market,
  type MarketCurrency,
  normalizeCurrency,
  normalizeInventoryMode,
  normalizeListingStatus,
  normalizeMarket,
} from "@/lib/market"

const sql = neon(process.env.DATABASE_URL)

export type ProductMarketListing = {
  id: string
  product_id: string
  market: Market
  enabled: boolean
  status: ListingStatus
  title: string
  slug: string
  short_description: string | null
  description: string | null
  currency: MarketCurrency
  price: number
  compare_at_price: number | null
  service_level: string | null
  refund_policy: string | null
  risk_notice: string | null
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export type MarketProductCard = ProductMarketListing & {
  product_sku: string | null
  product_type: string
  image_url: string | null
  gallery_images: string[] | null
  inventory_mode: InventoryMode
  delivery_type: "auto" | "manual"
  category_id: string | null
  category_name: string | null
  category_slug: string | null
  stock_count: number
}

export type UpsertProductMarketListingInput = {
  productId: string
  market: Market
  enabled?: boolean
  status?: ListingStatus
  title: string
  slug?: string
  shortDescription?: string | null
  description?: string | null
  currency?: MarketCurrency
  price: number
  compareAtPrice?: number | null
  serviceLevel?: string | null
  refundPolicy?: string | null
  riskNotice?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true"
}

function toNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function asStringArray(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string")
  if (typeof value !== "string" || !value.trim()) return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : null
  } catch {
    return null
  }
}

function normalizeSlug(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)

  return normalized || fallback
}

function mapListing(row: any): ProductMarketListing {
  const market = normalizeMarket(row.market) || "CN"

  return {
    id: String(row.id),
    product_id: String(row.product_id),
    market,
    enabled: toBoolean(row.enabled),
    status: normalizeListingStatus(row.status),
    title: String(row.title || ""),
    slug: String(row.slug || ""),
    short_description: row.short_description || null,
    description: row.description || null,
    currency: normalizeCurrency(row.currency, market),
    price: toNumber(row.price),
    compare_at_price: toNullableNumber(row.compare_at_price),
    service_level: row.service_level || null,
    refund_policy: row.refund_policy || null,
    risk_notice: row.risk_notice || null,
    seo_title: row.seo_title || null,
    seo_description: row.seo_description || null,
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  }
}

function mapMarketProductCard(row: any): MarketProductCard {
  return {
    ...mapListing(row),
    product_sku: row.product_sku || null,
    product_type: String(row.product_type || "digital_code"),
    image_url: row.image_url || null,
    gallery_images: asStringArray(row.gallery_images),
    inventory_mode: normalizeInventoryMode(row.inventory_mode),
    delivery_type: row.delivery_type === "manual" ? "manual" : "auto",
    category_id: row.category_id || null,
    category_name: row.category_name || null,
    category_slug: row.category_slug || null,
    stock_count: toNumber(row.stock_count),
  }
}

function isMissingMarketTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "")
  return message.includes("no such table: product_market_listings") || message.includes("relation \"product_market_listings\" does not exist")
}

export function createMarketListingSlug(title: string, market: Market, productId?: string): string {
  const fallback = `${market.toLowerCase()}-${String(productId || crypto.randomUUID()).slice(0, 8)}`
  return normalizeSlug(title, fallback)
}

export async function getProductMarketListing(productId: string, market: Market): Promise<ProductMarketListing | null> {
  const normalizedMarket = normalizeMarket(market)
  if (!normalizedMarket) return null

  try {
    const result = await sql`
      SELECT *
      FROM product_market_listings
      WHERE product_id = ${productId} AND market = ${normalizedMarket}
      LIMIT 1
    `

    return result[0] ? mapListing(result[0]) : null
  } catch (error) {
    if (isMissingMarketTableError(error)) return null
    throw error
  }
}

export async function getPublishedMarketListings(market: Market, limit = 50): Promise<MarketProductCard[]> {
  const normalizedMarket = normalizeMarket(market)
  if (!normalizedMarket) return []

  try {
    const result = await sql`
      SELECT
        l.*,
        p.sku AS product_sku,
        COALESCE(p.product_type, 'digital_code') AS product_type,
        p.image_url,
        p.gallery_images,
        COALESCE(p.inventory_mode, 'shared') AS inventory_mode,
        COALESCE(p.delivery_type, 'auto') AS delivery_type,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        COALESCE((
          SELECT COUNT(*)
          FROM activation_codes ac
          WHERE ac.product_id = p.id
            AND ac.status = 'available'
            AND (
              (COALESCE(p.inventory_mode, 'shared') = 'separate' AND COALESCE(NULLIF(ac.market, ''), 'SHARED') = l.market)
              OR (COALESCE(p.inventory_mode, 'shared') <> 'separate' AND COALESCE(NULLIF(ac.market, ''), 'SHARED') = 'SHARED')
            )
        ), 0) AS stock_count
      FROM product_market_listings l
      INNER JOIN products p ON p.id = l.product_id
      LEFT JOIN product_categories c ON c.id = p.category_id
      WHERE l.market = ${normalizedMarket}
        AND l.enabled = ${true}
        AND l.status = 'published'
        AND p.status = 'active'
      ORDER BY p.sort_order ASC, l.updated_at DESC
      LIMIT ${limit}
    `

    return result.map(mapMarketProductCard)
  } catch (error) {
    if (isMissingMarketTableError(error)) return []
    throw error
  }
}

export async function getMarketListingBySlug(market: Market, slug: string): Promise<MarketProductCard | null> {
  const normalizedMarket = normalizeMarket(market)
  if (!normalizedMarket) return null

  try {
    const result = await sql`
      SELECT
        l.*,
        p.sku AS product_sku,
        COALESCE(p.product_type, 'digital_code') AS product_type,
        p.image_url,
        p.gallery_images,
        COALESCE(p.inventory_mode, 'shared') AS inventory_mode,
        COALESCE(p.delivery_type, 'auto') AS delivery_type,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        COALESCE((
          SELECT COUNT(*)
          FROM activation_codes ac
          WHERE ac.product_id = p.id
            AND ac.status = 'available'
            AND (
              (COALESCE(p.inventory_mode, 'shared') = 'separate' AND COALESCE(NULLIF(ac.market, ''), 'SHARED') = l.market)
              OR (COALESCE(p.inventory_mode, 'shared') <> 'separate' AND COALESCE(NULLIF(ac.market, ''), 'SHARED') = 'SHARED')
            )
        ), 0) AS stock_count
      FROM product_market_listings l
      INNER JOIN products p ON p.id = l.product_id
      LEFT JOIN product_categories c ON c.id = p.category_id
      WHERE l.market = ${normalizedMarket}
        AND l.slug = ${slug}
        AND l.enabled = ${true}
        AND l.status = 'published'
        AND p.status = 'active'
      LIMIT 1
    `

    return result[0] ? mapMarketProductCard(result[0]) : null
  } catch (error) {
    if (isMissingMarketTableError(error)) return null
    throw error
  }
}

export async function getMarketAvailableStockCount(productId: string, market: Market, inventoryMode?: InventoryMode) {
  const normalizedMarket = normalizeMarket(market)
  if (!normalizedMarket) return 0

  const mode = normalizeInventoryMode(inventoryMode)
  const result = await sql`
    SELECT COUNT(*) AS count
    FROM activation_codes
    WHERE product_id = ${productId}
      AND status = 'available'
      AND (
        (${mode} = 'separate' AND COALESCE(NULLIF(market, ''), 'SHARED') = ${normalizedMarket})
        OR (${mode} <> 'separate' AND COALESCE(NULLIF(market, ''), 'SHARED') = 'SHARED')
      )
  `

  return toNumber(result[0]?.count)
}

export async function upsertProductMarketListing(
  input: UpsertProductMarketListingInput,
): Promise<ProductMarketListing> {
  const market = normalizeMarket(input.market)
  if (!market) throw new Error("Invalid market")
  if (!input.productId) throw new Error("Missing productId")
  if (!input.title.trim()) throw new Error("Missing listing title")

  const slug = createMarketListingSlug(input.slug || input.title, market, input.productId)
  const status = normalizeListingStatus(input.status)
  const currency = normalizeCurrency(input.currency, market)

  const result = await sql`
    INSERT INTO product_market_listings (
      id,
      product_id,
      market,
      enabled,
      status,
      title,
      slug,
      short_description,
      description,
      currency,
      price,
      compare_at_price,
      service_level,
      refund_policy,
      risk_notice,
      seo_title,
      seo_description,
      created_at,
      updated_at
    )
    VALUES (
      ${crypto.randomUUID()},
      ${input.productId},
      ${market},
      ${input.enabled ?? false},
      ${status},
      ${input.title.trim()},
      ${slug},
      ${input.shortDescription || null},
      ${input.description || null},
      ${currency},
      ${input.price},
      ${input.compareAtPrice ?? null},
      ${input.serviceLevel || null},
      ${input.refundPolicy || null},
      ${input.riskNotice || null},
      ${input.seoTitle || null},
      ${input.seoDescription || null},
      NOW(),
      NOW()
    )
    ON CONFLICT(product_id, market) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      status = EXCLUDED.status,
      title = EXCLUDED.title,
      slug = EXCLUDED.slug,
      short_description = EXCLUDED.short_description,
      description = EXCLUDED.description,
      currency = EXCLUDED.currency,
      price = EXCLUDED.price,
      compare_at_price = EXCLUDED.compare_at_price,
      service_level = EXCLUDED.service_level,
      refund_policy = EXCLUDED.refund_policy,
      risk_notice = EXCLUDED.risk_notice,
      seo_title = EXCLUDED.seo_title,
      seo_description = EXCLUDED.seo_description,
      updated_at = NOW()
    RETURNING *
  `

  return mapListing(result[0])
}
