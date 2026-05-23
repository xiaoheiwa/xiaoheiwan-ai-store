import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

const PIXEL_API_BASE = process.env.PIXEL_API_BASE || "https://pixel.yh-mo.xyz"

type Action = "verify" | "submit" | "query" | "cancel"

function getTaskSigningSecret() {
  return process.env.PIXEL_TASK_SIGNING_SECRET || process.env.CRON_SECRET || ""
}

function createTaskToken(taskId: string, cardKey: string) {
  const secret = getTaskSigningSecret()
  if (!secret) return null
  const cardKeyHash = crypto.createHash("sha256").update(cardKey).digest("hex")
  return crypto.createHmac("sha256", secret).update(`${taskId}:${cardKeyHash}`).digest("hex")
}

function verifyTaskToken(taskId: string, cardKey: string, taskToken: string) {
  const expected = createTaskToken(taskId, cardKey)
  if (!expected) return false
  const expectedBytes = Buffer.from(expected)
  const receivedBytes = Buffer.from(taskToken)
  return expectedBytes.length === receivedBytes.length && crypto.timingSafeEqual(expectedBytes, receivedBytes)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body as { action?: Action }

    let url: string
    let init: RequestInit
    let submittedCardKey: string | null = null

    switch (action) {
      case "verify": {
        const { card_key } = body
        if (!card_key) return NextResponse.json({ error: "缺少 card_key" }, { status: 400 })
        url = `${PIXEL_API_BASE}/api/verify-card`
        init = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card_key }),
        }
        break
      }
      case "submit": {
        const { card_key, accounts_text, service_type } = body
        if (!card_key || !accounts_text) {
          return NextResponse.json({ error: "缺少 card_key 或 accounts_text" }, { status: 400 })
        }
        if (!getTaskSigningSecret()) {
          return NextResponse.json({ error: "任务安全配置缺失，请联系客服" }, { status: 503 })
        }
        submittedCardKey = String(card_key)
        url = `${PIXEL_API_BASE}/api/submit-task`
        init = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card_key,
            accounts_text,
            service_type: service_type || "link_only",
          }),
        }
        break
      }
      case "query": {
        const { task_id, card_key, task_token } = body
        if (!task_id || !card_key || !task_token) {
          return NextResponse.json({ error: "缺少任务访问凭证" }, { status: 400 })
        }
        if (!verifyTaskToken(String(task_id), String(card_key), String(task_token))) {
          return NextResponse.json({ error: "无权访问该任务" }, { status: 403 })
        }
        url = `${PIXEL_API_BASE}/api/task/${encodeURIComponent(task_id)}`
        init = { method: "GET" }
        break
      }
      case "cancel": {
        const { task_id, account_id, card_key, task_token } = body
        if (!task_id || account_id == null || !card_key || !task_token) {
          return NextResponse.json({ error: "缺少任务访问凭证" }, { status: 400 })
        }
        if (!verifyTaskToken(String(task_id), String(card_key), String(task_token))) {
          return NextResponse.json({ error: "无权操作该任务" }, { status: 403 })
        }
        url = `${PIXEL_API_BASE}/api/task/${encodeURIComponent(task_id)}/account/${encodeURIComponent(String(account_id))}/cancel-queue`
        init = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }
        break
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const response = await fetch(url, init)
    const text = await response.text()
    let data: any
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { error: "上游返回非 JSON 响应", raw: text.slice(0, 500) }
    }
    if (action === "submit" && submittedCardKey && data?.task_id) {
      data = {
        ...data,
        task_token: createTaskToken(String(data.task_id), submittedCardKey),
      }
    }
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[Pixel Proxy] Error:", error)
    return NextResponse.json({ error: "代理请求失败，请稍后重试" }, { status: 500 })
  }
}
