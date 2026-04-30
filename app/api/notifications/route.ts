import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// GET - 获取当前激活的通知
export async function GET() {
  try {
    const notifications = await sql`
      SELECT id, title, content, is_active, updated_at 
      FROM notifications 
      WHERE is_active = true 
      ORDER BY updated_at DESC 
      LIMIT 1
    `
    
    if (notifications.length > 0) {
      return NextResponse.json({ 
        success: true, 
        notification: notifications[0] 
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      notification: null 
    })
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return NextResponse.json({ success: false, error: "获取通知失败" }, { status: 500 })
  }
}
