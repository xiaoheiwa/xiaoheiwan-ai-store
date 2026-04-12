import { NextRequest, NextResponse } from "next/server"

// Gmail 状态枚举
type GmailStatus = "valid" | "invalid" | "risky" | "unknown"

interface CheckResult {
  email: string
  status: GmailStatus
  message: string
}

// 验证邮箱格式
function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i
  return emailRegex.test(email.trim())
}

// 通过 Google 用户内容 API 检测邮箱是否存在
// 这个方法检测用户的 Google 头像是否存在
async function checkGmailViaAvatar(email: string): Promise<CheckResult> {
  const trimmedEmail = email.trim().toLowerCase()
  
  // 格式验证
  if (!isValidEmailFormat(trimmedEmail)) {
    return {
      email: trimmedEmail,
      status: "invalid",
      message: "格式错误或非 Gmail 邮箱"
    }
  }

  const localPart = trimmedEmail.split("@")[0]
  
  // Gmail 用户名基本规则检查
  if (/\.\./.test(localPart) || localPart.startsWith(".") || localPart.endsWith(".")) {
    return {
      email: trimmedEmail,
      status: "invalid",
      message: "用户名格式无效"
    }
  }
  
  // Gmail 用户名长度检查（6-30字符）
  const cleanLocalPart = localPart.replace(/\./g, "") // Gmail 忽略点号
  if (cleanLocalPart.length < 6) {
    return {
      email: trimmedEmail,
      status: "invalid",
      message: "用户名过短（至少6位）"
    }
  }
  
  if (cleanLocalPart.length > 30) {
    return {
      email: trimmedEmail,
      status: "invalid",
      message: "用户名过长（最多30位）"
    }
  }

  try {
    // 方法1: 通过 Google 的 People API 公开端点检测
    // 检测用户是否有 Google+ 或 Google 个人资料
    const profileUrl = `https://www.google.com/s2/photos/public/AIbEiAIAAABECKjS1dTF_sXdRiILdmNhcmRfcGhvdG8qKGQyNTI4YzEyN2Y1ZTllZWI1ZDIzMjVjMDI0NGE1ZDMzYzk5MTg5NjkwAQ?sz=100`
    
    // 使用 GData API 检测（Google Contacts public profile）
    // 如果返回默认头像，可能不存在；如果返回自定义头像，则存在
    const gdataUrl = `https://www.google.com/m8/feeds/photos/profile/default/${encodeURIComponent(trimmedEmail)}?v=3.0`
    
    const response = await fetch(gdataUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "follow",
    })
    
    // 404 表示账号不存在
    if (response.status === 404) {
      return {
        email: trimmedEmail,
        status: "invalid",
        message: "账号不存在"
      }
    }
    
    // 200 表示账号存在（有头像）
    if (response.status === 200) {
      return {
        email: trimmedEmail,
        status: "valid",
        message: "账号存在"
      }
    }
    
    // 其他情况尝试备用方法
    return await checkViaGoogleChat(trimmedEmail)
    
  } catch (error) {
    console.error(`[v0] Gmail avatar check error for ${trimmedEmail}:`, error)
    return await checkViaGoogleChat(trimmedEmail)
  }
}

// 备用方法：通过 Google Chat/Hangouts API 检测
async function checkViaGoogleChat(email: string): Promise<CheckResult> {
  try {
    // Google Hangouts 的用户查找接口
    const response = await fetch(
      `https://people.googleapis.com/v1/people:searchContacts?readMask=names,emailAddresses&query=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
      }
    )
    
    // 401/403 表示需要认证，但这也意味着接口可用
    // 我们改用另一个方法
    if (response.status === 401 || response.status === 403) {
      return await checkViaCalendar(email)
    }
    
    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      return {
        email,
        status: "valid",
        message: "账号存在"
      }
    }
    
    return await checkViaCalendar(email)
    
  } catch {
    return await checkViaCalendar(email)
  }
}

// 备用方法：通过 Google Calendar 的 FreeBusy 检测
async function checkViaCalendar(email: string): Promise<CheckResult> {
  try {
    // Google Calendar FreeBusy API（公开）
    // 如果邮箱存在，会返回繁忙信息或空数组
    // 如果邮箱不存在，会返回 notFound 错误
    const now = new Date()
    const later = new Date(now.getTime() + 60000) // 1分钟后
    
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/freeBusy?key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: now.toISOString(),
          timeMax: later.toISOString(),
          items: [{ id: email }]
        })
      }
    )
    
    if (!response.ok) {
      // API 不可用，使用格式验证
      return {
        email,
        status: "unknown",
        message: "无法验证，格式正确"
      }
    }
    
    const data = await response.json()
    
    // 检查是否有错误
    const calendarInfo = data.calendars?.[email]
    if (calendarInfo?.errors) {
      const errorReason = calendarInfo.errors[0]?.reason
      if (errorReason === "notFound") {
        return {
          email,
          status: "invalid",
          message: "账号不存在"
        }
      }
    }
    
    // 如果没有错误，说明账号存在
    if (calendarInfo && !calendarInfo.errors) {
      return {
        email,
        status: "valid",
        message: "账号存在"
      }
    }
    
    return {
      email,
      status: "unknown",
      message: "无法确定状态"
    }
    
  } catch {
    return {
      email,
      status: "unknown",
      message: "检测失败"
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { emails } = await request.json()

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "请提供邮箱列表" }, { status: 400 })
    }

    if (emails.length > 50) {
      return NextResponse.json({ error: "单次最多检测 50 个邮箱" }, { status: 400 })
    }

    const results: CheckResult[] = []

    // 逐个检测，添加延迟避免被限制
    for (const email of emails) {
      const result = await checkGmailViaAvatar(email)
      results.push(result)
      // 添加延迟避免被限制
      if (emails.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    // 统计
    const stats = {
      total: results.length,
      valid: results.filter(r => r.status === "valid").length,
      invalid: results.filter(r => r.status === "invalid").length,
      risky: results.filter(r => r.status === "risky").length,
      unknown: results.filter(r => r.status === "unknown").length,
    }

    return NextResponse.json({ results, stats })
  } catch (error) {
    console.error("[v0] Gmail check API error:", error)
    return NextResponse.json({ error: "检测失败" }, { status: 500 })
  }
}
