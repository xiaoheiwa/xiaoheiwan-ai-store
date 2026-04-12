import { NextRequest, NextResponse } from "next/server"

/**
 * 邮箱验证 API
 * 参考 reacherhq/check-if-email-exists 项目设计
 * 由于 Vercel 无法使用 SMTP（端口25），采用以下验证策略：
 * 1. 语法验证（Gmail 特定规则）
 * 2. MX 记录验证（DNS over HTTPS）
 * 3. 一次性邮箱检测
 * 4. 角色账户检测
 * 5. 可选：Reacher API 深度验证
 */

type EmailStatus = "valid" | "invalid" | "risky" | "unknown"

interface CheckResult {
  email: string
  status: EmailStatus
  is_reachable: "safe" | "risky" | "invalid" | "unknown"
  message: string
  syntax: {
    is_valid: boolean
    username: string
    domain: string
    suggestion?: string
  }
  mx: {
    accepts_mail: boolean
    records: string[]
  }
  misc: {
    is_disposable: boolean
    is_role_account: boolean
    is_free_provider: boolean
  }
}

// 一次性邮箱域名列表（来源：disposable-email-domains）
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "guerrillamail.com", "10minutemail.com", "mailinator.com",
  "throwaway.email", "temp-mail.org", "fakeinbox.com", "getnada.com",
  "maildrop.cc", "yopmail.com", "tempail.com", "dispostable.com",
  "guerrillamail.info", "sharklasers.com", "grr.la", "guerrillamail.biz",
  "guerrillamail.de", "guerrillamail.net", "guerrillamail.org", "spam4.me",
  "trashmail.com", "mailnesia.com", "mytrashmail.com", "mt2009.com",
  "trash-mail.at", "trashemail.de", "wegwerfmail.de", "wegwerfmail.net",
  "wegwerfmail.org", "emailondeck.com", "tempr.email", "discard.email",
  "discardmail.com", "spamgourmet.com", "mintemail.com", "tempinbox.com"
])

// 免费邮箱提供商
const FREE_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.jp", "yahoo.co.uk",
  "hotmail.com", "outlook.com", "live.com", "msn.com", "icloud.com",
  "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me",
  "zoho.com", "mail.com", "gmx.com", "gmx.net", "yandex.com", "yandex.ru",
  "qq.com", "163.com", "126.com", "sina.com", "foxmail.com"
])

// 角色账户前缀
const ROLE_PREFIXES = new Set([
  "admin", "administrator", "webmaster", "postmaster", "hostmaster",
  "info", "support", "sales", "marketing", "noreply", "no-reply",
  "contact", "help", "abuse", "security", "billing", "team", "hello",
  "office", "mail", "email", "enquiries", "enquiry", "feedback",
  "jobs", "careers", "hr", "recruitment", "press", "media", "news",
  "legal", "compliance", "privacy", "service", "services", "api"
])

// 验证邮箱基础语法
function validateBasicSyntax(email: string): { valid: boolean; username: string; domain: string } {
  const trimmed = email.trim().toLowerCase()
  // RFC 5322 简化版正则
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, username: "", domain: "" }
  }
  
  const atIndex = trimmed.lastIndexOf("@")
  const username = trimmed.substring(0, atIndex)
  const domain = trimmed.substring(atIndex + 1)
  
  // 用户名和域名长度检查
  if (username.length === 0 || username.length > 64) {
    return { valid: false, username: "", domain: "" }
  }
  if (domain.length === 0 || domain.length > 255) {
    return { valid: false, username: "", domain: "" }
  }
  
  return { valid: true, username, domain }
}

// Gmail 特定语法验证
function validateGmailSyntax(username: string): { valid: boolean; reason?: string; suggestion?: string } {
  // Gmail 用户名规则：
  // 1. 只能包含字母(a-z)、数字(0-9)和点号(.)
  // 2. 长度 6-30 字符（不计点号）
  // 3. 不能以点号开头或结尾
  // 4. 不能有连续点号
  // 5. 点号在 Gmail 中被忽略（a.b.c 等同于 abc）
  
  // 检查非法字符
  if (!/^[a-z0-9.]+$/.test(username)) {
    return { valid: false, reason: "Gmail 用户名只能包含字母、数字和点号" }
  }
  
  // 检查点号规则
  if (username.startsWith(".")) {
    return { valid: false, reason: "用户名不能以点号开头" }
  }
  if (username.endsWith(".")) {
    return { valid: false, reason: "用户名不能以点号结尾" }
  }
  if (username.includes("..")) {
    return { valid: false, reason: "用户名不能包含连续点号" }
  }
  
  // 计算实际长度（Gmail 忽略点号）
  const normalizedLength = username.replace(/\./g, "").length
  
  if (normalizedLength < 6) {
    return { 
      valid: false, 
      reason: `用户名过短（${normalizedLength}字符，需要至少6字符）`
    }
  }
  
  if (normalizedLength > 30) {
    return { 
      valid: false, 
      reason: `用户名过长（${normalizedLength}字符，最多30字符）`
    }
  }
  
  return { valid: true }
}

