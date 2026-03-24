import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// GET - 获取激活的通知
export async function GET() {
  try {
    const notifications = await sql`
      SELECT id, title, content, created_at, updated_at
      FROM notifications
      WHERE is_active = true
      ORDER BY updated_at DESC
      LIMIT 1
    `
    
    return NextResponse.json({ notification: notifications[0] || null })
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json({ notification: null })
  }
}
