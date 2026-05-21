import { getEnv } from "./env"
import { sql } from "@/lib/db"

interface SendCodeMailOptions {
  to: string
  subject: string
  activationCode: string
  orderNo?: string
  productName?: string
  customMessage?: string
}

interface EmailTemplate {
  shop_name: string
  greeting_text: string
  tips_text: string
  wechat_id: string
  footer_text: string
  primary_color: string
  custom_note: string | null
}

const DEFAULT_TEMPLATE: EmailTemplate = {
  shop_name: "小黑丸AI激活码商城",
  greeting_text: "您好，感谢您的购买！您的激活码已准备就绪。",
  tips_text: "请妥善保管您的激活码，切勿泄露给他人\n激活码仅限一次使用，使用后将自动失效\n如遇问题请添加客服微信获取帮助",
  wechat_id: "xbbdkj-com",
  footer_text: "此邮件由系统自动发送，请勿回复",
  primary_color: "#0f172a",
  custom_note: null,
}

async function loadTemplate(): Promise<EmailTemplate> {
  try {
    const result = await sql`SELECT * FROM email_templates WHERE id = 'default'`
    if (result.length > 0) {
      return {
        shop_name: result[0].shop_name || DEFAULT_TEMPLATE.shop_name,
        greeting_text: result[0].greeting_text || DEFAULT_TEMPLATE.greeting_text,
        tips_text: result[0].tips_text || DEFAULT_TEMPLATE.tips_text,
        wechat_id: result[0].wechat_id || DEFAULT_TEMPLATE.wechat_id,
        footer_text: result[0].footer_text || DEFAULT_TEMPLATE.footer_text,
        primary_color: result[0].primary_color || DEFAULT_TEMPLATE.primary_color,
        custom_note: result[0].custom_note,
      }
    }
  } catch (error) {
    console.error("[v0] Failed to load email template from DB, using defaults:", error)
  }
  return DEFAULT_TEMPLATE
}

