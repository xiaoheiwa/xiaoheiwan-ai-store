import { type NextRequest, NextResponse } from "next/server"

const GPT_API_URL = "https://9977ai.vip/"

// In-memory session store (maps client session to PHP session cookies)
const sessionStore = new Map<string, string>()

function getClientId(request: NextRequest): string {
  // Use a combination of IP + user-agent as a rough client identifier
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const ua = request.headers.get("user-agent") || "unknown"
  // Simple hash
  let hash = 0
  const str = ip + ua
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return String(Math.abs(hash))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    const clientId = getClientId(request)

    const formData = new URLSearchParams()
    formData.append("ajax", "1")
    formData.append("action", action)

    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        formData.append(key, params[key])
      }
    }

    // Build headers with session cookie if we have one
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    }
    const savedCookies = sessionStore.get(clientId)
    if (savedCookies) {
      headers["Cookie"] = savedCookies
    }

    const response = await fetch(GPT_API_URL, {
      method: "POST",
      headers,
      body: formData,
      redirect: "follow",
    })

    // Capture Set-Cookie from PHP response
    const setCookieHeader = response.headers.get("set-cookie")
    if (setCookieHeader) {
      // Extract all cookie key=value pairs
      const cookies = setCookieHeader.split(",").map(c => {
        const parts = c.trim().split(";")[0]
        return parts
      }).filter(c => c.includes("="))
      
      if (cookies.length > 0) {
        const existingCookies = sessionStore.get(clientId) || ""
        const cookieMap = new Map<string, string>()
        
        // Parse existing cookies
        if (existingCookies) {
          existingCookies.split("; ").forEach(c => {
            const [k, ...v] = c.split("=")
            if (k) cookieMap.set(k, v.join("="))
          })
        }
        
        // Merge new cookies
        cookies.forEach(c => {
          const [k, ...v] = c.split("=")
          if (k) cookieMap.set(k.trim(), v.join("="))
        })
        
        const mergedCookies = Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join("; ")
        sessionStore.set(clientId, mergedCookies)
      }
    }

    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid response", message: "后端返回格式错误", raw: text.substring(0, 200) },
        { status: 502 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] GPT activate proxy error:", error)
    return NextResponse.json(
      { success: false, error: "Network error", message: "网络请求失败，请重试" },
      { status: 500 }
    )
  }
}
