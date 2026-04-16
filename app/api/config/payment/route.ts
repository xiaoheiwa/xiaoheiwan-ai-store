import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Public API to get payment method settings
export async function GET() {
  try {
    const result = await sql`
      SELECT key, value FROM site_config 
      WHERE key IN ('payment_alipay_enabled', 'payment_usdt_enabled', 'payment_wxpay_enabled')
    `
    
    const config: Record<string, boolean> = {
      alipay: true,  // default enabled
      usdt: true,    // default enabled
      wxpay: false,  // default disabled
    }
    
    for (const row of result) {
      if (row.key === 'payment_alipay_enabled') {
        config.alipay = row.value === 'true'
      } else if (row.key === 'payment_usdt_enabled') {
        config.usdt = row.value === 'true'
      } else if (row.key === 'payment_wxpay_enabled') {
        config.wxpay = row.value === 'true'
      }
    }
    
    return NextResponse.json(config)
  } catch (error) {
    console.error("Payment config fetch error:", error)
    // Return defaults on error
    return NextResponse.json({ alipay: true, usdt: true, wxpay: false })
  }
}
