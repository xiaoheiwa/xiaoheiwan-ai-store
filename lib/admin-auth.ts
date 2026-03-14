import { type NextRequest, NextResponse } from "next/server"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

// ==================== Rate Limiting ====================

interface LoginAttempt {
  count: number
  lastAttempt: number
  lockedUntil: number
}

const loginAttempts = new Map<string, LoginAttempt>()

const RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutMs: 15 * 60 * 1000, // 15 minutes lockout
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, attempt] of loginAttempts.entries()) {
    if (now - attempt.lastAttempt > RATE_LIMIT.windowMs && now > attempt.lockedUntil) {
      loginAttempts.delete(key)
    }
  }
}, 60 * 1000) // Clean every minute

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

export function checkRateLimit(request: NextRequest): {
  allowed: boolean
  remaining: number
  retryAfterSeconds?: number
} {
  const ip = getClientIP(request)
  const now = Date.now()
  const attempt = loginAttempts.get(ip)

  if (!attempt) {
    return { allowed: true, remaining: RATE_LIMIT.maxAttempts }
  }

  // Check if currently locked out
  if (attempt.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((attempt.lockedUntil - now) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  // Reset if window has passed
  if (now - attempt.lastAttempt > RATE_LIMIT.windowMs) {
    loginAttempts.delete(ip)
    return { allowed: true, remaining: RATE_LIMIT.maxAttempts }
  }

  const remaining = RATE_LIMIT.maxAttempts - attempt.count
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) }
}

export function recordFailedLogin(request: NextRequest): void {
  const ip = getClientIP(request)
  const now = Date.now()
  const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, lockedUntil: 0 }

  // Reset if window has passed
  if (now - attempt.lastAttempt > RATE_LIMIT.windowMs) {
    attempt.count = 0
  }

  attempt.count++
  attempt.lastAttempt = now

  if (attempt.count >= RATE_LIMIT.maxAttempts) {
    attempt.lockedUntil = now + RATE_LIMIT.lockoutMs
  }

  loginAttempts.set(ip, attempt)
}

export function clearFailedLogins(request: NextRequest): void {
  const ip = getClientIP(request)
  loginAttempts.delete(ip)
}

// ==================== JWT ====================

const JWT_EXPIRY = "24h"

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set")
  }
  return new TextEncoder().encode(secret)
}

export async function createAdminToken(): Promise<string> {
  const secret = getJwtSecret()
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .setSubject("admin")
    .sign(secret)
  return token
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    return payload.sub === "admin" && payload.role === "admin"
  } catch {
    return false
  }
}

// ==================== Auth Middleware ====================

/**
 * Verify admin authentication from request.
 * Checks JWT from: 1) Authorization Bearer header, 2) admin_token cookie
 */
export async function verifyAdminRequest(request: NextRequest): Promise<boolean> {
  // Check Authorization header first
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1]
    if (await verifyAdminToken(token)) {
      return true
    }
  }

  // Fallback: check cookie
  const cookieToken = request.cookies.get("admin_token")?.value
  if (cookieToken && (await verifyAdminToken(cookieToken))) {
    return true
  }

  return false
}

/**
 * Returns 401 response if not authenticated.
 * Use in API routes: `const authError = await requireAdmin(request); if (authError) return authError;`
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const isValid = await verifyAdminRequest(request)
  if (!isValid) {
    return NextResponse.json(
      { error: "未授权访问，请重新登录" },
      { status: 401 }
    )
  }
  return null
}

// ==================== Password Verification ====================

export function verifyPassword(inputPassword: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.error("[v0] ADMIN_PASSWORD environment variable is not set")
    return false
  }
  // Constant-time comparison to prevent timing attacks
  if (inputPassword.length !== adminPassword.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < inputPassword.length; i++) {
    result |= inputPassword.charCodeAt(i) ^ adminPassword.charCodeAt(i)
  }
  return result === 0
}
