import { NextRequest, NextResponse } from "next/server"

const BASE_URL = "https://team.opensora.de"

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()

    // Map actions to their corresponding API paths and methods
    const routeMap: Record<string, { path: string; method?: string }> = {
      redeem: { path: "/api/redeem" },
      query: { path: "/query" },
      verify_create: { path: "/api/verify_create" },
      verify_status: { path: "/api/verify_status" },
      proxy_check_status: { path: "/api/proxy_check_status" },
    }

    const route = routeMap[action]
    if (!route) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // For verify_status, use GET with query params
    if (action === "verify_status") {
      const qs = new URLSearchParams(params).toString()
      const resp = await fetch(`${BASE_URL}${route.path}?${qs}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      })
      const data = await resp.json()
      return NextResponse.json(data)
    }

    // All others use POST with JSON body
    const resp = await fetch(`${BASE_URL}${route.path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(params),
    })

    const data = await resp.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[team-activate] proxy error:", error)
    return NextResponse.json({ error: "proxy request failed" }, { status: 500 })
  }
}

// GET for stats and recent_success
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "stats") {
      const resp = await fetch(`${BASE_URL}/api/stats`, { headers: { Accept: "application/json" } })
      const data = await resp.json()
      return NextResponse.json(data)
    }

    if (action === "recent_success") {
      const resp = await fetch(`${BASE_URL}/api/recent_success`, { headers: { Accept: "application/json" } })
      const data = await resp.json()
      return NextResponse.json(data)
    }

    // SSE proxy for student verify stream
    if (action === "student_verify_stream") {
      const activationCode = searchParams.get("activation_code") || ""
      const verificationId = searchParams.get("verificationId") || ""

      const qs = new URLSearchParams({ activation_code: activationCode, verificationId }).toString()
      const resp = await fetch(`${BASE_URL}/api/student_verify_stream?${qs}`, {
        headers: { Accept: "text/event-stream" },
      })

      // Forward the SSE stream
      return new Response(resp.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[team-activate] GET proxy error:", error)
    return NextResponse.json({ error: "proxy request failed" }, { status: 500 })
  }
}
