import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// GET - List all active affiliate links (public)
export async function GET() {
  try {
    const links = await sql`
      SELECT id, name, description, url, category, logo_url, highlight, sort_order
      FROM affiliate_links 
      WHERE is_active = true
      ORDER BY sort_order ASC, created_at DESC
    `
    return NextResponse.json({ ok: true, links })
  } catch (error) {
    console.error("Failed to fetch affiliate links:", error)
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 })
  }
}