export async function sendCodeMail(
  toOrOptions: string | SendCodeMailOptions,
  subject?: string,
  activationCode?: string,
  customMessage?: string,
): Promise<void> {
  let options: SendCodeMailOptions
  if (typeof toOrOptions === "string") {
    options = {
      to: toOrOptions,
      subject: subject || "您的激活码已到账",
      activationCode: activationCode || "",
      customMessage,
    }
  } else {
    options = toOrOptions
  }

  try {
    const resendApiKey = getEnv("RESEND_API_KEY")
    const fromEmail = "noreply@upgrade.xiaoheiwan.com"
    const tpl = await loadTemplate()

    const htmlContent = createEmailHTML(options, tpl)
    const textContent = createEmailText(options, tpl)

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${tpl.shop_name} <${fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: htmlContent,
        text: textContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Resend API error:", errorData)
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`)
    }

    const result = await response.json()
    console.log("[v0] Email sent successfully via Resend:", result.id)
  } catch (error) {
    console.error("[v0] Resend email sending failed:", error)
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export const sendActivationCodeEmail = sendCodeMail

interface SendGlobalDeliveryMailOptions {
  to: string
  orderNo: string
  productName: string
  paymentNetwork?: string | null
  deliveryInfo: string
  usageGuide?: string | null
  supportLink?: string | null
}

export async function sendGlobalDeliveryMail(options: SendGlobalDeliveryMailOptions): Promise<void> {
  try {
    const resendApiKey = getEnv("RESEND_API_KEY")
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@upgrade.xiaoheiwan.com"
    const supportLink = options.supportLink || process.env.GLOBAL_SUPPORT_TELEGRAM || "Telegram support"
    const htmlContent = createGlobalDeliveryHTML({ ...options, supportLink })
    const textContent = createGlobalDeliveryText({ ...options, supportLink })

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Xiaoheiwan Global <${fromEmail}>`,
        to: [options.to],
        subject: "Your Digital Code Has Been Delivered",
        html: htmlContent,
        text: textContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[GlobalMail] Resend API error:", errorData)
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`)
    }
  } catch (error) {
    console.error("[GlobalMail] Delivery email failed:", error)
    throw new Error(`Failed to send global delivery email: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function createGlobalDeliveryHTML(options: SendGlobalDeliveryMailOptions): string {
  const deliveryInfo = escapeHtml(options.deliveryInfo).replace(/\n/g, "<br>")
  const usageGuide = escapeHtml(options.usageGuide || "Please follow the instructions included with your digital delivery.")
  const supportLink = escapeHtml(options.supportLink || "Telegram support")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Digital Code Has Been Delivered</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f3;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <div style="max-width:620px;margin:0 auto;padding:36px 18px;">
    <div style="border:1px solid #111;background:#fff;padding:28px;">
      <p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#666;">Xiaoheiwan Global</p>
      <h1 style="margin:0 0 20px;font-size:28px;line-height:1.2;">Your Digital Code Has Been Delivered</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#444;">Hello,<br>Your order has been delivered.</p>
      <div style="border-top:1px solid #ddd;border-bottom:1px solid #ddd;padding:18px 0;margin:20px 0;">
        <p style="margin:0 0 10px;font-size:13px;color:#666;">Order ID</p>
        <p style="margin:0 0 18px;font-family:monospace;font-size:16px;">${escapeHtml(options.orderNo)}</p>
        <p style="margin:0 0 10px;font-size:13px;color:#666;">Product</p>
        <p style="margin:0 0 18px;font-size:16px;">${escapeHtml(options.productName)}</p>
        <p style="margin:0 0 10px;font-size:13px;color:#666;">Payment Network</p>
        <p style="margin:0;font-family:monospace;font-size:16px;">${escapeHtml(options.paymentNetwork || "USDT")}</p>
      </div>
      <p style="margin:0 0 10px;font-size:13px;color:#666;">Delivery Info</p>
      <div style="background:#f4f4f0;border:1px solid #ddd;padding:16px;font-family:monospace;font-size:15px;line-height:1.7;white-space:normal;">${deliveryInfo}</div>
      <p style="margin:24px 0 10px;font-size:13px;color:#666;">Usage Guide</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444;">${usageGuide}</p>
      <p style="margin:0 0 8px;font-weight:bold;">Important</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#444;">Digital products are non-refundable after delivery. Please keep this email safe.</p>
      <p style="margin:0;font-size:14px;color:#444;">Support: ${supportLink}</p>
    </div>
  </div>
</body>
</html>`
}

function createGlobalDeliveryText(options: SendGlobalDeliveryMailOptions): string {
  return `Hello,

Your order has been delivered.

Order ID:
${options.orderNo}

Product:
${options.productName}

Payment Network:
${options.paymentNetwork || "USDT"}

Delivery Info:
${options.deliveryInfo}

Usage Guide:
${options.usageGuide || "Please follow the instructions included with your digital delivery."}

Important:
Digital products are non-refundable after delivery.
Please keep this email safe.

Support:
${options.supportLink || process.env.GLOBAL_SUPPORT_TELEGRAM || "Telegram support"}`
}

// 推广员申请相关邮件
interface PromoterApprovalEmailOptions {
  to: string
  username: string
  password: string
  referralCode: string
  commissionRate: number
  loginUrl: string
}

interface PromoterRejectionEmailOptions {
  to: string
  username: string
  reason?: string
}

export async function sendPromoterApprovalEmail(options: PromoterApprovalEmailOptions): Promise<void> {
  try {
    const resendApiKey = getEnv("RESEND_API_KEY")
    const fromEmail = "noreply@upgrade.xiaoheiwan.com"
    const tpl = await loadTemplate()

    const htmlContent = createPromoterApprovalHTML(options, tpl)
    const textContent = createPromoterApprovalText(options, tpl)

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${tpl.shop_name} <${fromEmail}>`,
        to: [options.to],
        subject: "恭喜！您的推广员申请已通过",
        html: htmlContent,
        text: textContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Resend API error:", errorData)
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`)
    }

    console.log("[v0] Promoter approval email sent to:", options.to)
  } catch (error) {
    console.error("[v0] Failed to send promoter approval email:", error)
    throw error
  }
}

export async function sendPromoterRejectionEmail(options: PromoterRejectionEmailOptions): Promise<void> {
  try {
    const resendApiKey = getEnv("RESEND_API_KEY")
    const fromEmail = "noreply@upgrade.xiaoheiwan.com"
    const tpl = await loadTemplate()

    const htmlContent = createPromoterRejectionHTML(options, tpl)
    const textContent = createPromoterRejectionText(options, tpl)

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${tpl.shop_name} <${fromEmail}>`,
        to: [options.to],
        subject: "关于您的推广员申请",
        html: htmlContent,
        text: textContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Resend API error:", errorData)
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`)
    }

    console.log("[v0] Promoter rejection email sent to:", options.to)
  } catch (error) {
    console.error("[v0] Failed to send promoter rejection email:", error)
    throw error
  }
}

function createPromoterApprovalHTML(opts: PromoterApprovalEmailOptions, tpl: EmailTemplate): string {
  const primaryColor = tpl.primary_color || "#0f172a"

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>推广员申请已通过</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">🎉</span>
      </div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">恭喜，申请已通过！</h1>
      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">欢迎成为 ${tpl.shop_name} 推广员</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
        亲爱的 <strong>${opts.username}</strong>，<br><br>
        您的推广员申请已通过审核！现在您可以开始推广并赚取佣金了。
      </p>

      <!-- Account Info -->
      <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;">
        <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#1e293b;">您的账户信息</p>
        
        <div style="margin-bottom:12px;">
          <p style="margin:0;font-size:12px;color:#64748b;">登录邮箱</p>
          <p style="margin:4px 0 0;font-size:16px;color:#1e293b;font-family:monospace;">${opts.to}</p>
        </div>
        
        <div style="margin-bottom:12px;">
          <p style="margin:0;font-size:12px;color:#64748b;">登录密码</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#dc2626;font-family:monospace;letter-spacing:1px;">${opts.password}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#f59e0b;">⚠️ 请妥善保管，登录后可修改密码</p>
        </div>
        
        <div style="margin-bottom:12px;">
          <p style="margin:0;font-size:12px;color:#64748b;">您的推广码</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:${primaryColor};font-family:monospace;letter-spacing:2px;">${opts.referralCode}</p>
        </div>
        
        <div>
          <p style="margin:0;font-size:12px;color:#64748b;">佣金比例</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#10b981;">${opts.commissionRate}%</p>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${opts.loginUrl}" style="display:inline-block;background:${primaryColor};color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
          登录推广员面板
        </a>
      </div>

      <!-- Tips -->
      <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#166534;">开始推广</p>
        <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#15803d;line-height:1.8;">
          <li>登录推广员面板获取您的专属推广链接</li>
          <li>分享链接给好友，他们点击购买后您将获得佣金</li>
          <li>佣金实时到账，可随时申请提现</li>
        </ul>
      </div>

      <!-- Contact -->
      ${tpl.wechat_id ? `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;margin-top:24px;">
        <p style="margin:0 0 4px;font-size:13px;color:#64748b;">如有疑问请联系客服</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#07c160;">微信：${tpl.wechat_id}</p>
      </div>` : ""}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;color:#94a3b8;font-size:12px;">
      <p style="margin:0;">${tpl.footer_text}</p>
      <p style="margin:4px 0 0;">&copy; ${new Date().getFullYear()} ${tpl.shop_name}</p>
    </div>
  </div>
</body>
</html>`
}

function createPromoterApprovalText(opts: PromoterApprovalEmailOptions, tpl: EmailTemplate): string {
  return `恭喜！您的推广员申请已通过
================================

亲爱的 ${opts.username}，

您的推广员申请已通过审核！现在您可以开始推广并赚取佣金了。

您的账户信息：
- 登录邮箱：${opts.to}
- 登录密码：${opts.password}（请妥善保管）
- 推广码：${opts.referralCode}
- 佣金比例：${opts.commissionRate}%

登录推广员面板：${opts.loginUrl}

开始推广：
1. 登录推广员面板获取您的专属推广链接
2. 分享链接给好友，他们点击购买后您将获得佣金
3. 佣金实时到账，可随时申请提现

${tpl.wechat_id ? `如有疑问请联系客服微信：${tpl.wechat_id}` : ""}

${tpl.footer_text}
(c) ${new Date().getFullYear()} ${tpl.shop_name}`
}

function createPromoterRejectionHTML(opts: PromoterRejectionEmailOptions, tpl: EmailTemplate): string {
  const primaryColor = tpl.primary_color || "#0f172a"

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>推广员申请结果</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,${primaryColor} 0%,rgba(15,23,42,0.85) 100%);border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${tpl.shop_name}</h1>
      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.7);">推广员申请通知</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
        亲爱的 <strong>${opts.username}</strong>，<br><br>
        感谢您对推广员计划的关注。经过审核，很抱歉您的申请暂时未能通过。
      </p>

      ${opts.reason ? `<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#991b1b;font-weight:600;">原因说明</p>
        <p style="margin:0;font-size:14px;color:#7f1d1d;">${opts.reason}</p>
      </div>` : ""}

      <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin:24px 0;">
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
          您可以在完善相关信息后重新提交申请。如有任何疑问，欢迎联系我们的客服团队。
        </p>
      </div>

      <!-- Contact -->
      ${tpl.wechat_id ? `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;margin-top:24px;">
        <p style="margin:0 0 4px;font-size:13px;color:#64748b;">联系客服</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#07c160;">微信：${tpl.wechat_id}</p>
      </div>` : ""}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;color:#94a3b8;font-size:12px;">
      <p style="margin:0;">${tpl.footer_text}</p>
      <p style="margin:4px 0 0;">&copy; ${new Date().getFullYear()} ${tpl.shop_name}</p>
    </div>
  </div>
</body>
</html>`
}

function createPromoterRejectionText(opts: PromoterRejectionEmailOptions, tpl: EmailTemplate): string {
  return `关于您的推广员申请
================================

亲爱的 ${opts.username}，

感谢您对推广员计划的关注。经过审核，很抱歉您的申请暂时未能通过。

${opts.reason ? `原因说明：${opts.reason}` : ""}

您可以在完善相关信息后重新提交申请。如有任何疑问，欢迎联系我们的客服团队。

${tpl.wechat_id ? `客服微信：${tpl.wechat_id}` : ""}

${tpl.footer_text}
(c) ${new Date().getFullYear()} ${tpl.shop_name}`
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "")
  const r = Number.parseInt(h.substring(0, 2), 16)
  const g = Number.parseInt(h.substring(2, 4), 16)
  const b = Number.parseInt(h.substring(4, 6), 16)
  return `${r},${g},${b}`
}

function lightenColor(hex: string): string {
  const h = hex.replace("#", "")
  const r = Math.min(255, Number.parseInt(h.substring(0, 2), 16) + 200)
  const g = Math.min(255, Number.parseInt(h.substring(2, 4), 16) + 200)
  const b = Math.min(255, Number.parseInt(h.substring(4, 6), 16) + 200)
  return `rgb(${r},${g},${b})`
}

function createEmailHTML(opts: SendCodeMailOptions, tpl: EmailTemplate): string {
  const primaryColor = tpl.primary_color || "#0f172a"
  const lightBg = lightenColor(primaryColor)

  const productSection = opts.productName
    ? `<div style="background:${lightBg};border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#64748b;">购买产品</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#1e293b;">${opts.productName}</p>
      </div>`
    : ""

  const orderSection = opts.orderNo
    ? `<p style="font-size:13px;color:#94a3b8;margin:0 0 4px;">订单号：${opts.orderNo}</p>`
    : ""

  const messageSection = opts.customMessage
    ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#92400e;">${opts.customMessage}</p>
      </div>`
    : ""

  const customNoteSection = tpl.custom_note
    ? `<div style="background:#f0f4ff;border-left:4px solid ${primaryColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#334155;">${tpl.custom_note.replace(/\n/g, "<br>")}</p>
      </div>`
    : ""

  const tipsItems = tpl.tips_text
    .split("\n")
    .filter((t) => t.trim())
    .map((t) => `<li>${t.trim()}</li>`)
    .join("")

  const wechatSection = tpl.wechat_id
    ? `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;margin-top:24px;">
        <p style="margin:0 0 4px;font-size:13px;color:#64748b;">客服微信</p>
        <p style="margin:0;font-size:18px;font-weight:600;color:#07c160;font-family:'Courier New',Courier,monospace;">${tpl.wechat_id}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">如需帮助请添加客服微信</p>
      </div>`
    : ""

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>激活码购买成功</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,${primaryColor} 0%,rgba(${hexToRgb(primaryColor)},0.85) 100%);border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${tpl.shop_name}</h1>
      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.7);">购买成功通知</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
        ${tpl.greeting_text}
      </p>

      ${orderSection}
      ${productSection}
      ${messageSection}
      ${customNoteSection}

      <!-- Activation Code Box -->
      <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">您的激活码</p>
        <p style="margin:0;font-size:26px;font-weight:700;color:${primaryColor};letter-spacing:2px;font-family:'Courier New',Courier,monospace;word-break:break-all;">
          ${opts.activationCode}
        </p>
      </div>

      <!-- Tips -->
      ${tipsItems ? `<div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#166534;">使用提示</p>
        <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#15803d;line-height:1.8;">
          ${tipsItems}
        </ul>
      </div>` : ""}

      ${wechatSection}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;color:#94a3b8;font-size:12px;">
      <p style="margin:0;">${tpl.footer_text}</p>
      <p style="margin:4px 0 0;">&copy; ${new Date().getFullYear()} ${tpl.shop_name}</p>
    </div>
  </div>
</body>
</html>`
}

function createEmailText(opts: SendCodeMailOptions, tpl: EmailTemplate): string {
  const lines = [
    `${tpl.shop_name} - 购买成功通知`,
    "================================",
    "",
    tpl.greeting_text,
    "",
  ]

  if (opts.orderNo) lines.push(`订单号：${opts.orderNo}`)
  if (opts.productName) lines.push(`购买产品：${opts.productName}`)
  if (opts.orderNo || opts.productName) lines.push("")

  if (opts.customMessage) {
    lines.push(`备注：${opts.customMessage}`, "")
  }

  if (tpl.custom_note) {
    lines.push(`商家提示：${tpl.custom_note}`, "")
  }

  lines.push(`您的激活码：${opts.activationCode}`, "")

  if (tpl.tips_text) {
    lines.push("使用提示：")
    tpl.tips_text.split("\n").filter((t) => t.trim()).forEach((t) => lines.push(`- ${t.trim()}`))
    lines.push("")
  }

  if (tpl.wechat_id) {
    lines.push(`客服微信：${tpl.wechat_id}`, "")
  }

  lines.push(
    tpl.footer_text,
    `(c) ${new Date().getFullYear()} ${tpl.shop_name}`,
  )

  return lines.join("\n")
}
