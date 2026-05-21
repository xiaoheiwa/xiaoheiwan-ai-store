import { neon } from "@/lib/db-client"
import {
  type InventoryMode,
  type Market,
  type PaymentNetwork,
  normalizeInventoryMode,
  normalizeMarket,
  normalizePaymentNetwork,
} from "@/lib/market"
import type { MarketProductCard } from "@/lib/global-market"

const sql = neon(process.env.DATABASE_URL)

export type GlobalOrderStatus =
  | "pending_payment"
  | "payment_confirming"
  | "paid"
  | "delivered"
  | "manual_review"
  | "expired"
  | "failed"
  | "refunded"

export type GlobalPaymentStatus = "unpaid" | "confirming" | "paid" | "underpaid" | "overpaid" | "expired" | "failed"
export type GlobalDeliveryStatus = "not_delivered" | "delivering" | "delivered" | "delivery_failed" | "manual_review"

export type GlobalOrder = {
  out_trade_no: string
  email: string
  amount: number
  subject: string
  status: string
  code: string | null
  product_id: string | null
  market: Market
  product_listing_id: string | null
  product_title_snapshot: string | null
  product_description_snapshot: string | null
  price_snapshot: number | null
  currency: string
  service_level_snapshot: string | null
  refund_policy_snapshot: string | null
  risk_notice_snapshot: string | null
  payment_method: string | null
  payment_network: PaymentNetwork | null
  token: string | null
  payment_address: string | null
  expected_amount: number | null
  received_amount: number | null
  tx_hash: string | null
  confirmations: number | null
  payment_expired_at: string | null
  payment_status: GlobalPaymentStatus
  delivery_status: GlobalDeliveryStatus
  risk_status: string | null
  manual_review_reason: string | null
  payment_url: string | null
  gateway_resp: any
  paid_at: string | null
  fulfilled_at: string | null
  created_at: string
  updated_at: string
}

export type CreateGlobalOrderInput = {
  orderNo: string
  email: string
  product: MarketProductCard
  paymentNetwork: PaymentNetwork
  paymentAddress?: string | null
  expectedAmount: number
  paymentUrl?: string | null
  paymentExpiresAt: Date
  gatewayResp: unknown
  customerIp?: string | null
  customerCountry?: string | null
  userAgent?: string | null
}

export type GlobalInventoryCode = {
  id: string
  code: string
  status: string
  product_id: string | null
}

function toNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function parseJson(value: unknown) {
  if (!value) return null
  if (typeof value === "object") return value
  if (typeof value !== "string") return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function normalizePaymentStatus(value: unknown): GlobalPaymentStatus {
  const normalized = String(value || "").trim().toLowerCase()
  const allowed: GlobalPaymentStatus[] = ["unpaid", "confirming", "paid", "underpaid", "overpaid", "expired", "failed"]
  return allowed.includes(normalized as GlobalPaymentStatus) ? (normalized as GlobalPaymentStatus) : "unpaid"
}

function normalizeDeliveryStatus(value: unknown): GlobalDeliveryStatus {
  const normalized = String(value || "").trim().toLowerCase()
  const allowed: GlobalDeliveryStatus[] = ["not_delivered", "delivering", "delivered", "delivery_failed", "manual_review"]
  return allowed.includes(normalized as GlobalDeliveryStatus) ? (normalized as GlobalDeliveryStatus) : "not_delivered"
}

function mapGlobalOrder(row: any): GlobalOrder {
  return {
    out_trade_no: String(row.out_trade_no),
    email: String(row.email || ""),
    amount: toNumber(row.amount),
    subject: String(row.subject || ""),
    status: String(row.status || "pending"),
    code: row.code || null,
    product_id: row.product_id || null,
    market: normalizeMarket(row.market) || "GLOBAL",
    product_listing_id: row.product_listing_id || null,
    product_title_snapshot: row.product_title_snapshot || row.subject || null,
    product_description_snapshot: row.product_description_snapshot || null,
    price_snapshot: row.price_snapshot === null || row.price_snapshot === undefined ? null : toNumber(row.price_snapshot),
    currency: String(row.currency || "USDT"),
    service_level_snapshot: row.service_level_snapshot || null,
    refund_policy_snapshot: row.refund_policy_snapshot || null,
    risk_notice_snapshot: row.risk_notice_snapshot || null,
    payment_method: row.payment_method || null,
    payment_network: normalizePaymentNetwork(row.payment_network),
    token: row.token || "USDT",
    payment_address: row.payment_address || null,
    expected_amount: row.expected_amount === null || row.expected_amount === undefined ? null : toNumber(row.expected_amount),
    received_amount: row.received_amount === null || row.received_amount === undefined ? null : toNumber(row.received_amount),
    tx_hash: row.tx_hash || row.crypto_tx_hash || null,
    confirmations: row.confirmations === null || row.confirmations === undefined ? null : toNumber(row.confirmations),
    payment_expired_at: row.payment_expired_at || null,
    payment_status: normalizePaymentStatus(row.payment_status),
    delivery_status: normalizeDeliveryStatus(row.delivery_status),
    risk_status: row.risk_status || null,
    manual_review_reason: row.manual_review_reason || null,
    payment_url: row.payment_url || null,
    gateway_resp: parseJson(row.gateway_resp),
    paid_at: row.paid_at || null,
    fulfilled_at: row.fulfilled_at || null,
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  }
}

export function getGlobalOrderExpiryDate() {
  const minutes = Math.max(5, Number(process.env.GLOBAL_ORDER_EXPIRE_MINUTES || 15))
  return new Date(Date.now() + minutes * 60 * 1000)
}

export function getRequiredConfirmations(network: PaymentNetwork | null) {
  if (network === "BEP20") return Math.max(1, Number(process.env.USDT_BEP20_CONFIRMATIONS_REQUIRED || 3))
  return Math.max(1, Number(process.env.USDT_TRC20_CONFIRMATIONS_REQUIRED || 1))
}

export async function createGlobalUsdtOrder(input: CreateGlobalOrderInput): Promise<GlobalOrder> {
  const product = input.product
  const result = await sql`
    INSERT INTO orders (
      out_trade_no,
      email,
      amount,
      subject,
      status,
      pay_channel,
      product_id,
      code,
      quantity,
      delivery_type,
      gateway_resp,
      query_password_hash,
      market,
      product_listing_id,
      product_title_snapshot,
      product_description_snapshot,
      price_snapshot,
      currency,
      service_level_snapshot,
      refund_policy_snapshot,
      risk_notice_snapshot,
      payment_method,
      payment_network,
      token,
      payment_address,
      expected_amount,
      received_amount,
      confirmations,
      payment_expired_at,
      payment_status,
      delivery_status,
      risk_status,
      customer_ip,
      customer_country,
      user_agent,
      payment_url,
      created_at,
      updated_at
    ) VALUES (
      ${input.orderNo},
      ${input.email},
      ${product.price},
      ${product.title},
      ${"pending"},
      ${"USDT"},
      ${product.product_id},
      ${null},
      ${1},
      ${product.delivery_type},
      ${JSON.stringify(input.gatewayResp)},
      ${null},
      ${"GLOBAL"},
      ${product.id},
      ${product.title},
      ${product.description || product.short_description || null},
      ${product.price},
      ${"USDT"},
      ${product.service_level || "USDT Self-Service Edition"},
      ${product.refund_policy || "Digital products are non-refundable after delivery."},
      ${product.risk_notice || "Wrong-network payments may result in permanent loss."},
      ${"usdt"},
      ${input.paymentNetwork},
      ${"USDT"},
      ${input.paymentAddress || null},
      ${input.expectedAmount},
      ${null},
      ${0},
      ${input.paymentExpiresAt},
      ${"unpaid"},
      ${"not_delivered"},
      ${"normal"},
      ${input.customerIp || null},
      ${input.customerCountry || null},
      ${input.userAgent || null},
      ${input.paymentUrl || null},
      NOW(),
      NOW()
    )
    RETURNING *
  `

  return mapGlobalOrder(result[0])
}

export async function getGlobalOrder(orderNo: string): Promise<GlobalOrder | null> {
  const result = await sql`
    SELECT *
    FROM orders
    WHERE out_trade_no = ${orderNo}
      AND market = 'GLOBAL'
    LIMIT 1
  `
  return result[0] ? mapGlobalOrder(result[0]) : null
}

export async function getGlobalOrderByEmail(orderNo: string, email: string): Promise<GlobalOrder | null> {
  const result = await sql`
    SELECT *
    FROM orders
    WHERE out_trade_no = ${orderNo}
      AND market = 'GLOBAL'
      AND LOWER(email) = LOWER(${email})
    LIMIT 1
  `
  return result[0] ? mapGlobalOrder(result[0]) : null
}

export async function updateGlobalOrder(orderNo: string, updates: Record<string, unknown>): Promise<GlobalOrder | null> {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined)
  if (entries.length === 0) return getGlobalOrder(orderNo)

  const setClauses = entries.map(([key], index) => `${key} = $${index + 2}`)
  const values = [orderNo, ...entries.map(([, value]) => value)]
  const result = await sql.query(
    `UPDATE orders SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE out_trade_no = $1 AND market = 'GLOBAL' RETURNING *`,
    values,
  )
  const row = result?.rows?.[0] || result?.[0]
  return row ? mapGlobalOrder(row) : null
}

export async function lockGlobalInventoryCodes(params: {
  orderNo: string
  productId: string
  quantity: number
  market?: Market
  inventoryMode?: InventoryMode
}): Promise<GlobalInventoryCode[]> {
  const market = normalizeMarket(params.market) || "GLOBAL"
  const inventoryMode = normalizeInventoryMode(params.inventoryMode)
  const result = await sql`
    UPDATE activation_codes
    SET status = 'locked', locked_by = ${params.orderNo}, locked_at = NOW()
    WHERE id IN (
      SELECT id
      FROM activation_codes
      WHERE product_id = ${params.productId}
        AND LOWER(status) = 'available'
        AND (
          (${inventoryMode} = 'separate' AND COALESCE(NULLIF(market, ''), 'SHARED') = ${market})
          OR (${inventoryMode} <> 'separate' AND COALESCE(NULLIF(market, ''), 'SHARED') = 'SHARED')
        )
      ORDER BY created_at ASC
      LIMIT ${params.quantity}
    )
    RETURNING id, code, status, product_id
  `

  return result as GlobalInventoryCode[]
}

export async function sellGlobalInventoryCodes(orderNo: string): Promise<GlobalInventoryCode[]> {
  const result = await sql`
    UPDATE activation_codes
    SET status = 'sold',
      sold_at = NOW(),
      delivered_at = NOW(),
      delivery_order_no = ${orderNo}
    WHERE locked_by = ${orderNo}
    RETURNING id, code, status, product_id
  `

  return result as GlobalInventoryCode[]
}
