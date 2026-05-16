import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// 获取白名单列表
export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM risk_whitelist 
      WHERE expires_at IS NULL OR expires_at > NOW()
      ORDER BY created_at DESC
    `
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error("Failed to fetch whitelist:", error)
    return NextResponse.json({ error: "获取白名单失败" }, { status: 500 })
  }
}

// 添加白名单
export async function POST(req: Request) {
  try {
    const { type, value, reason } = await req.json()
    
    if (!value) {
      return NextResponse.json({ error: "值不能为空" }, { status: 400 })
    }
    
    await sql`
      INSERT INTO risk_whitelist (type, value, reason, created_by)
      VALUES (${type || 'email'}, ${value}, ${reason || '管理员手动添加'}, ${'admin'})
      ON CONFLICT (type, value) DO UPDATE SET reason = ${reason || '管理员手动添加'}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to add to whitelist:", error)
    return NextResponse.json({ error: "添加白名单失败" }, { status: 500 })
  }
}

// 删除白名单
export async function DELETE(req: Request) {
  try {
    const { type, value } = await req.json()
    
    await sql`
      DELETE FROM risk_whitelist 
      WHERE type = ${type || 'email'} AND LOWER(value) = LOWER(${value})
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to remove from whitelist:", error)
    return NextResponse.json({ error: "删除白名单失败" }, { status: 500 })
  }
}
