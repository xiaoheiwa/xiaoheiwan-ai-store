import crypto from "crypto"
import FormData from "form-data"

export interface ZPayzPaymentParams {
  name: string
  money: string
  type: "alipay" | "wxpay"
  out_trade_no: string
  notify_url: string
  return_url: string
  param?: string
  cid?: string
}

export interface ZPayzApiPaymentParams extends ZPayzPaymentParams {
  clientip: string
  device?: string
}

export class ZPayz {
  private static readonly BASE_URL = "https://zpayz.cn"
  private static readonly PID = process.env.ZPAYZ_PID || ""
  private static readonly PKEY = process.env.ZPAYZ_PKEY || ""

  static generateSign(params: Record<string, string>): string {
    // Remove sign, sign_type and empty values
    const filteredParams = Object.entries(params)
      .filter(
        ([key, value]) =>
          key !== "sign" && key !== "sign_type" && value !== "" && value !== undefined && value !== null,
      )
      .sort(([a], [b]) => a.localeCompare(b))

    // Create query string
    const queryString = filteredParams.map(([key, value]) => `${key}=${value}`).join("&")

    const signString = queryString + this.PKEY
    console.log("[v0] 🔐 ZPAYZ signature string:", signString.replace(this.PKEY, "***"))

    const signature = crypto.createHash("md5").update(signString).digest("hex").toLowerCase()
    console.log("[v0] 🔐 ZPAYZ generated signature:", signature)

    return signature
  }

  static verifySignature(params: Record<string, string>): boolean {
    const receivedSign = params.sign
    if (!receivedSign) {
      console.log("[v0] ❌ No signature found in params")
      return false
    }

    console.log("[v0] 🔐 ZPAYZ received signature:", receivedSign)
    const calculatedSign = this.generateSign(params)
    const isValid = receivedSign.toLowerCase() === calculatedSign.toLowerCase()

    if (!isValid) {
      console.log("[v0] ❌ Signature mismatch - received:", receivedSign, "calculated:", calculatedSign)
    }

    return isValid
  }

  static createPagePayment(params: ZPayzPaymentParams): string {
    const paymentParams = {
      ...params,
      pid: this.PID,
      sign_type: "MD5",
    }

    paymentParams.sign = this.generateSign(paymentParams)

    const queryString = Object.entries(paymentParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&")

    return `${this.BASE_URL}/submit.php?${queryString}`
  }

  static async createApiPayment(params: ZPayzApiPaymentParams): Promise<any> {
    const paymentParams = {
      ...params,
      pid: this.PID,
      sign_type: "MD5",
    }

    paymentParams.sign = this.generateSign(paymentParams)

    const formData = new FormData()
    Object.entries(paymentParams).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const response = await fetch(`${this.BASE_URL}/mapi.php`, {
      method: "POST",
      body: formData,
    })

    return response.json()
  }

  static async queryOrder(outTradeNo: string): Promise<any> {
    const url = `${this.BASE_URL}/api.php?act=order&pid=${this.PID}&key=${this.PKEY}&out_trade_no=${outTradeNo}`

    const response = await fetch(url, { method: "GET" })
    return response.json()
  }

  static async submitRefund(outTradeNo: string, money: string, tradeNo?: string): Promise<any> {
    const params: Record<string, string> = {
      pid: this.PID,
      key: this.PKEY,
      money,
      out_trade_no: outTradeNo,
    }

    if (tradeNo) {
      params.trade_no = tradeNo
    }

    const formData = new FormData()
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const response = await fetch(`${this.BASE_URL}/api.php?act=refund`, {
      method: "POST",
      body: formData,
    })

    return response.json()
  }
}
