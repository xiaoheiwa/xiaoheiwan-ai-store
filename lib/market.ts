export const MARKETS = ["CN", "GLOBAL"] as const
export type Market = (typeof MARKETS)[number]

export const INVENTORY_MARKETS = ["CN", "GLOBAL", "SHARED"] as const
export type InventoryMarket = (typeof INVENTORY_MARKETS)[number]

export const LISTING_STATUSES = ["draft", "published", "archived"] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

export const CURRENCIES = ["CNY", "USDT"] as const
export type MarketCurrency = (typeof CURRENCIES)[number]

export const PAYMENT_NETWORKS = ["TRC20", "BEP20"] as const
export type PaymentNetwork = (typeof PAYMENT_NETWORKS)[number]

export const INVENTORY_MODES = ["shared", "separate"] as const
export type InventoryMode = (typeof INVENTORY_MODES)[number]

export function normalizeMarket(value: unknown): Market | null {
  const normalized = String(value || "").trim().toUpperCase()
  return MARKETS.includes(normalized as Market) ? (normalized as Market) : null
}

export function normalizeInventoryMarket(value: unknown): InventoryMarket {
  const normalized = String(value || "").trim().toUpperCase()
  return INVENTORY_MARKETS.includes(normalized as InventoryMarket) ? (normalized as InventoryMarket) : "SHARED"
}

export function normalizeListingStatus(value: unknown): ListingStatus {
  const normalized = String(value || "").trim().toLowerCase()
  return LISTING_STATUSES.includes(normalized as ListingStatus) ? (normalized as ListingStatus) : "draft"
}

export function normalizeCurrency(value: unknown, market: Market): MarketCurrency {
  const normalized = String(value || "").trim().toUpperCase()
  if (CURRENCIES.includes(normalized as MarketCurrency)) return normalized as MarketCurrency
  return market === "GLOBAL" ? "USDT" : "CNY"
}

export function normalizePaymentNetwork(value: unknown): PaymentNetwork | null {
  const normalized = String(value || "").trim().toUpperCase()
  if (normalized === "USDT.TRC20" || normalized === "TRON") return "TRC20"
  if (normalized === "USDT.BEP20" || normalized === "BSC") return "BEP20"
  return PAYMENT_NETWORKS.includes(normalized as PaymentNetwork) ? (normalized as PaymentNetwork) : null
}

export function paymentNetworkToBepusdtTradeType(network: PaymentNetwork) {
  return network === "BEP20" ? "usdt.bep20" : "usdt.trc20"
}

export function bepusdtTradeTypeToPaymentNetwork(value: unknown): PaymentNetwork | null {
  const normalized = String(value || "").trim().toLowerCase()
  if (normalized === "usdt.trc20" || normalized === "trc20") return "TRC20"
  if (normalized === "usdt.bep20" || normalized === "bep20" || normalized === "bsc") return "BEP20"
  return null
}

export function normalizeInventoryMode(value: unknown): InventoryMode {
  const normalized = String(value || "").trim().toLowerCase()
  return INVENTORY_MODES.includes(normalized as InventoryMode) ? (normalized as InventoryMode) : "shared"
}

export function isGlobalStoreEnabled() {
  return String(process.env.GLOBAL_STORE_ENABLED || "").toLowerCase() === "true"
}
