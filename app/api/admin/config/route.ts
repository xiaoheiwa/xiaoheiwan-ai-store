import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAdminRequest } from "@/lib/admin-auth"

const sql = neon(process.env.DATABASE_URL!)

// GET - Get all config or specific key
export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key) {
      const result = await sql`SELECT * FROM site_config WHERE key = ${key}`
      return NextResponse.json({ config: result[0] || null })
    }

    const configs = await sql`SELECT * FROM site_config ORDER BY key`
    return NextResponse.json({ configs })
  } catch (error) {
    console.error("Get config error:", error)
    return NextResponse.json({ error: "Failed to get config" }, { status: 500 })
  }
}

// PUT - Update config value
export async function PUT(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 })
    }

    await sql`
      INSERT INTO site_config (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update config error:", error)
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
  }
}
