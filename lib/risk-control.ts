import { neon } from "@/lib/db-client"

const sql = neon(process.env.DATABASE_URL!)

// 一次性邮箱域名列表
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
  'throwaway.email', 'fakeinbox.com', 'temp-mail.org', 'dispostable.com',
  'yopmail.com', 'sharklasers.com', 'trashmail.com', 'getnada.com'
]

export interface RiskCheckResult {
  allowed: boolean
  riskScore: number
  riskType?: 'blocked' | 'warning' | 'suspicious'
  reason?: string
  warnings: string[]
}

export interface RiskCheckParams {
  email: string
  clientIp?: string
  fingerprint?: string
  amount?: number
  productId?: string | number
}

// 获取风控配置
async function getRiskConfig(): Promise<Record<string, string>> {
  try {
    const configs = await sql`SELECT config_key, config_value FROM risk_config`
    const configMap: Record<string, string> = {}
    for (const row of configs) {
      configMap[row.config_key] = row.config_value
    }
    return configMap
  } catch {
    return {}
  }
}

// 检查是否在黑名单中
async function checkBlacklist(type: string, value: string): Promise<{ blocked: boolean; reason?: string }> {
  try {
    const result = await sql`
      SELECT reason FROM risk_blacklist 
      WHERE type = ${type} 
        AND LOWER(value) = LOWER(${value})
        AND (expires_at IS NULL OR expires_at > NOW())
    `
    if (result.length > 0) {
      // 更新拦截计数
      await sql`
        UPDATE risk_blacklist 
        SET blocked_orders = blocked_orders + 1 
        WHERE type = ${type} AND LOWER(value) = LOWER(${value})
      `
      return { blocked: true, reason: result[0].reason }
    }
    return { blocked: false }
  } catch {
    return { blocked: false }
  }
}

// 检查邮箱域名是否在黑名单
async function checkEmailDomain(email: string): Promise<{ blocked: boolean; reason?: string }> {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return { blocked: false }
  
  // 检查一次性邮箱
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return { blocked: true, reason: '一次性邮箱域名' }
  }
  
  // 检查域名黑名单
  return checkBlacklist('email_domain', domain)
}

// 检查下单频率
async function checkOrderFrequency(email: string, clientIp: string | undefined, config: Record<string, string>): Promise<{ exceeded: boolean; reason?: string }> {
  const maxOrdersPerDay = parseInt(config.max_orders_per_email_per_day || '5')
  const maxOrdersPerHour = parseInt(config.max_orders_per_ip_per_hour || '10')
  const maxPendingOrders = parseInt(config.max_pending_orders_per_email || '3')
  
  // 检查同一邮箱24小时内下单数
  const emailOrders = await sql`
    SELECT COUNT(*) as count FROM orders 
    WHERE email = ${email} AND created_at > NOW() - INTERVAL '24 hours'
  `
  if (parseInt(emailOrders[0].count) >= maxOrdersPerDay) {
    return { exceeded: true, reason: `同一邮箱24小时内下单超过${maxOrdersPerDay}次` }
  }
  
  // 检查同一邮箱未支付订单数
  const pendingOrders = await sql`
    SELECT COUNT(*) as count FROM orders 
    WHERE email = ${email} AND status = 'pending'
  `
  if (parseInt(pendingOrders[0].count) >= maxPendingOrders) {
    return { exceeded: true, reason: `同一邮箱有${maxPendingOrders}个以上未支付订单` }
  }
  
  // 检查同一IP每小时下单数
  if (clientIp) {
    const ipOrders = await sql`
      SELECT COUNT(*) as count FROM orders 
      WHERE client_ip = ${clientIp} AND created_at > NOW() - INTERVAL '1 hour'
    `
    if (parseInt(ipOrders[0].count) >= maxOrdersPerHour) {
      return { exceeded: true, reason: `同一IP每小时下单超过${maxOrdersPerHour}次` }
    }
  }
  
  return { exceeded: false }
}

