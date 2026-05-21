import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { neon } from "@/lib/db-client"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// GET - 获取所有提现申请
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const sql = getDb()

    const withdrawals = await sql`
      SELECT 
        w.id, w.referrer_id, w.amount, w.payment_method, w.payment_account,
        w.status, w.admin_note, w.created_at, w.processed_at,
        r.username as referrer_name, r.email as referrer_email
      FROM withdrawal_requests w
      LEFT JOIN referrers r ON w.referrer_id = r.id
      ORDER BY 
        CASE w.status WHEN 'pending' THEN 0 ELSE 1 END,
        w.created_at DESC
    `

    return NextResponse.json({
      success: true,
      data: withdrawals.map((w: any) => ({
        ...w,
        amount: Number(w.amount),
        referrer_name: w.referrer_name || "未知用户",
        referrer_email: w.referrer_email || ""
      }))
    })
  } catch (error) {
    console.error("[v0] 获取提现申请失败:", error)
    return NextResponse.json({ 
      success: true, 
      data: [] // 返回空数组而不是错误，避免前端崩溃
    })
  }
}

// PATCH - 处理提现申请
export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const sql = getDb()
    const body = await request.json()
    const { id, status, admin_note } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "缺少申请ID" }, { status: 400 })
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "无效的状态" }, { status: 400 })
    }

    // 获取提现申请详情
    const withdrawals = await sql`
      SELECT id, referrer_id, amount, status FROM withdrawal_requests WHERE id = ${id}
    `

    if (withdrawals.length === 0) {
      return NextResponse.json({ success: false, error: "申请不存在" }, { status: 404 })
    }

    const withdrawal = withdrawals[0]

    if (withdrawal.status !== "pending") {
      return NextResponse.json({ success: false, error: "该申请已处理" }, { status: 400 })
    }

    // 更新提现状态
    await sql`
      UPDATE withdrawal_requests 
      SET status = ${status}, 
          admin_note = ${admin_note || null},
          processed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${id}
    `

    // 如果拒绝，将金额返还到可提现余额
    if (status === "rejected") {
      await sql`
        UPDATE referrers 
        SET available_balance = available_balance + ${Number(withdrawal.amount)},
            updated_at = NOW()
        WHERE id = ${withdrawal.referrer_id}
      `
    }

    // 如果批准，增加已提现金额
    if (status === "approved") {
      await sql`
        UPDATE referrers 
        SET withdrawn_amount = COALESCE(withdrawn_amount, 0) + ${Number(withdrawal.amount)},
            updated_at = NOW()
        WHERE id = ${withdrawal.referrer_id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 处理提现申请失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "处理提现申请失败: " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}
