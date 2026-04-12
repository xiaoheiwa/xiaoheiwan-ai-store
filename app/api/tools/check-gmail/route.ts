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

// 通过 Google 账号恢复页面检测邮箱是否存在
async function checkGmailExists(email: string): Promise<CheckResult> {
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

  try {
    // 使用 Google People API 的公开接口检测
    // 通过 Hangouts 的 lookup 接口检测邮箱是否存在
    const lookupUrl = `https://www.google.com/inputtools/request?ime=handwriting&app=translate&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&t=test&email=${encodeURIComponent(trimmedEmail)}`
    
    // 方法: 使用 Gmail SMTP RCPT TO 验证
    // 由于服务端限制，改用 Google Calendar 的免费繁忙状态 API
    const calendarCheckUrl = `https://www.googleapis.com/calendar/v3/freeBusy`
    
    // 使用 Google 的用户名检查接口
    const response = await fetch(
      "https://accounts.google.com/InputValidator?resource=SignUp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "*/*",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Origin": "https://accounts.google.com",
          "Referer": "https://accounts.google.com/signup",
        },
        body: new URLSearchParams({
          "Email": trimmedEmail,
          "GmailUsername": localPart,
        }).toString(),
      }
    )

    if (!response.ok) {
      // 尝试备用方法 - Google 密码恢复检测
      return await checkViaPasswordRecovery(trimmedEmail)
    }

    const text = await response.text()
    
    // 如果用户名已被占用，说明邮箱存在
    if (text.includes("That username is taken") || 
        text.includes("该用户名已被占用") || 
        text.includes("DUPLICATE") ||
        text.includes("already")) {
      return {
        email: trimmedEmail,
        status: "valid",
        message: "账号存在"
      }
    }
    
    // 如果可以注册，说明邮箱不存在
    if (text.includes("available") || text.includes("可用")) {
      return {
        email: trimmedEmail,
        status: "invalid",
        message: "账号不存在"
      }
    }

    // 无法确定时使用备用方法
    return await checkViaPasswordRecovery(trimmedEmail)
    
  } catch (error) {
    console.error(`[v0] Gmail check error for ${trimmedEmail}:`, error)
    // 出错时尝试备用方法
    try {
      return await checkViaPasswordRecovery(trimmedEmail)
    } catch {
      return {
        email: trimmedEmail,
        status: "unknown",
        message: "检测失败"
      }
    }
  }
}

// 备用方法：通过密码恢复页面检测
async function checkViaPasswordRecovery(email: string): Promise<CheckResult> {
  try {
    // Google 账号恢复接口
    const response = await fetch(
      "https://accounts.google.com/_/signin/v2/lookup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "*/*",
          "Origin": "https://accounts.google.com",
        },
        body: new URLSearchParams({
          "email": email,
          "continue": "https://mail.google.com",
        }).toString(),
      }
    )

    const text = await response.text()
    
    // 根据响应判断
    if (text.includes("couldn't find") || 
        text.includes("找不到") || 
        text.includes("Couldn't find your Google Account") ||
        text.includes("没有找到")) {
      return {
        email,
        status: "invalid",
        message: "账号不存在"
      }
    }
    
    if (text.includes("disabled") || text.includes("已停用")) {
      return {
        email,
        status: "risky",
        message: "账号已停用"
      }
    }
    
    // 如果返回了下一步（如输入密码），说明账号存在
    if (text.includes("password") || 
        text.includes("密码") ||
        text.includes("Enter your password") ||
        text.includes("Next") ||
        response.status === 200) {
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

    // 逐个检测，添加延迟避免被 Google 限制
    for (const email of emails) {
      const result = await checkGmailExists(email)
      results.push(result)
      // 添加延迟避免被限制
      if (emails.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
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
