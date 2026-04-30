import { NextResponse, NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAdminRequest } from "@/lib/admin-auth"

const sql = neon(process.env.DATABASE_URL!)

// GET - 获取所有通知
export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const notifications = await sql`
      SELECT id, title, content, is_active, created_at, updated_at 
      FROM notifications 
      ORDER BY updated_at DESC
    `
    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return NextResponse.json({ success: false, error: "获取通知失败" }, { status: 500 })
  }
}

// POST - 创建或更新通知
export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const { id, title, content, is_active } = await req.json()

    if (id) {
      // 更新现有通知
      await sql`
        UPDATE notifications 
        SET title = ${title}, 
            content = ${content}, 
            is_active = ${is_active}, 
            updated_at = NOW() 
        WHERE id = ${id}
      `
      return NextResponse.json({ success: true, message: "通知已更新" })
    } else {
      // 创建新通知
      const result = await sql`
        INSERT INTO notifications (title, content, is_active, created_at, updated_at) 
        VALUES (${title}, ${content}, ${is_active}, NOW(), NOW())
        RETURNING id
      `
      return NextResponse.json({ success: true, message: "通知已创建", id: result[0].id })
    }
  } catch (error) {
    console.error("[v0] Error saving notification:", error)
    return NextResponse.json({ success: false, error: "保存通知失败" }, { status: 500 })
  }
}

// DELETE - 删除通知
export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "缺少通知ID" }, { status: 400 })
    }

    await sql`DELETE FROM notifications WHERE id = ${id}`
    return NextResponse.json({ success: true, message: "通知已删除" })
  } catch (error) {
    console.error("[v0] Error deleting notification:", error)
    return NextResponse.json({ success: false, error: "删除通知失败" }, { status: 500 })
  }
}
