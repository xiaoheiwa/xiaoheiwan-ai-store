import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// GET - Get enabled payment methods
export async function GET() {
  try {
    const configs = await sql`
      SELECT key, value FROM site_config 
      WHERE key IN ('payment_alipay_enabled', 'payment_usdt_enabled', 'payment_wxpay_enabled')
    `

    const result: Record<string, boolean> = {
      alipay: true,  // Default enabled
      usdt: false,   // Default disabled - must enable manually in admin
      wxpay: false,  // Default disabled - need to enable manually
    }

    for (const config of configs) {
      if (config.key === "payment_alipay_enabled") {
        result.alipay = config.value === "true"
      } else if (config.key === "payment_usdt_enabled") {
        result.usdt = config.value === "true"
      } else if (config.key === "payment_wxpay_enabled") {
        result.wxpay = config.value === "true"
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get payment methods error:", error)
    // Return safe defaults on error - only alipay enabled
    return NextResponse.json({ alipay: true, usdt: false, wxpay: false })
  }
}
