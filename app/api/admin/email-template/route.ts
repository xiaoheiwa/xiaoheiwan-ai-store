import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const result = await sql`SELECT * FROM email_templates WHERE id = 'default'`
    if (result.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Get email template error:", error)
    return NextResponse.json({ error: "Failed to load template" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const data = await request.json()

    const result = await sql`
      UPDATE email_templates SET
        shop_name = COALESCE(${data.shop_name ?? null}, shop_name),
        greeting_text = COALESCE(${data.greeting_text ?? null}, greeting_text),
        tips_text = COALESCE(${data.tips_text ?? null}, tips_text),
        wechat_id = COALESCE(${data.wechat_id ?? null}, wechat_id),
        footer_text = COALESCE(${data.footer_text ?? null}, footer_text),
        primary_color = COALESCE(${data.primary_color ?? null}, primary_color),
        custom_note = ${data.custom_note !== undefined ? data.custom_note : null},
        updated_at = NOW()
      WHERE id = 'default'
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update email template error:", error)
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
  }
}