// 检查可疑模式
async function checkSuspiciousPatterns(email: string, amount: number | undefined, config: Record<string, string>): Promise<string[]> {
  const warnings: string[] = []
  const suspiciousThreshold = parseInt(config.suspicious_amount_threshold || '3')
  const nightWarning = config.night_order_warning === 'true'
  
  // 检查相同金额连续下单
  if (amount) {
    const sameAmountOrders = await sql`
      SELECT COUNT(*) as count FROM orders 
      WHERE email = ${email} 
        AND amount = ${amount}
        AND created_at > NOW() - INTERVAL '7 days'
    `
    if (parseInt(sameAmountOrders[0].count) >= suspiciousThreshold) {
      warnings.push(`7天内相同金额(${amount}元)下单${sameAmountOrders[0].count}次`)
    }
  }
  
  // 检查凌晨下单
  if (nightWarning) {
    const hour = new Date().getHours()
    if (hour >= 1 && hour <= 5) {
      // 检查该邮箱是否有多次凌晨下单
      const nightOrders = await sql`
        SELECT COUNT(*) as count FROM orders 
        WHERE email = ${email}
          AND EXTRACT(HOUR FROM created_at) BETWEEN 1 AND 5
          AND created_at > NOW() - INTERVAL '7 days'
      `
      if (parseInt(nightOrders[0].count) >= 2) {
        warnings.push(`7天内凌晨时段下单${nightOrders[0].count}次`)
      }
    }
  }
  
  // 检查短时间内多次下单
  const recentOrders = await sql`
    SELECT COUNT(*) as count FROM orders 
    WHERE email = ${email} AND created_at > NOW() - INTERVAL '1 hour'
  `
  if (parseInt(recentOrders[0].count) >= 3) {
    warnings.push(`1小时内下单${recentOrders[0].count}次`)
  }
  
  return warnings
}

// 记录风控日志
async function logRiskEvent(params: {
  orderNo?: string
  email: string
  clientIp?: string
  fingerprint?: string
  riskType: 'blocked' | 'warning' | 'suspicious'
  riskReason: string
  riskScore: number
}) {
  try {
    await sql`
      INSERT INTO risk_logs (order_no, email, client_ip, fingerprint, risk_type, risk_reason, risk_score)
      VALUES (${params.orderNo || null}, ${params.email}, ${params.clientIp || null}, ${params.fingerprint || null}, ${params.riskType}, ${params.riskReason}, ${params.riskScore})
    `

    // 仅"被拦截"事件参与攻击告警判断,警告类不触发
    if (params.riskType !== 'blocked') return
    if (!params.clientIp && !params.email) return

    let count = 0
    if (params.clientIp) {
      const rows = await sql`
        SELECT COUNT(*)::int as count FROM risk_logs
        WHERE risk_type = 'blocked' AND client_ip = ${params.clientIp}
          AND created_at > NOW() - INTERVAL '5 minutes'
      `
      count = rows[0]?.count || 0
    } else {
      const rows = await sql`
        SELECT COUNT(*)::int as count FROM risk_logs
        WHERE risk_type = 'blocked' AND email = ${params.email}
          AND created_at > NOW() - INTERVAL '5 minutes'
      `
      count = rows[0]?.count || 0
    }

    if (count >= 3) {
      const { notifyAttack } = await import('@/lib/security-alert')
      await notifyAttack({
        type: 'risk_repeated_block',
        ip: params.clientIp,
        email: params.email,
        count,
        windowLabel: '5 分钟',
        detail: `最近一次原因: ${params.riskReason}`,
      })
    }
  } catch (error) {
    console.error('[RiskControl] Failed to log risk event:', error)
  }
}

