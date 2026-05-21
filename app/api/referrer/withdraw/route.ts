import { NextResponse } from "next/server"
import { neon } from "@/lib/db-client"
import { jwtVerify } from "jose"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set")
  }
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

// 验证 token
async function verifyToken(request: Request): Promise<number | null> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (payload.type !== "referrer" || !payload.id) {
      return null
    }
    return payload.id as number
  } catch {
    return null
  }
}

// GET - 获取提现记录
export async function GET(request: Request) {
  try {
    const referrerId = await verifyToken(request)
    if (!referrerId) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 })
    }

    const sql = getDb()

    const withdrawals = await sql`
      SELECT id, amount, payment_method, payment_account, status, 
             admin_note, created_at, processed_at
      FROM withdrawal_requests 
      WHERE referrer_id = ${referrerId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      success: true,
      data: withdrawals.map((w: any) => ({
        ...w,
        amount: Number(w.amount)
      }))
    })
  } catch (error) {
    console.error("[v0] 获取提现记录失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "获取提现记录失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}

// POST - 申请提现
export async function POST(request: Request) {
  try {
    const referrerId = await verifyToken(request)
    if (!referrerId) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 })
    }

    const sql = getDb()
    const body = await request.json()
    const { amount, payment_method, payment_account } = body

    // 验证参数
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "请输入有效的提现金额" }, { status: 400 })
    }

    if (!payment_method || !["alipay", "wechat", "bank"].includes(payment_method)) {
      return NextResponse.json({ success: false, error: "请选择有效的收款方式" }, { status: 400 })
    }

    if (!payment_account || !payment_account.trim()) {
      return NextResponse.json({ success: false, error: "请填写收款账号" }, { status: 400 })
    }

    // 检查可提现余额
    const users = await sql`
      SELECT available_balance FROM referrers WHERE id = ${referrerId}
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 })
    }

    const availableBalance = Number(users[0].available_balance) || 0

    if (amount > availableBalance) {
      return NextResponse.json({ 
        success: false, 
        error: `提现金额超出可用余额，当前可提现 ¥${availableBalance.toFixed(2)}` 
      }, { status: 400 })
    }

    // 检查是否有待处理的提现申请
    const pending = await sql`
      SELECT id FROM withdrawal_requests 
      WHERE referrer_id = ${referrerId} AND status = 'pending'
      LIMIT 1
    `

    if (pending.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: "您有一笔提现申请正在处理中，请等待处理完成后再申请" 
      }, { status: 400 })
    }

    // 创建提现申请
    const result = await sql`
      INSERT INTO withdrawal_requests (referrer_id, amount, payment_method, payment_account, status)
      VALUES (${referrerId}, ${amount}, ${payment_method}, ${payment_account.trim()}, 'pending')
      RETURNING id, amount, payment_method, payment_account, status, created_at
    `

    // 扣减可提现余额（冻结）
    await sql`
      UPDATE referrers 
      SET available_balance = available_balance - ${amount}, 
          updated_at = NOW()
      WHERE id = ${referrerId}
    `

    return NextResponse.json({
      success: true,
      data: {
        ...result[0],
        amount: Number(result[0].amount)
      },
      message: "提现申请已提交，请等待管理员处理"
    })
  } catch (error) {
    console.error("[v0] 提现申请失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "提现申请失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}
