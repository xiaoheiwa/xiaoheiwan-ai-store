import { NextRequest, NextResponse } from "next/server"
import { ZPayz } from "@/lib/zpayz-client"

// 仅用于调试支付配置
export async function GET(request: NextRequest) {
  // 简单的管理员验证
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const config = ZPayz.getConfig()
  
  return NextResponse.json({
    message: "支付配置调试信息",
    config: {
      pid: config.pid ? `${config.pid.slice(0, 4)}...${config.pid.slice(-4)}` : "未设置",
      pidLength: config.pid?.length || 0,
      pkeySet: config.pkeySet,
      wxpayCid: config.wxpayCid || "未设置",
    },
    envVars: {
      ZPAYZ_PID: process.env.ZPAYZ_PID ? "已设置" : "未设置",
      ZPAYZ_PKEY: process.env.ZPAYZ_PKEY ? "已设置" : "未设置",
      ZPAYZ_WXPAY_CID: process.env.ZPAYZ_WXPAY_CID || "未设置",
    }
  })
}
