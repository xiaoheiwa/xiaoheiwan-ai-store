import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { handleUserCommand } from "@/lib/telegram-commands"

const sql = neon(process.env.DATABASE_URL!)

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID

// Feature flag - set to true to enable user bot features
const ENABLE_USER_BOT = process.env.TELEGRAM_BOT_ENABLED === "true"

// Send message to Telegram
async function sendTelegramReply(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return false
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const update = await request.json()
    console.log("[v0] Telegram webhook received:", JSON.stringify(update))
    
    // Handle message from Telegram
    const message = update.message
    if (!message || !message.text) {
      console.log("[v0] No message text in update")
      return NextResponse.json({ ok: true })
    }
    
    const chatId = message.chat.id.toString()
    const text = message.text
    console.log("[v0] Chat ID:", chatId, "Admin ID:", ADMIN_CHAT_ID, "Text:", text)
    
    // Handle user commands (non-admin) - only if feature is enabled
    if (chatId !== ADMIN_CHAT_ID) {
      if (ENABLE_USER_BOT) {
        try {
          await handleUserCommand(message)
        } catch (err) {
          console.error("[v0] User command error:", err)
        }
      }
      return NextResponse.json({ ok: true })
    }
    
    // Handle direct reply to a message (Telegram reply feature)
    if (message.reply_to_message) {
      const replyToMessageId = message.reply_to_message.message_id
      const replyContent = text.trim()
      
      // Skip if it's a command
      if (replyContent.startsWith("/")) {
        // Let the command handlers below process it
      } else {
        // Find session by telegram_message_id
        const sessions = await sql`
          SELECT id FROM chat_sessions 
          WHERE telegram_message_id = ${replyToMessageId}
          LIMIT 1
        `
        
        if (sessions.length > 0) {
          const sessionId = sessions[0].id
          
          // Save admin reply
          await sql`
            INSERT INTO chat_messages (session_id, sender, message)
            VALUES (${sessionId}, 'admin', ${replyContent})
          `
          
          // Update session timestamp
          await sql`
            UPDATE chat_sessions SET last_message_at = NOW() WHERE id = ${sessionId}
          `
          
          await sendTelegramReply(chatId, `✅ 已回复客户`)
          return NextResponse.json({ ok: true })
        } else {
          await sendTelegramReply(chatId, `❌ 无法识别此会话，请使用 /reply 命令`)
          return NextResponse.json({ ok: true })
        }
      }
    }
    
    // Check for reply command: /reply SESSION_ID message
    const replyMatch = text.match(/^\/reply\s+([a-f0-9-]+)\s+(.+)$/is)
    if (replyMatch) {
      const sessionIdPrefix = replyMatch[1].toLowerCase()
      const replyContent = replyMatch[2].trim()
      
      // Find session by prefix
      const sessions = await sql`
        SELECT id FROM chat_sessions 
        WHERE id LIKE ${sessionIdPrefix + '%'}
        ORDER BY last_message_at DESC
        LIMIT 1
      `
      
      if (sessions.length === 0) {
        await sendTelegramReply(chatId, `❌ 未找到会话: ${sessionIdPrefix}`)
        return NextResponse.json({ ok: true })
      }
      
      const sessionId = sessions[0].id
      
      // Save admin reply to database
      await sql`
        INSERT INTO chat_messages (session_id, sender, message)
        VALUES (${sessionId}, 'admin', ${replyContent})
      `
      
      // Update session
      await sql`
        UPDATE chat_sessions SET last_message_at = NOW() WHERE id = ${sessionId}
      `
      
      await sendTelegramReply(chatId, `✅ 已回复会话 ${sessionIdPrefix}`)
      return NextResponse.json({ ok: true })
    }
    
    // Check for close command: /close SESSION_ID
    const closeMatch = text.match(/^\/close\s+([a-f0-9-]+)$/i)
    if (closeMatch) {
      const sessionIdPrefix = closeMatch[1].toLowerCase()
      
      const result = await sql`
        UPDATE chat_sessions 
        SET status = 'closed' 
        WHERE id LIKE ${sessionIdPrefix + '%'}
        RETURNING id
      `
      
      if (result.length > 0) {
        await sendTelegramReply(chatId, `✅ 已关闭会话 ${sessionIdPrefix}`)
      } else {
        await sendTelegramReply(chatId, `❌ 未找到会话: ${sessionIdPrefix}`)
      }
      return NextResponse.json({ ok: true })
    }
    
    // Check for list command: /chats
    if (text.trim() === "/chats") {
      const activeSessions = await sql`
        SELECT id, user_name, user_email, last_message_at 
        FROM chat_sessions 
        WHERE status = 'active'
        ORDER BY last_message_at DESC
        LIMIT 10
      `
      
      if (activeSessions.length === 0) {
        await sendTelegramReply(chatId, "📭 暂无活跃会话")
      } else {
        let list = "<b>📋 活跃会话列表:</b>\n\n"
        for (const s of activeSessions) {
          list += `<code>${s.id.slice(0, 8)}</code> - ${s.user_name || "匿名"}\n`
        }
        list += "\n<i>使用 /reply ID 消息 来回复</i>"
        await sendTelegramReply(chatId, list)
      }
      return NextResponse.json({ ok: true })
    }
    
    // Admin test user bot - /test command to simulate user mode
    if (text.trim().startsWith("/test ")) {
      const testCommand = text.replace("/test ", "").trim()
      const fakeMessage = { ...message, text: testCommand }
      try {
        await handleUserCommand(fakeMessage)
        return NextResponse.json({ ok: true })
      } catch (err) {
        console.error("[v0] Admin test error:", err)
        await sendTelegramReply(chatId, `❌ 测试出错: ${err}`)
        return NextResponse.json({ ok: true })
      }
    }

    // Help command
    if (text.trim() === "/help" || text.trim() === "/start") {
      const helpText = `
<b>🤖 客服机器人命令:</b>

/chats - 查看活跃会话列表
/reply ID 消息 - 回复指定会话
/close ID - 关闭会话
/test 命令 - 测试用户Bot功能

<i>会话ID只需输入前8位即可</i>
<i>例如: /test /products 查看商品</i>
      `.trim()
      await sendTelegramReply(chatId, helpText)
      return NextResponse.json({ ok: true })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Telegram webhook error:", error)
    return NextResponse.json({ ok: true })
  }
}

// Verify webhook (for Telegram setup)
export async function GET() {
  return NextResponse.json({ status: "Telegram webhook active" })
}
