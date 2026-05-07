import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// GET - 获取所有推广用户列表
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    const referrers = await sql`
      SELECT id, name, referral_code, commission_rate, status, created_at
      FROM referrers
      WHERE status = 'active'
      ORDER BY created_at DESC
    `
    
    console.log("[v0] 获取推广用户列表:", referrers.length, "个")
    
    return NextResponse.json({
      success: true,
      data: referrers
    })
  } catch (error) {
    console.error("[v0] 获取推广用户失败:", error)
    return NextResponse.json({
      success: false,
      error: "获取推广用户列表失败"
    }, { status: 500 })
  }
}