// 检查 MX 记录（使用 DNS over HTTPS）
async function checkMxRecords(domain: string): Promise<{ valid: boolean; records: string[] }> {
  try {
    // 使用 Cloudflare DNS over HTTPS
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      { 
        headers: { "Accept": "application/dns-json" },
        signal: AbortSignal.timeout(5000)
      }
    )
    
    if (!response.ok) {
      // 备用：Google DNS
      const googleResponse = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
        { 
          headers: { "Accept": "application/dns-json" },
          signal: AbortSignal.timeout(5000)
        }
      )
      
      if (!googleResponse.ok) {
        return { valid: false, records: [] }
      }
      
      const googleData = await googleResponse.json()
      if (googleData.Answer && googleData.Answer.length > 0) {
        const records = googleData.Answer
          .filter((r: { type: number }) => r.type === 15)
          .map((r: { data: string }) => r.data.split(" ").pop() || r.data)
        return { valid: records.length > 0, records }
      }
      return { valid: false, records: [] }
    }
    
    const data = await response.json()
    
    if (data.Answer && data.Answer.length > 0) {
      const records = data.Answer
        .filter((r: { type: number }) => r.type === 15)
        .map((r: { data: string }) => {
          // MX 记录格式: "priority server"
          const parts = r.data.split(" ")
          return parts.length > 1 ? parts[1] : r.data
        })
      return { valid: records.length > 0, records }
    }
    
    return { valid: false, records: [] }
  } catch (error) {
    console.error("[v0] MX check error:", error)
    return { valid: false, records: [] }
  }
}

// 检查是否为一次性邮箱
function isDisposableEmail(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain.toLowerCase())
}

// 检查是否为角色账户
function isRoleAccount(username: string): boolean {
  const lowerUsername = username.toLowerCase().replace(/\./g, "")
  return ROLE_PREFIXES.has(lowerUsername) || 
    Array.from(ROLE_PREFIXES).some(prefix => lowerUsername.startsWith(prefix))
}

// 检查是否为免费邮箱提供商
function isFreeProvider(domain: string): boolean {
  return FREE_PROVIDERS.has(domain.toLowerCase())
}

// 使用 Reacher API 进行 SMTP 深度验证（需配置 API Key）
async function checkWithReacher(email: string): Promise<Partial<CheckResult> | null> {
  const apiKey = process.env.REACHER_API_KEY
  const apiUrl = process.env.REACHER_API_URL || "https://api.reacher.email/v0/check_email"
  
  if (!apiKey) {
    return null
  }
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ to_email: email }),
      signal: AbortSignal.timeout(30000)
    })
    
    if (!response.ok) {
      console.error("[v0] Reacher API error:", response.status)
      return null
    }
    
    const data = await response.json()
    
    return {
      is_reachable: data.is_reachable,
      mx: {
        accepts_mail: data.mx?.accepts_mail ?? false,
        records: data.mx?.records ?? []
      },
      misc: {
        is_disposable: data.misc?.is_disposable ?? false,
        is_role_account: data.misc?.is_role_account ?? false,
        is_free_provider: data.misc?.is_b2c ?? false
      }
    }
  } catch (error) {
    console.error("[v0] Reacher API error:", error)
    return null
  }
}

