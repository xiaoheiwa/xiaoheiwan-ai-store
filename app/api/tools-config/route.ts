import { NextResponse } from "next/server"
import { neon } from "@/lib/db-client"

// 工具配置缓存 10 分钟
export const revalidate = 600

const sql = neon(process.env.DATABASE_URL!)

// 公开 API - 获取工具配置（用于导航栏）
export async function GET() {
  try {
    const result = await sql`
      SELECT value FROM system_settings WHERE key = 'tools_config'
    `
    
    const defaultConfig = {
      twofa: true,
      gmailChecker: true,
    }
    
    if (result.length === 0) {
      return NextResponse.json(defaultConfig)
    }
    
    const config = JSON.parse(result[0].value)
    return NextResponse.json({ ...defaultConfig, ...config })
  } catch (error) {
    console.error("[v0] Get tools config error:", error)
    return NextResponse.json({ twofa: true, gmailChecker: true })
  }
}
