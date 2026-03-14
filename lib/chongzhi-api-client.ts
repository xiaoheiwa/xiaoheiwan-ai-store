export interface ApiResponse {
  success: boolean
  error?: string
  data?: any
  http_code?: number
  message?: string
}

export interface VerifyCodeResponse extends ApiResponse {
  data?: {
    code_status: "active" | "used"
    existing_record?: {
      bound_email_masked: string
    }
  }
}

export class ChongzhiProApiClient {
  private baseUrl = "https://chongzhi.pro"
  private timeout = 30000
  private userAgent =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1"

  async getSession(): Promise<string | null> {
    try {
      const response = await fetch(this.baseUrl + "/", {
        method: "GET",
        headers: {
          "Accept-Encoding": "gzip, deflate, br",
          "User-Agent": this.userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        },
      })

      if (!response.ok) return null

      const setCookieHeader = response.headers.get("set-cookie")
      if (setCookieHeader) {
        const match = setCookieHeader.match(/ios_gpt_session=([^;]+)/)
        if (match) return match[1]
      }

      return null
    } catch (error) {
      console.error("获取Session失败:", error)
      return null
    }
  }

  async verifyActivationCode(session: string, activationCode: string): Promise<VerifyCodeResponse> {
    try {
      const response = await fetch(this.baseUrl + "/api-verify.php", {
        method: "POST",
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
          Referer: this.baseUrl + "/",
          "Content-Type": "application/json",
          Origin: this.baseUrl,
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "zh-CN,zh-Hans;q=0.9",
          Cookie: `ios_gpt_session=${session}`,
        },
        body: JSON.stringify({
          activation_code: activationCode,
        }),
      })

      const result = await response.json()
      return {
        ...result,
        http_code: response.status,
      }
    } catch (error) {
      return {
        success: false,
        error: `网络错误: ${error instanceof Error ? error.message : "未知错误"}`,
      }
    }
  }

  async reuseRecord(session: string): Promise<ApiResponse> {
    try {
      const response = await fetch(this.baseUrl + "/api-recharge-reuse.php", {
        method: "POST",
        headers: {
          "User-Agent": this.userAgent,
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "zh-CN,zh-Hans;q=0.9",
          "Content-Type": "application/json",
          Referer: this.baseUrl + "/",
          Accept: "*/*",
          Origin: this.baseUrl,
          Cookie: `ios_gpt_session=${session}`,
        },
        body: JSON.stringify({
          action: "reuse_record",
        }),
      })

      const result = await response.json()
      return {
        ...result,
        http_code: response.status,
      }
    } catch (error) {
      return {
        success: false,
        error: `网络错误: ${error instanceof Error ? error.message : "未知错误"}`,
      }
    }
  }

  async submitRecharge(session: string, userDataJson: string): Promise<ApiResponse> {
    try {
      const response = await fetch(this.baseUrl + "/simple-submit-recharge.php", {
        method: "POST",
        headers: {
          Origin: this.baseUrl,
          "User-Agent": this.userAgent,
          Accept: "application/json",
          "Content-Type": "application/json",
          "Accept-Language": "zh-CN,zh-Hans;q=0.9",
          Referer: this.baseUrl + "/",
          "Accept-Encoding": "gzip, deflate, br",
          Cookie: `ios_gpt_session=${session}`,
        },
        body: JSON.stringify({
          user_data: userDataJson,
        }),
      })

      const result = await response.json()
      return {
        ...result,
        http_code: response.status,
      }
    } catch (error) {
      return {
        success: false,
        error: `网络错误: ${error instanceof Error ? error.message : "未知错误"}`,
      }
    }
  }

  async updateTokenAndRecharge(session: string, cardCode: string, userDataJson: string): Promise<ApiResponse> {
    try {
      const response = await fetch(this.baseUrl + "/api-recharge-reuse.php", {
        method: "POST",
        headers: {
          "User-Agent": this.userAgent,
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "zh-CN,zh-Hans;q=0.9",
          "Content-Type": "application/json",
          Referer: this.baseUrl + "/",
          Accept: "*/*",
          Origin: this.baseUrl,
          Cookie: `ios_gpt_session=${session}`,
        },
        body: JSON.stringify({
          action: "update_token_and_recharge",
          card_code: cardCode,
          json_data: userDataJson,
        }),
      })

      const result = await response.json()
      return {
        ...result,
        http_code: response.status,
      }
    } catch (error) {
      return {
        success: false,
        error: `网络错误: ${error instanceof Error ? error.message : "未知错误"}`,
      }
    }
  }
}
