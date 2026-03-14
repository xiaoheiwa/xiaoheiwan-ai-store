import crypto from "crypto"

interface XunhupayConfig {
  appid: string
  appSecret: string
  apiUrl: string
}

interface PaymentOptions {
  order_id: string
  money: number
  title: string
  backendUrl: string
}

interface PaymentParams {
  version: string
  appid: string
  trade_order_id: string
  total_fee: number
  title: string
  time: number
  notify_url: string
  nonce_str: string
  type: string
  wap_url: string
  wap_name: string
}

function nowDate(): number {
  return Math.floor(new Date().valueOf() / 1000)
}

function uuid(): string {
  return Date.now().toString(16).slice(0, 6) + "-" + Math.random().toString(16).slice(2, 8)
}

function getHash(params: Record<string, any>, appSecret: string): string {
  const sortedParams = Object.keys(params)
    .filter((key) => params[key] && key !== "hash") // 过滤掉空值和hash本身
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&")
  const stringSignTemp = sortedParams + appSecret
  const hash = crypto.createHash("md5").update(stringSignTemp).digest("hex")
  return hash
}

export class XunhupayClient {
  private config: XunhupayConfig

  constructor(config: XunhupayConfig) {
    this.config = config
  }

  async createPayment(options: PaymentOptions): Promise<{ paymentUrl: string; orderNo: string }> {
    const params: PaymentParams = {
      version: "1.1",
      appid: this.config.appid,
      trade_order_id: options.order_id,
      total_fee: options.money,
      title: options.title,
      time: nowDate(),
      notify_url: `${options.backendUrl}/api/pay/xunhupay/notify`,
      nonce_str: uuid(),
      type: "WAP",
      wap_url: "http://www.xunhupay.com",
      wap_name: "http://www.xunhupay.com",
    }

    const hash = getHash(params, this.config.appSecret)

    const requestParams = new URLSearchParams({
      ...params,
      hash,
    } as any)

    try {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestParams,
      })

      const result = await response.json()

      return {
        paymentUrl: result.url || result.payment_url,
        orderNo: options.order_id,
      }
    } catch (error) {
      console.error("Xunhupay payment creation error:", error)
      throw new Error("Failed to create payment")
    }
  }

  verifySignature(data: Record<string, any>): boolean {
    const receivedHash = data.hash
    const calculatedHash = getHash(data, this.config.appSecret)
    return receivedHash === calculatedHash
  }

  isPaymentSuccessful(data: Record<string, any>): boolean {
    return data.status === "OD"
  }
}

export const xunhupay = new XunhupayClient({
  appid: process.env.XUNHUPAY_APPID || "",
  appSecret: process.env.XUNHUPAY_APP_SECRET || "",
  apiUrl: "https://api.xunhupay.com/payment/do.html",
})
