import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendTelegramMessageWithId } from "@/lib/telegram"
import { Redis } from "@upstash/redis"

const sql = neon(process.env.DATABASE_URL!)
const redis = Redis.fromEnv()

// Rate limit configuration
const MESSAGE_RATE_LIMIT = 5 // max messages per minute per session
const MESSAGE_RATE_WINDOW = 60 // seconds
const POLL_RATE_LIMIT = 30 // max polls per minute per session
const POLL_RATE_WINDOW = 60 // seconds
const MAX_SESSIONS_PER_IP = 10 // max sessions per IP per hour
const SESSION_RATE_WINDOW = 3600 // 1 hour
const MAX_CONTENT_LENGTH = 500 // reduced from 1000

// Spam keywords filter
const SPAM_KEYWORDS = [
  "赚钱", "兼职", "日赚", "加微信", "加QQ", "代理", "刷单",
  "casino", "gambling", "lottery", "bitcoin", "crypto investment",
  "免费", "红包", "福利群", "薅羊毛", "返利"
]

// Check if content contains spam
function isSpam(content: string): boolean {
  const lowerContent = content.toLowerCase()
  return SPAM_KEYWORDS.some(keyword => lowerContent.includes(keyword.toLowerCase()))
}

// Check for suspicious patterns (e.g., repeated characters, links)
function isSuspicious(content: string): boolean {
  // Check for repeated characters (e.g., "aaaaaaa")
  if (/(.)\1{10,}/.test(content)) return true
  // Check for too many URLs
  const urlCount = (content.match(/https?:\/\//g) || []).length
  if (urlCount > 2) return true
  // Check for suspicious unicode
  if (/[\u0000-\u001F]/.test(content)) return true
  return false
}

// Redis-based rate limiter
async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`
  
  try {
    const count = await redis.incr(windowKey)
    if (count === 1) {
      await redis.expire(windowKey, windowSeconds)
    }
    
    const remaining = Math.max(0, limit - count)
    const resetIn = windowSeconds - (now % windowSeconds)
    
    return { allowed: count <= limit, remaining, resetIn }
  } catch (error) {
    console.error("[v0] Rate limit check failed:", error)
    // Fail open but log the error
    return { allowed: true, remaining: limit, resetIn: windowSeconds }
  }
}

// Check IP-based session creation limit
async function checkIPSessionLimit(ip: string): Promise<boolean> {
  const key = `chat:ip:${ip}`
  try {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, SESSION_RATE_WINDOW)
    }
    return count <= MAX_SESSIONS_PER_IP
  } catch (error) {
    console.error("[v0] IP session limit check failed:", error)
    return true
  }
}

// Get or create a chat session
async function getOrCreateSession(sessionId: string, userInfo?: { name?: string; email?: string }) {
  const existing = await sql`SELECT * FROM chat_sessions WHERE id = ${sessionId}`
  if (existing.length > 0) {
    return existing[0]
  }
  
  // Create new session
  const result = await sql`
    INSERT INTO chat_sessions (id, user_name, user_email, status)
    VALUES (${sessionId}, ${userInfo?.name || null}, ${userInfo?.email || null}, 'active')
    RETURNING *
  `
  return result[0]
}

// GET - Fetch messages for a session
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")
  
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 })
  }
  
  // Validate session ID format (UUID)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 })
  }
  
  // Rate limit polling
  const pollLimit = await checkRateLimit(`poll:${sessionId}`, POLL_RATE_LIMIT, POLL_RATE_WINDOW)
  if (!pollLimit.allowed) {
    return NextResponse.json({ 
      error: "轮询过于频繁",
      retryAfter: pollLimit.resetIn
    }, { status: 429 })
  }
  
  try {
    const messages = await sql`
      SELECT id, sender, message as content, created_at 
      FROM chat_messages 
      WHERE session_id = ${sessionId}
      ORDER BY created_at ASC
      LIMIT 100
    `
    
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST - Send a new message
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, content, userName, userEmail } = body
    
    if (!sessionId || !content) {
      return NextResponse.json({ error: "Session ID and content required" }, { status: 400 })
    }
    
    // Validate session ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 })
    }
    
    // Content length check (reduced to 500)
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `消息过长，请控制在${MAX_CONTENT_LENGTH}字以内` }, { status: 400 })
    }
    
    // Validate userName and userEmail lengths
    if (userName && userName.length > 50) {
      return NextResponse.json({ error: "用户名过长" }, { status: 400 })
    }
    if (userEmail && userEmail.length > 100) {
      return NextResponse.json({ error: "邮箱过长" }, { status: 400 })
    }
    
    // Get client IP for session limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               "unknown"
    
    // Check IP-based session creation limit
    const ipAllowed = await checkIPSessionLimit(ip)
    if (!ipAllowed) {
      return NextResponse.json({ 
        error: "创建会话过于频繁，请稍后再试",
        retryAfter: 3600
      }, { status: 429 })
    }
    
    // Rate limit check using Redis
    const rateLimit = await checkRateLimit(`msg:${sessionId}`, MESSAGE_RATE_LIMIT, MESSAGE_RATE_WINDOW)
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: "发送过于频繁，请稍后再试",
        retryAfter: rateLimit.resetIn
      }, { status: 429 })
    }
    
    // Spam check
    if (isSpam(content)) {
      // Silently accept but don't notify admin (honeypot approach)
      return NextResponse.json({ success: true, message: { id: "blocked" } })
    }
    
    // Suspicious content check
    if (isSuspicious(content)) {
      // Log but allow - might be false positive
      console.warn("[v0] Suspicious chat content from IP:", ip, "sessionId:", sessionId)
    }
    
    // Get or create session
    await getOrCreateSession(sessionId, { name: userName, email: userEmail })
    
    // Save message
    const result = await sql`
      INSERT INTO chat_messages (session_id, sender, message)
      VALUES (${sessionId}, 'user', ${content})
      RETURNING *
    `
    
    // Update session last message time
    await sql`
      UPDATE chat_sessions 
      SET last_message_at = NOW(), 
          user_name = COALESCE(${userName || null}, user_name),
          user_email = COALESCE(${userEmail || null}, user_email)
      WHERE id = ${sessionId}
    `
    
    // Send notification to Telegram
    const telegramMessage = `
<b>💬 新客服消息</b>

<b>会话ID:</b> <code>${sessionId.slice(0, 8)}</code>
${userName ? `<b>用户:</b> ${userName}` : ""}
${userEmail ? `<b>邮箱:</b> ${userEmail}` : ""}

<b>消息内容:</b>
${content}

<i>直接回复此消息即可回复客户</i>
`.trim()
    
    const telegramResult = await sendTelegramMessageWithId(telegramMessage)
    
    // Save telegram message_id for reply tracking
    if (telegramResult.ok && telegramResult.messageId) {
      await sql`
        UPDATE chat_sessions 
        SET telegram_message_id = ${telegramResult.messageId}
        WHERE id = ${sessionId}
      `
    }
    
    return NextResponse.json({ success: true, message: result[0] })
  } catch (error) {
    console.error("Failed to send message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
