import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendTelegramMessageWithId } from "@/lib/telegram"

const sql = neon(process.env.DATABASE_URL!)

// Rate limit: max messages per session per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_MESSAGES_PER_WINDOW = 5

// Spam keywords filter (add more as needed)
const SPAM_KEYWORDS = [
  "赚钱", "兼职", "日赚", "加微信", "加QQ", "代理", "刷单",
  "casino", "gambling", "lottery", "bitcoin", "crypto investment"
]

// Check if content contains spam
function isSpam(content: string): boolean {
  const lowerContent = content.toLowerCase()
  return SPAM_KEYWORDS.some(keyword => lowerContent.includes(keyword.toLowerCase()))
}

// Simple in-memory rate limiter (for serverless, consider using Redis/Upstash)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(sessionId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(sessionId)
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: MAX_MESSAGES_PER_WINDOW - 1 }
  }
  
  if (record.count >= MAX_MESSAGES_PER_WINDOW) {
    return { allowed: false, remaining: 0 }
  }
  
  record.count++
  return { allowed: true, remaining: MAX_MESSAGES_PER_WINDOW - record.count }
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
  
  try {
    const messages = await sql`
      SELECT id, sender, message as content, created_at 
      FROM chat_messages 
      WHERE session_id = ${sessionId}
      ORDER BY created_at ASC
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
    
    // Content length check
    if (content.length > 1000) {
      return NextResponse.json({ error: "消息过长，请控制在1000字以内" }, { status: 400 })
    }
    
    // Rate limit check
    const rateLimit = checkRateLimit(sessionId)
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: "发送过于频繁，请稍后再试",
        retryAfter: 60
      }, { status: 429 })
    }
    
    // Spam check
    if (isSpam(content)) {
      // Silently accept but don't notify admin (honeypot approach)
      return NextResponse.json({ success: true, message: { id: "blocked" } })
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
