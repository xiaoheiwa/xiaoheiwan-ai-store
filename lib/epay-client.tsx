import crypto from "crypto"

export interface PaymentRequest {
  pid: string
  type: string
  out_trade_no: string
  notify_url: string
  return_url: string
  name: string
  money: string
  clientip: string
  device?: string
  param?: string
  sign_type: string
  sign: string
}

export interface PaymentResponse {
  code: number
  msg: string
  pid: string
  trade_no: string
  out_trade_no: string
  type: string
  name: string
  money: string
  trade_status: string
  sign: string
}

export class EPay {
  private static readonly API_URL = process.env.EPAY_API_URL || "https://code.ymyu.cn/mapi.php"
  private static readonly PID = process.env.EPAY_PID || ""
  private static readonly KEY = process.env.EPAY_KEY || ""

  static generateSign(params: Record<string, string>, key: string): string {
    // Remove sign and sign_type from params
    const filteredParams = Object.fromEntries(Object.entries(params).filter(([k]) => k !== "sign" && k !== "sign_type"))

    // Sort parameters by key
    const sortedKeys = Object.keys(filteredParams).sort()

    // Create query string
    const queryString = sortedKeys.map((key) => `${key}=${filteredParams[key]}`).join("&")

    // Add key
    const stringToSign = `${queryString}${key}`

    // Generate MD5 hash
    return crypto.createHash("md5").update(stringToSign).digest("hex")
  }

  static createPayment(params: {
    out_trade_no: string
    name: string
    money: number
    notify_url: string
    return_url: string
    type: "alipay" | "wxpay"
    clientip: string
  }): PaymentRequest {
    const paymentParams = {
      pid: this.PID,
      type: params.type,
      out_trade_no: params.out_trade_no,
      notify_url: params.notify_url,
      return_url: params.return_url,
      name: params.name,
      money: params.money.toFixed(2),
      clientip: params.clientip,
      sign_type: "MD5",
    }

    const sign = this.generateSign(paymentParams, this.KEY)

    return {
      ...paymentParams,
      sign,
    }
  }

  static verifySignature(params: Record<string, string>): boolean {
    const receivedSign = params.sign
    if (!receivedSign) return false

    const calculatedSign = this.generateSign(params, this.KEY)
    return receivedSign.toLowerCase() === calculatedSign.toLowerCase()
  }

  static getPaymentUrl(paymentRequest: PaymentRequest): string {
    const queryParams = new URLSearchParams(paymentRequest as any)
    return `${this.API_URL}?${queryParams.toString()}`
  }

  static createPaymentForm(paymentRequest: PaymentRequest): string {
    const formFields = Object.entries(paymentRequest)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
      .join("\n")

    return `
      <form id="epay-form" action="${this.API_URL}" method="post" style="display:none;">
        ${formFields}
      </form>
      <script>
        document.getElementById('epay-form').submit();
      </script>
    `
  }
}

export const createPayment = EPay.createPayment
export const verifySignature = EPay.verifySignature
