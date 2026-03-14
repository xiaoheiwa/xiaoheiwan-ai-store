import { NextResponse } from "next/server"

export async function GET() {
  const address = process.env.USDT_WALLET_ADDRESS
  
  if (!address) {
    return NextResponse.json({ error: "USDT钱包地址未配置" }, { status: 500 })
  }
  
  return NextResponse.json({ address, network: "TRC20" })
}
