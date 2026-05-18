import { NextRequest, NextResponse } from "next/server"

// Pixel API 代理路由 - 隐藏实际请求地址
const PIXEL_API_BASE = process.env.PIXEL_API_BASE || "https://pixel.yh-mo.xyz"

// 允许的 API 端点
const ALLOWED_ENDPOINTS = [
  "/api/verify-card",
  "/api/submit-task", 
  "/api/query-task",
  "/api/cancel-account",
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { endpoint, ...payload } = body

    // 验证端点是否允许
    if (!endpoint || !ALLOWED_ENDPOINTS.includes(endpoint)) {
      return NextResponse.json(
        { error: "Invalid endpoint" },
        { status: 400 }
      )
    }

    // 代理请求到实际 API
    const response = await fetch(`${PIXEL_API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[Pixel Proxy] Error:", error)
    return NextResponse.json(
      { error: "代理请求失败，请稍后重试" },
      { status: 500 }
    )
  }
}
