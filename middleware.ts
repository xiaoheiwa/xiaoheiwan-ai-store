import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 授权验证中间件 - 简化版，客户只需设置 LICENSE_KEY

// 内置密钥 - 与 lib/license.ts 和 scripts/generate-license.js 保持一致
const INTERNAL_SECRET = "XHW-2024-SECRET-KEY-CHANGE-THIS-TO-YOUR-OWN"

// 不需要授权验证的路径
const PUBLIC_PATHS = [
  "/unauthorized",
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]

// 简化的域名标准化
function normalizeDomain(domain: string): string {
  let normalized = domain.toLowerCase()
  normalized = normalized.replace(/^https?:\/\//, "")
  normalized = normalized.split("/")[0]
  normalized = normalized.replace(/^www\./, "")
  return normalized
}

// 使用 Web Crypto API 验证授权（边缘函数兼容）
async function verifyLicenseEdge(licenseKey: string, currentDomain: string): Promise<boolean> {
  // 开发环境或特殊域名始终通过
  if (
    currentDomain === "localhost" ||
    currentDomain.includes("localhost:") ||
    currentDomain.endsWith(".vercel.app") ||
    currentDomain.endsWith(".v0.build")
  ) {
    return true
  }

  if (!licenseKey) {
    return false
  }

  try {
    // 解码授权码：格式为 base64(domain|expiry|signature)
    const decoded = atob(licenseKey)
    const parts = decoded.split("|")
    
    if (parts.length !== 3) {
      return false
    }

    const [licensedDomain, expiry, signature] = parts

    // 验证域名匹配
    if (licensedDomain !== currentDomain) {
      return false
    }

    // 验证有效期
    if (expiry !== "permanent") {
      const expiryDate = new Date(expiry)
      if (expiryDate < new Date()) {
        return false
      }
    }

    // 使用 Web Crypto API 验证签名
    const encoder = new TextEncoder()
    const keyData = encoder.encode(INTERNAL_SECRET)
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    
    const data = `${licensedDomain}|${expiry}`
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(data)
    )
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 16)

    return signature === expectedSignature
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 跳过公开路径
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 获取当前域名
  const host = request.headers.get("host") || ""
  const currentDomain = normalizeDomain(host)

  // 获取授权码
  const licenseKey = process.env.LICENSE_KEY || ""

  // 验证授权
  const isValid = await verifyLicenseEdge(licenseKey, currentDomain)

  if (!isValid) {
    // 重定向到未授权页面
    const url = request.nextUrl.clone()
    url.pathname = "/unauthorized"
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
