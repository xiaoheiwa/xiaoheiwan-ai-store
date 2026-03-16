import { createHmac } from "crypto"

// 授权验证系统
// 你需要保管好这个密钥，用于生成客户的授权码
// 建议将此密钥设置为环境变量 LICENSE_SECRET_KEY
const SECRET_KEY = process.env.LICENSE_SECRET_KEY || "your-super-secret-key-change-this"

export interface LicenseInfo {
  isValid: boolean
  domain: string
  message: string
}

/**
 * 生成授权码（你在本地使用，为客户生成授权码）
 * @param domain 授权的域名（如 example.com）
 * @param secretKey 你的私钥
 * @returns 授权码
 */
export function generateLicenseKey(domain: string, secretKey: string = SECRET_KEY): string {
  const normalizedDomain = normalizeDomain(domain)
  const signature = createHmac("sha256", secretKey)
    .update(normalizedDomain)
    .digest("hex")
  // 返回 base64 编码的授权码（域名:签名）
  return Buffer.from(`${normalizedDomain}:${signature}`).toString("base64")
}

/**
 * 验证授权码
 * @param licenseKey 客户设置的授权码
 * @param currentDomain 当前访问的域名
 * @returns 验证结果
 */
export function verifyLicense(licenseKey: string, currentDomain: string): LicenseInfo {
  const normalizedCurrentDomain = normalizeDomain(currentDomain)
  
  // 开发环境或 localhost 始终通过
  if (
    process.env.NODE_ENV === "development" ||
    normalizedCurrentDomain === "localhost" ||
    normalizedCurrentDomain.includes("localhost:") ||
    normalizedCurrentDomain.endsWith(".vercel.app") ||
    normalizedCurrentDomain.endsWith(".v0.build")
  ) {
    return {
      isValid: true,
      domain: normalizedCurrentDomain,
      message: "开发环境授权"
    }
  }

  if (!licenseKey) {
    return {
      isValid: false,
      domain: normalizedCurrentDomain,
      message: "未配置授权码，请联系开发者获取授权"
    }
  }

  try {
    // 解码授权码
    const decoded = Buffer.from(licenseKey, "base64").toString("utf-8")
    const [licensedDomain, signature] = decoded.split(":")
    
    if (!licensedDomain || !signature) {
      return {
        isValid: false,
        domain: normalizedCurrentDomain,
        message: "授权码格式无效"
      }
    }

    // 验证签名
    const expectedSignature = createHmac("sha256", SECRET_KEY)
      .update(licensedDomain)
      .digest("hex")
    
    if (signature !== expectedSignature) {
      return {
        isValid: false,
        domain: normalizedCurrentDomain,
        message: "授权码签名无效"
      }
    }

    // 验证域名匹配
    if (licensedDomain !== normalizedCurrentDomain) {
      return {
        isValid: false,
        domain: normalizedCurrentDomain,
        message: `授权码仅适用于 ${licensedDomain}，当前域名 ${normalizedCurrentDomain} 未授权`
      }
    }

    return {
      isValid: true,
      domain: normalizedCurrentDomain,
      message: "授权验证通过"
    }
  } catch {
    return {
      isValid: false,
      domain: normalizedCurrentDomain,
      message: "授权码解析失败"
    }
  }
}

/**
 * 标准化域名（去除协议、端口、www前缀、尾部斜杠）
 */
function normalizeDomain(domain: string): string {
  let normalized = domain.toLowerCase()
  // 去除协议
  normalized = normalized.replace(/^https?:\/\//, "")
  // 去除尾部斜杠和路径
  normalized = normalized.split("/")[0]
  // 去除 www 前缀
  normalized = normalized.replace(/^www\./, "")
  return normalized
}

/**
 * 从请求头获取当前域名
 */
export function getDomainFromRequest(request: Request): string {
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || ""
  return normalizeDomain(host)
}