// 综合验证邮箱
async function checkEmail(email: string): Promise<CheckResult> {
  const trimmedEmail = email.trim().toLowerCase()
  
  // 1. 基础语法验证
  const syntax = validateBasicSyntax(trimmedEmail)
  if (!syntax.valid) {
    return {
      email: trimmedEmail,
      status: "invalid",
      is_reachable: "invalid",
      message: "邮箱格式错误",
      syntax: {
        is_valid: false,
        username: "",
        domain: ""
      },
      mx: { accepts_mail: false, records: [] },
      misc: { is_disposable: false, is_role_account: false, is_free_provider: false }
    }
  }
  
  const { username, domain } = syntax
  const isGmail = domain === "gmail.com" || domain === "googlemail.com"
  
  // 2. Gmail 特定语法验证
  if (isGmail) {
    const gmailCheck = validateGmailSyntax(username)
    if (!gmailCheck.valid) {
      return {
        email: trimmedEmail,
        status: "invalid",
        is_reachable: "invalid",
        message: gmailCheck.reason || "Gmail 用户名格式无效",
        syntax: {
          is_valid: false,
          username,
          domain,
          suggestion: gmailCheck.suggestion
        },
        mx: { accepts_mail: true, records: ["gmail-smtp-in.l.google.com"] },
        misc: { 
          is_disposable: false, 
          is_role_account: isRoleAccount(username), 
          is_free_provider: true 
        }
      }
    }
  }
  
  // 3. 检查一次性邮箱
  const disposable = isDisposableEmail(domain)
  
  // 4. 检查角色账户
  const roleAccount = isRoleAccount(username)
  
  // 5. 检查免费提供商
  const freeProvider = isFreeProvider(domain)
  
  // 6. 检查 MX 记录
  const mx = await checkMxRecords(domain)
  
  // 7. 尝试 Reacher API 深度验证
  const reacherResult = await checkWithReacher(trimmedEmail)
  
  // 综合判断
  let status: EmailStatus
  let is_reachable: "safe" | "risky" | "invalid" | "unknown"
  let message: string
  
  // 如果有 Reacher 结果，优先使用
  if (reacherResult?.is_reachable) {
    is_reachable = reacherResult.is_reachable
    switch (is_reachable) {
      case "safe":
        status = "valid"
        message = "邮箱有效，可正常接收邮件"
        break
      case "invalid":
        status = "invalid"
        message = "邮箱不存在或已停用"
        break
      case "risky":
        status = "risky"
        message = "邮箱存在风险（可能是 Catch-all 或收件箱已满）"
        break
      default:
        status = "unknown"
        message = "无法确定邮箱状态"
    }
  } else {
    // 基于基础验证判断
    if (!mx.valid) {
      status = "invalid"
      is_reachable = "invalid"
      message = "域名无有效邮件服务器"
    } else if (disposable) {
      status = "risky"
      is_reachable = "risky"
      message = "一次性邮箱，不建议使用"
    } else if (roleAccount) {
      status = "risky"
      is_reachable = "risky"
      message = "角色账户（如 admin@、support@），可能为公共邮箱"
    } else {
      status = "valid"
      is_reachable = isGmail ? "unknown" : "safe"
      message = isGmail 
        ? "语法正确，MX有效（Gmail 无法通过 SMTP 验证具体账号）"
        : "语法正确，MX记录有效"
    }
  }
  
  return {
    email: trimmedEmail,
    status,
    is_reachable,
    message,
    syntax: {
      is_valid: true,
      username,
      domain
    },
    mx: reacherResult?.mx || mx,
    misc: {
      is_disposable: reacherResult?.misc?.is_disposable ?? disposable,
      is_role_account: reacherResult?.misc?.is_role_account ?? roleAccount,
      is_free_provider: reacherResult?.misc?.is_free_provider ?? freeProvider
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
    const hasReacherApi = !!process.env.REACHER_API_KEY

    for (const email of emails) {
      if (typeof email !== "string" || !email.trim()) {
        continue
      }
      
      const result = await checkEmail(email)
      results.push(result)
      
      // 添加延迟避免限流
      if (emails.length > 1) {
        await new Promise(resolve => setTimeout(resolve, hasReacherApi ? 1000 : 200))
      }
    }

    // 统计
    const stats = {
      total: results.length,
      valid: results.filter(r => r.status === "valid").length,
      invalid: results.filter(r => r.status === "invalid").length,
      risky: results.filter(r => r.status === "risky").length,
      unknown: results.filter(r => r.status === "unknown").length,
      mode: hasReacherApi ? "smtp" : "basic"
    }

    return NextResponse.json({ results, stats })
  } catch (error) {
    console.error("[v0] Email check API error:", error)
    return NextResponse.json({ error: "检测失败" }, { status: 500 })
  }
}
