import { neon } from "@/lib/db-client"
import { sendTelegramMessage } from "@/lib/telegram"

const sql = neon(process.env.DATABASE_URL!)

export type AttackType =
  | "admin_brute_force"
  | "admin_unauthorized"
  | "payment_forgery"
  | "risk_repeated_block"

interface AlertParams {
  type: AttackType
  ip?: string
  email?: string
  detail?: string
  count?: number
  windowLabel?: string
}

const TYPE_META: Record<AttackType, { emoji: string; title: string }> = {
  admin_brute_force: { emoji: "🚨", title: "后台密码爆破" },
  admin_unauthorized: { emoji: "🛡️", title: "后台未授权访问异常" },
  payment_forgery: { emoji: "💸", title: "支付回调签名伪造" },
  risk_repeated_block: { emoji: "⚠️", title: "风控连续拦截" },
}

function escapeHtml(text: string | number | null | undefined): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

async function alreadyNotified(type: AttackType, key: string): Promise<boolean> {
  try {
    const reason = `${type}|${key}`
    const rows = await sql`
      SELECT 1 FROM risk_logs
      WHERE risk_type = ${"alert_sent"}
        AND risk_reason = ${reason}
        AND created_at > NOW() - INTERVAL '30 minutes'
      LIMIT 1
    `
    return rows.length > 0
  } catch {
    return false
  }
}

async function recordAlertSent(type: AttackType, key: string, ip?: string, email?: string) {
  try {
    const reason = `${type}|${key}`
    await sql`
      INSERT INTO risk_logs (email, client_ip, risk_type, risk_reason, risk_score)
      VALUES (${email || "system"}, ${ip || null}, ${"alert_sent"}, ${reason}, ${0})
    `
  } catch (error) {
    console.error("[SecurityAlert] Failed to record dedupe log:", error)
  }
}

export async function notifyAttack(params: AlertParams): Promise<boolean> {
  const { type, ip, email, detail, count, windowLabel } = params
  const meta = TYPE_META[type]
  const dedupeKey = ip || email || "global"

  if (await alreadyNotified(type, dedupeKey)) {
    console.log(`[SecurityAlert] Suppressed duplicate ${type} for ${dedupeKey}`)
    return false
  }

  const ipLine = ip ? `\n<b>IP:</b> <code>${escapeHtml(ip)}</code>` : ""
  const emailLine = email ? `\n<b>邮箱:</b> ${escapeHtml(email)}` : ""
  const countLine = count != null
    ? `\n<b>命中:</b> ${count} 次${windowLabel ? ` / ${escapeHtml(windowLabel)}` : ""}`
    : ""
  const detailLine = detail ? `\n<b>详情:</b> ${escapeHtml(detail)}` : ""

  const message = `
<b>${meta.emoji} 安全告警 - ${meta.title}</b>${ipLine}${emailLine}${countLine}${detailLine}

<i>静默 30 分钟内同来源不再重复推送</i>
<i>⏰ ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</i>
`.trim()

  const ok = await sendTelegramMessage(message)
  if (ok) {
    await recordAlertSent(type, dedupeKey, ip, email)
  }
  return ok
}

export async function logAttackAttempt(params: {
  type: AttackType
  ip?: string
  email?: string
  detail?: string
}) {
  const { type, ip, email, detail } = params
  try {
    await sql`
      INSERT INTO risk_logs (email, client_ip, risk_type, risk_reason, risk_score)
      VALUES (${email || "system"}, ${ip || null}, ${type}, ${detail || type}, ${0})
    `
  } catch (error) {
    console.error("[SecurityAlert] Failed to record attack attempt:", error)
  }
}

export async function countRecentByType(params: {
  type: AttackType
  ip?: string
  windowMinutes: 5 | 10 | 30 | 60
}): Promise<number> {
  const { type, ip, windowMinutes } = params
  if (!ip) return 0
  try {
    let rows: any[] = []
    if (windowMinutes === 5) {
      rows = await sql`
        SELECT COUNT(*)::int as count FROM risk_logs
        WHERE risk_type = ${type} AND client_ip = ${ip}
          AND created_at > NOW() - INTERVAL '5 minutes'
      `
    } else if (windowMinutes === 10) {
      rows = await sql`
        SELECT COUNT(*)::int as count FROM risk_logs
        WHERE risk_type = ${type} AND client_ip = ${ip}
          AND created_at > NOW() - INTERVAL '10 minutes'
      `
    } else if (windowMinutes === 30) {
      rows = await sql`
        SELECT COUNT(*)::int as count FROM risk_logs
        WHERE risk_type = ${type} AND client_ip = ${ip}
          AND created_at > NOW() - INTERVAL '30 minutes'
      `
    } else {
      rows = await sql`
        SELECT COUNT(*)::int as count FROM risk_logs
        WHERE risk_type = ${type} AND client_ip = ${ip}
          AND created_at > NOW() - INTERVAL '60 minutes'
      `
    }
    return rows[0]?.count || 0
  } catch (error) {
    console.error("[SecurityAlert] Failed to count by type:", error)
    return 0
  }
}
