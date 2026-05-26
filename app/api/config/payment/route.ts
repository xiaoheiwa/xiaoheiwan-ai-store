import { NextResponse } from "next/server"
import { neon } from "@/lib/db-client"

const sql = neon(process.env.DATABASE_URL!)
const PAYMENT_GATEWAY_EMERGENCY_HOLD = process.env.PAYMENT_GATEWAY_EMERGENCY_HOLD === "true"

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
    
    return NextResponse.json(PAYMENT_GATEWAY_EMERGENCY_HOLD ? { ...config, alipay: false, wxpay: false } : config)
  } catch (error) {
    console.error("Payment config fetch error:", error)
    return NextResponse.json(PAYMENT_GATEWAY_EMERGENCY_HOLD
      ? { alipay: false, usdt: true, wxpay: false }
      : { alipay: true, usdt: true, wxpay: false })
  }
}
