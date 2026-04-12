import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// 获取工具配置
export async function GET() {
  try {
    // 从 system_settings 表获取工具配置
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

// 更新工具配置
export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    
    // 保存到 system_settings 表
    await sql`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('tools_config', ${JSON.stringify(config)}, NOW())
      ON CONFLICT (key) 
      DO UPDATE SET value = ${JSON.stringify(config)}, updated_at = NOW()
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Save tools config error:", error)
    return NextResponse.json({ error: "保存失败" }, { status: 500 })
  }
}
