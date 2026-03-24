import { neon } from "@neondatabase/serverless"
import { NextResponse, NextRequest } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"

const sql = neon(process.env.DATABASE_URL!)

// GET - 获取所有通知
export async function GET(request: NextRequest) {
  const adminId = await verifyAdminSession(request)
  if (!adminId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const notifications = await sql`
      SELECT * FROM notifications
      ORDER BY updated_at DESC
    `
    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}

// POST - 创建或更新通知
export async function POST(request: NextRequest) {
  const adminId = await verifyAdminSession(request)
  if (!adminId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const { id, title, content, is_active } = await request.json()

    if (id) {
      // 更新现有通知
      await sql`
        UPDATE notifications
        SET title = ${title}, content = ${content}, is_active = ${is_active}, updated_at = NOW()
        WHERE id = ${id}
      `
    } else {
      // 创建新通知
      await sql`
        INSERT INTO notifications (title, content, is_active, created_at, updated_at)
        VALUES (${title}, ${content}, ${is_active}, NOW(), NOW())
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save notification:", error)
    return NextResponse.json({ error: "保存失败" }, { status: 500 })
  }
}

// DELETE - 删除通知
export async function DELETE(request: NextRequest) {
  const adminId = await verifyAdminSession(request)
  if (!adminId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    await sql`DELETE FROM notifications WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete notification:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
