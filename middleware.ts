import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 授权验证中间件
// 在边缘函数中验证域名授权

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

// 简化的授权验证（边缘函数不支持 Node.js crypto，使用 Web Crypto API）
async function verifyLicenseEdge(licenseKey: string, currentDomain: string, secretKey: string): Promise<boolean> {
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
    // 解码授权码
    const decoded = atob(licenseKey)
    const [licensedDomain, signature] = decoded.split(":")
    
    if (!licensedDomain || !signature) {
      return false
    }

    // 使用 Web Crypto API 验证签名
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secretKey)
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(licensedDomain)
    )
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")

    // 验证签名和域名
    return signature === expectedSignature && licensedDomain === currentDomain
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

  // 获取授权码和密钥
  const licenseKey = process.env.LICENSE_KEY || ""
  const secretKey = process.env.LICENSE_SECRET_KEY || "your-super-secret-key-change-this"

  // 验证授权
  const isValid = await verifyLicenseEdge(licenseKey, currentDomain, secretKey)

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
    /*
     * 匹配所有路径除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
