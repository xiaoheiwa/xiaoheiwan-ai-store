import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// 生成随机密码
function generatePassword(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// 生成推广码
function generateReferralCode(username: string) {
  const base = username.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 6)
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase()
  return base + suffix
}

// GET - 获取所有申请
export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let applications
    if (status && status !== "all") {
      applications = await sql`
        SELECT * FROM promoter_applications 
        WHERE status = ${status}
        ORDER BY 
          CASE status WHEN 'pending' THEN 0 ELSE 1 END,
          created_at DESC
      `
    } else {
      applications = await sql`
        SELECT * FROM promoter_applications 
        ORDER BY 
          CASE status WHEN 'pending' THEN 0 ELSE 1 END,
          created_at DESC
      `
    }

    return NextResponse.json({
      success: true,
      data: applications
    })
  } catch (error) {
    console.error("[v0] 获取申请列表失败:", error)
    return NextResponse.json({
      success: true,
      data: []
    })
  }
}

// POST - 审核申请（批准或拒绝）
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, action, admin_note, commission_rate = 10 } = body

    if (!id || !action) {
      return NextResponse.json({
        success: false,
        error: "缺少必要参数"
      }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({
        success: false,
        error: "无效的操作"
      }, { status: 400 })
    }

    const sql = getDb()

    // 获取申请信息
    const applications = await sql`
      SELECT * FROM promoter_applications WHERE id = ${id}
    `
    if (applications.length === 0) {
      return NextResponse.json({
        success: false,
        error: "申请不存在"
      }, { status: 404 })
    }

    const application = applications[0]
    
    if (application.status !== "pending") {
      return NextResponse.json({
        success: false,
        error: "该申请已处理过"
      }, { status: 400 })
    }

    if (action === "approve") {
      // 生成密码和推广码
      const password = generatePassword()
      const passwordHash = await bcrypt.hash(password, 10)
      const referralCode = generateReferralCode(application.username)

      // 检查推广码是否存在（如有冲突则重新生成）
      let finalCode = referralCode
      const existing = await sql`SELECT id FROM referrers WHERE referral_code = ${referralCode}`
      if (existing.length > 0) {
        finalCode = generateReferralCode(application.username + Date.now())
      }

      // 创建推广员账户
      await sql`
        INSERT INTO referrers (
          username, email, password_hash, referral_code, commission_rate, status
        ) VALUES (
          ${application.username}, ${application.email}, ${passwordHash}, 
          ${finalCode}, ${commission_rate}, 'active'
        )
      `

      // 更新申请状态
      await sql`
        UPDATE promoter_applications 
        SET status = 'approved', admin_note = ${admin_note || null}, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = ${id}
      `

      // TODO: 发送邮件通知用户（包含登录密码）
      // 这里可以集成邮件服务

      return NextResponse.json({
        success: true,
        message: "申请已批准",
        data: {
          email: application.email,
          password: password, // 返回给管理员，用于手动通知用户
          referral_code: finalCode,
          commission_rate: commission_rate
        }
      })
    } else {
      // 拒绝申请
      await sql`
        UPDATE promoter_applications 
        SET status = 'rejected', admin_note = ${admin_note || null}, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = ${id}
      `

      return NextResponse.json({
        success: true,
        message: "申请已拒绝"
      })
    }
  } catch (error) {
    console.error("[v0] 审核申请失败:", error)
    return NextResponse.json({
      success: false,
      error: "操作失败: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}
