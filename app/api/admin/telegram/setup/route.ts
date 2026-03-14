import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import type { NextRequest } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { action } = body

    if (action === "set") {
      // Get the site URL from request
      const url = new URL(request.url)
      const webhookUrl = `${url.protocol}//${url.host}/api/telegram/webhook`

      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      })

      const result = await response.json()
      
      if (result.ok) {
        return NextResponse.json({ success: true, message: `Webhook set to: ${webhookUrl}` })
      } else {
        return NextResponse.json({ error: result.description || "Failed to set webhook" }, { status: 500 })
      }
    }

    if (action === "delete") {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`, {
        method: "POST",
      })

      const result = await response.json()
      
      if (result.ok) {
        return NextResponse.json({ success: true, message: "Webhook deleted" })
      } else {
        return NextResponse.json({ error: result.description || "Failed to delete webhook" }, { status: 500 })
      }
    }

    if (action === "info") {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
      const result = await response.json()
      
      return NextResponse.json({ success: true, info: result.result })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Telegram setup error:", error)
    return NextResponse.json({ error: "Failed to setup webhook" }, { status: 500 })
  }
}
