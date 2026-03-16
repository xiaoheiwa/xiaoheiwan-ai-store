import { createHmac } from "crypto"

// 内置密钥 - 仅你知道，不要分享给客户
// 重要：修改为你自己的唯一密钥！
const INTERNAL_SECRET = "XHW-2024-SECRET-KEY-CHANGE-THIS-TO-YOUR-OWN"

export interface LicenseInfo {
  isValid: boolean
  domain: string
  expiresAt?: Date
  message: string
}

/**
 * 生成授权码（你在本地使用，为客户生成授权码）
 * 授权码格式：base64(domain|expiry|signature)
 * @param domain 授权的域名（如 example.com）
 * @param expiryDays 授权有效期天数（默认365天，设为0表示永久）
 * @returns 授权码
 */
export function generateLicenseKey(domain: string, expiryDays: number = 365): string {
  const normalizedDomain = normalizeDomain(domain)
  const expiry = expiryDays > 0 
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : "permanent"
  
  const data = `${normalizedDomain}|${expiry}`
  const signature = createHmac("sha256", INTERNAL_SECRET)
    .update(data)
    .digest("hex")
    .substring(0, 16) // 只取前16位，让授权码更短
  
  return Buffer.from(`${data}|${signature}`).toString("base64")
}

/**
 * 验证授权码
 * @param licenseKey 客户设置的授权码
 * @param currentDomain 当前访问的域名
 * @returns 验证结果
 */
export function verifyLicense(licenseKey: string, currentDomain: string): LicenseInfo {
  const normalizedCurrentDomain = normalizeDomain(currentDomain)
  
  // 开发环境、localhost、Vercel预览域名始终通过
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
    const parts = decoded.split("|")
    
    if (parts.length !== 3) {
      return {
        isValid: false,
        domain: normalizedCurrentDomain,
        message: "授权码格式无效"
      }
    }

    const [licensedDomain, expiry, signature] = parts

    // 验证签名
    const data = `${licensedDomain}|${expiry}`
    const expectedSignature = createHmac("sha256", INTERNAL_SECRET)
      .update(data)
      .digest("hex")
      .substring(0, 16)
    
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

    // 验证有效期
    if (expiry !== "permanent") {
      const expiryDate = new Date(expiry)
      if (expiryDate < new Date()) {
        return {
          isValid: false,
          domain: normalizedCurrentDomain,
          expiresAt: expiryDate,
          message: `授权已于 ${expiry} 过期，请联系开发者续费`
        }
      }
      return {
        isValid: true,
        domain: normalizedCurrentDomain,
        expiresAt: expiryDate,
        message: `授权有效，到期日期：${expiry}`
      }
    }

    return {
      isValid: true,
      domain: normalizedCurrentDomain,
      message: "永久授权验证通过"
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
  normalized = normalized.replace(/^https?:\/\//, "")
  normalized = normalized.split("/")[0]
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
