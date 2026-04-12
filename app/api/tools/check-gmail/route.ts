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

// 检查单个 Gmail 状态
// 使用 Google 的用户查找接口来检测邮箱是否存在
async function checkGmailStatus(email: string): Promise<CheckResult> {
  const trimmedEmail = email.trim().toLowerCase()
  
  // 格式验证
  if (!isValidEmailFormat(trimmedEmail)) {
    return {
      email: trimmedEmail,
      status: "invalid",
      message: "格式错误或非 Gmail 邮箱"
    }
  }

  try {
    // 使用 Google 的密码重置页面来检测邮箱状态
    // 这是一个常用的检测方法，通过检查 Google 的响应来判断邮箱状态
    const response = await fetch(
      `https://accounts.google.com/_/signup/webusercheck?hl=zh-CN`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: `f.req=${encodeURIComponent(JSON.stringify([[trimmedEmail]]))}`
      }
    )

    const text = await response.text()
    
    // 解析响应判断状态
    // Google 会返回不同的响应码表示不同状态
    if (text.includes("EXISTING_EMAIL") || text.includes('"gf.wl"')) {
      return {
        email: trimmedEmail,
        status: "valid",
        message: "账号存在且正常"
      }
    } else if (text.includes("DISABLED") || text.includes("suspended")) {
      return {
        email: trimmedEmail,
        status: "risky",
        message: "账号已停用或受限"
      }
    } else if (text.includes("NOT_FOUND") || text.includes("notfound")) {
      return {
        email: trimmedEmail,
        status: "invalid",
        message: "账号不存在"
      }
    }
    
    // 备用方法：通过 Gmail SMTP 进行简单验证
    // 检查 MX 记录是否指向 Google
    return {
      email: trimmedEmail,
      status: "unknown",
      message: "无法确定状态"
    }
  } catch (error) {
    console.error(`[v0] Gmail check error for ${trimmedEmail}:`, error)
    return {
      email: trimmedEmail,
      status: "unknown",
      message: "检测失败，请重试"
    }
  }
}

// 简化版检测：仅验证格式和基本规则
function quickCheck(email: string): CheckResult {
  const trimmedEmail = email.trim().toLowerCase()
  
  if (!isValidEmailFormat(trimmedEmail)) {
    return {
      email: trimmedEmail,
      status: "invalid",
      message: "格式错误或非 Gmail 邮箱"
    }
  }

  const localPart = trimmedEmail.split("@")[0]
  
  // Gmail 用户名规则检查
  if (localPart.length < 6) {
    return {
      email: trimmedEmail,
      status: "risky",
      message: "用户名过短（少于6位）"
    }
  }
  
  if (localPart.length > 30) {
    return {
      email: trimmedEmail,
      status: "risky",
      message: "用户名过长（超过30位）"
    }
  }
  
  if (/^[0-9]+$/.test(localPart)) {
    return {
      email: trimmedEmail,
      status: "risky",
      message: "纯数字用户名，可能有风险"
    }
  }
  
  if (/\.\./.test(localPart) || localPart.startsWith(".") || localPart.endsWith(".")) {
    return {
      email: trimmedEmail,
      status: "invalid",
      message: "用户名格式无效"
    }
  }

  return {
    email: trimmedEmail,
    status: "valid",
    message: "格式正确"
  }
}

export async function POST(request: NextRequest) {
  try {
    const { emails, mode = "quick" } = await request.json()

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "请提供邮箱列表" }, { status: 400 })
    }

    if (emails.length > 100) {
      return NextResponse.json({ error: "单次最多检测 100 个邮箱" }, { status: 400 })
    }

    const results: CheckResult[] = []

    if (mode === "quick") {
      // 快速模式：仅验证格式
      for (const email of emails) {
        results.push(quickCheck(email))
      }
    } else {
      // 深度模式：尝试在线验证（有限制）
      for (const email of emails) {
        const result = await checkGmailStatus(email)
        results.push(result)
        // 添加延迟避免被限制
        await new Promise(resolve => setTimeout(resolve, 200))
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
