import { NextResponse } from "next/server"
import { neon } from "@/lib/db-client"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)
const PAYMENT_GATEWAY_EMERGENCY_HOLD = process.env.PAYMENT_GATEWAY_EMERGENCY_HOLD === "true"

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

    return NextResponse.json(PAYMENT_GATEWAY_EMERGENCY_HOLD ? { ...result, alipay: false, wxpay: false } : result)
  } catch (error) {
    console.error("Get payment methods error:", error)
    return NextResponse.json(PAYMENT_GATEWAY_EMERGENCY_HOLD
      ? { alipay: false, usdt: false, wxpay: false }
      : { alipay: true, usdt: false, wxpay: false })
  }
}