// 主风控检查函数
export async function checkRisk(params: RiskCheckParams): Promise<RiskCheckResult> {
  const { email, clientIp, fingerprint, amount } = params
  const warnings: string[] = []
  let riskScore = 0
  
  try {
    // 获取风控配置
    const config = await getRiskConfig()
    
    // 检查风控是否启用
    if (config.risk_control_enabled !== 'true') {
      return { allowed: true, riskScore: 0, warnings: [] }
    }
    
    // 0. 检查白名单 - 白名单用户跳过所有风控
    const whitelist = await sql`
      SELECT reason FROM risk_whitelist 
      WHERE type = 'email' AND LOWER(value) = LOWER(${email})
      AND (expires_at IS NULL OR expires_at > NOW())
    `
    if (whitelist.length > 0) {
      console.log("[RiskControl] Email in whitelist, skipping all checks:", email)
      return { allowed: true, riskScore: 0, warnings: [] }
    }
    
    // 1. 检查邮箱黑名单
    const emailBlacklist = await checkBlacklist('email', email)
    if (emailBlacklist.blocked) {
      await logRiskEvent({
        email,
        clientIp,
        fingerprint,
        riskType: 'blocked',
        riskReason: `邮箱黑名单: ${emailBlacklist.reason}`,
        riskScore: 100
      })
      return {
        allowed: false,
        riskScore: 100,
        riskType: 'blocked',
        reason: '该邮箱已被限制下单',
        warnings: []
      }
    }
    
    // 2. 检查邮箱域名
    if (config.block_disposable_emails === 'true') {
      const domainCheck = await checkEmailDomain(email)
      if (domainCheck.blocked) {
        await logRiskEvent({
          email,
          clientIp,
          fingerprint,
          riskType: 'blocked',
          riskReason: `邮箱域名黑名单: ${domainCheck.reason}`,
          riskScore: 100
        })
        return {
          allowed: false,
          riskScore: 100,
          riskType: 'blocked',
          reason: '不支持该邮箱域名，请使用常规邮箱',
          warnings: []
        }
      }
    }
    
    // 3. 检查IP黑名单
    if (clientIp) {
      const ipBlacklist = await checkBlacklist('ip', clientIp)
      if (ipBlacklist.blocked) {
        await logRiskEvent({
          email,
          clientIp,
          fingerprint,
          riskType: 'blocked',
          riskReason: `IP黑名单: ${ipBlacklist.reason}`,
          riskScore: 100
        })
        return {
          allowed: false,
          riskScore: 100,
          riskType: 'blocked',
          reason: '当前网络环境异常，请稍后再试',
          warnings: []
        }
      }
    }
    
    // 4. 检查设备指纹黑名单
    if (fingerprint) {
      const fpBlacklist = await checkBlacklist('fingerprint', fingerprint)
      if (fpBlacklist.blocked) {
        await logRiskEvent({
          email,
          clientIp,
          fingerprint,
          riskType: 'blocked',
          riskReason: `设备指纹黑名单: ${fpBlacklist.reason}`,
          riskScore: 100
        })
        return {
          allowed: false,
          riskScore: 100,
          riskType: 'blocked',
          reason: '当前设备已被限制',
          warnings: []
        }
      }
    }
    
    // 5. 检查下单频率
    const frequencyCheck = await checkOrderFrequency(email, clientIp, config)
    if (frequencyCheck.exceeded) {
      await logRiskEvent({
        email,
        clientIp,
        fingerprint,
        riskType: 'blocked',
        riskReason: `频率限制: ${frequencyCheck.reason}`,
        riskScore: 80
      })
      return {
        allowed: false,
        riskScore: 80,
        riskType: 'blocked',
        reason: frequencyCheck.reason,
        warnings: []
      }
    }
    
    // 6. 检查可疑模式（不阻止，只警告）
    const suspiciousWarnings = await checkSuspiciousPatterns(email, amount, config)
    warnings.push(...suspiciousWarnings)
    riskScore += suspiciousWarnings.length * 20
    
    // 如果有警告，记录日志
    if (warnings.length > 0) {
      await logRiskEvent({
        email,
        clientIp,
        fingerprint,
        riskType: riskScore >= 60 ? 'suspicious' : 'warning',
        riskReason: warnings.join('; '),
        riskScore
      })
    }
    
    return {
      allowed: true,
      riskScore,
      riskType: riskScore >= 60 ? 'suspicious' : (riskScore > 0 ? 'warning' : undefined),
      warnings
    }
  } catch (error) {
    console.error('[RiskControl] Error during risk check:', error)
    // 出错时允许通过，避免影响正常用户
    return { allowed: true, riskScore: 0, warnings: [] }
  }
}

// 添加黑名单
export async function addToBlacklist(type: 'email' | 'ip' | 'fingerprint' | 'email_domain', value: string, reason: string, createdBy?: string, expiresAt?: Date) {
  await sql`
    INSERT INTO risk_blacklist (type, value, reason, created_by, expires_at)
    VALUES (${type}, ${value}, ${reason}, ${createdBy || null}, ${expiresAt || null})
    ON CONFLICT (type, value) DO UPDATE SET reason = ${reason}, expires_at = ${expiresAt || null}
  `
}

// 从黑名单移除
export async function removeFromBlacklist(type: string, value: string) {
  await sql`DELETE FROM risk_blacklist WHERE type = ${type} AND LOWER(value) = LOWER(${value})`
}

// 获取黑名单列表
export async function getBlacklist(type?: string) {
  if (type) {
    return sql`SELECT * FROM risk_blacklist WHERE type = ${type} ORDER BY created_at DESC`
  }
  return sql`SELECT * FROM risk_blacklist ORDER BY created_at DESC`
}

// 获取风控日志
export async function getRiskLogs(limit = 100) {
  return sql`SELECT * FROM risk_logs ORDER BY created_at DESC LIMIT ${limit}`
}

// 更新风控配置
export async function updateRiskConfig(key: string, value: string) {
  await sql`
    UPDATE risk_config SET config_value = ${value}, updated_at = NOW() WHERE config_key = ${key}
  `
}

// 获取所有风控配置
export async function getAllRiskConfig() {
  return sql`SELECT * FROM risk_config ORDER BY config_key`
}

