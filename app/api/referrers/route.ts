import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// GET - 获取所有推广用户列表
export async function GET() {
  try {
    const sql = getDb()
    
    const referrers = await sql`
      SELECT 
        id, 
        username as name, 
        email,
        referral_code, 
        commission_rate, 
        status, 
        total_orders,
        total_earnings,
        available_balance,
        created_at
      FROM referrers
      WHERE status = 'active'
      ORDER BY created_at DESC
    `
    
    return NextResponse.json({
      success: true,
      data: referrers
    })
  } catch (error) {
    console.error("[v0] 获取推广用户失败:", error)
    return NextResponse.json({
      success: false,
      error: "获取推广用户列表失败: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}
