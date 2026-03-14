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