// 获取单个配置值
async function getConfigValue(key: string, defaultValue: string): Promise<string> {
  try {
    const result = await sql`SELECT config_value FROM risk_config WHERE config_key = ${key} LIMIT 1`
    return result[0]?.config_value || defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * 检查订单是否为高风险（用于支付后发货前的二次检查）
 * 高风险订单需要人工审核后才能发货
 * 所有阈值从数据库配置中读取，可在后台调整
 */
export async function checkOrderHighRisk(email: string, amount: number): Promise<{ isHighRisk: boolean; reasons: string[]; reviewEnabled: boolean }> {
  const reasons: string[] = []
  let isHighRisk = false

  try {
    // 先检查白名单 - 白名单用户跳过所有风控
    const whitelist = await sql`
      SELECT reason FROM risk_whitelist 
      WHERE type = 'email' AND LOWER(value) = LOWER(${email})
      AND (expires_at IS NULL OR expires_at > NOW())
    `
    if (whitelist.length > 0) {
      console.log("[RiskControl] Email in whitelist, skipping risk check:", email)
      return { isHighRisk: false, reasons: [], reviewEnabled: true }
    }

    // 读取配置
    const reviewEnabled = (await getConfigValue('high_risk_review_enabled', 'true')) === 'true'
    const nightStart = parseInt(await getConfigValue('high_risk_night_start', '1'), 10)
    const nightEnd = parseInt(await getConfigValue('high_risk_night_end', '6'), 10)
    const dailyLimit = parseInt(await getConfigValue('high_risk_daily_paid_limit', '2'), 10)
    const hourlyLimit = parseInt(await getConfigValue('high_risk_hourly_paid_limit', '2'), 10)
    const sameAmountDays = parseInt(await getConfigValue('high_risk_same_amount_days', '7'), 10)
    const sameAmountLimit = parseInt(await getConfigValue('high_risk_same_amount_limit', '3'), 10)

    // 使用北京时间 (UTC+8)
    const now = new Date()
    const beijingTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
    const currentHour = beijingTime.getHours()

    // 1. 高风险时段下单（北京时间）
    if (currentHour >= nightStart && currentHour < nightEnd) {
      reasons.push(`高风险时段（北京时间${nightStart}-${nightEnd}点）下单，当前北京时间${currentHour}点`)
      isHighRisk = true
    }

    // 2. 同一邮箱24小时内已支付订单数
    const todayPaidOrders = await sql`
      SELECT COUNT(*)::int as count FROM orders 
      WHERE email = ${email} 
      AND paid_at > NOW() - INTERVAL '24 hours'
      AND status = 'paid'
    `
    const todayCount = todayPaidOrders[0]?.count || 0
    if (todayCount >= dailyLimit) {
      reasons.push(`24小时内已支付${todayCount}单（阈值${dailyLimit}）`)
      isHighRisk = true
    }

    // 3. 同一邮箱1小时内支付次数
    const hourPaidOrders = await sql`
      SELECT COUNT(*)::int as count FROM orders 
      WHERE email = ${email} 
      AND paid_at > NOW() - INTERVAL '1 hour'
      AND status = 'paid'
    `
    const hourCount = hourPaidOrders[0]?.count || 0
    if (hourCount >= hourlyLimit) {
      reasons.push(`1小时内已支付${hourCount}单（阈值${hourlyLimit}）`)
      isHighRisk = true
    }

    // 4. 检查邮箱是否在黑名单观察列表
    const watchlist = await sql`
      SELECT reason FROM risk_blacklist 
      WHERE type = 'email' AND LOWER(value) = LOWER(${email})
      AND (expires_at IS NULL OR expires_at > NOW())
    `
    if (watchlist.length > 0) {
      reasons.push(`邮箱在观察名单: ${watchlist[0].reason}`)
      isHighRisk = true
    }

    // 5. N天内相同金额支付M次以上
    const sameAmountOrders = await sql`
      SELECT COUNT(*)::int as count FROM orders 
      WHERE email = ${email} 
      AND amount = ${amount}
      AND status = 'paid'
      AND paid_at > NOW() - INTERVAL '1 day' * ${sameAmountDays}
    `
    if ((sameAmountOrders[0]?.count || 0) >= sameAmountLimit) {
      reasons.push(`${sameAmountDays}天内相同金额支付${sameAmountOrders[0].count}次（阈值${sameAmountLimit}）`)
      isHighRisk = true
    }

    return { isHighRisk, reasons, reviewEnabled }

  } catch (error) {
    console.error("[RiskControl] Error checking high risk:", error)
    return { isHighRisk: false, reasons: [], reviewEnabled: true }
  }
}
