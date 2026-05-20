import crypto from "crypto"

type BepusdtPayload = Record<string, string | number | boolean | null | undefined>

export interface BepusdtTransactionData {
  fiat?: string
  trade_id: string
  order_id: string
  amount: string
  actual_amount?: string
  token?: string
  expiration_time?: number
  status?: number | string
  payment_url: string
}

interface BepusdtResponse<T> {
  status_code: number
  message: string
  data?: T
  request_id?: string
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
}

export function getBepusdtConfig() {
  const baseUrl = process.env.BEPUSDT_BASE_URL || process.env.EPUSDT_API || ""
  const apiToken = process.env.BEPUSDT_API_TOKEN || process.env.EPUSDT_KEY || ""

  return {
    baseUrl: baseUrl ? normalizeBaseUrl(baseUrl) : "",
    apiToken,
    fiat: process.env.BEPUSDT_FIAT || "CNY",
    tradeType: process.env.BEPUSDT_TRADE_TYPE || "usdt.trc20",
    timeout: Number(process.env.BEPUSDT_TIMEOUT || 1200),
    enabled: Boolean(baseUrl && apiToken),
  }
}

export function createBepusdtSignature(payload: BepusdtPayload, apiToken: string) {
  const signText = Object.entries(payload)
    .filter(([key, value]) => key !== "signature" && value !== null && value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  return crypto.createHash("md5").update(`${signText}${apiToken}`).digest("hex").toLowerCase()
}

export function verifyBepusdtSignature(payload: BepusdtPayload, apiToken: string) {
  const signature = String(payload.signature || "").toLowerCase()
  if (!signature) return false
  return createBepusdtSignature(payload, apiToken) === signature
}

async function postBepusdt<T>(path: string, payload: BepusdtPayload): Promise<BepusdtResponse<T>> {
  const config = getBepusdtConfig()
  if (!config.enabled) {
    throw new Error("BEPUSDT_NOT_CONFIGURED")
  }

  const signedPayload = {
    ...payload,
    signature: createBepusdtSignature(payload, config.apiToken),
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(signedPayload),
  })

  const text = await response.text()
  let json: BepusdtResponse<T>
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`BEPUSDT_BAD_RESPONSE:${text.slice(0, 200)}`)
  }

  if (!response.ok || json.status_code !== 200 || !json.data) {
    throw new Error(json.message || `BEPUSDT_HTTP_${response.status}`)
  }

  return json
}

export async function createBepusdtTransaction(params: {
  orderId: string
  amount: number
  name: string
  notifyUrl: string
  redirectUrl: string
}) {
  const config = getBepusdtConfig()

  return postBepusdt<BepusdtTransactionData>("/api/v1/order/create-transaction", {
    order_id: params.orderId,
    amount: Number(params.amount.toFixed(2)),
    fiat: config.fiat,
    trade_type: config.tradeType,
    name: params.name,
    notify_url: params.notifyUrl,
    redirect_url: params.redirectUrl,
    timeout: Math.max(120, config.timeout || 1200),
  })
}
