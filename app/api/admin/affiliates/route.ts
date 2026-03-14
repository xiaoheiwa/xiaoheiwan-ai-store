import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAdminRequest } from "@/lib/admin-auth"

const sql = neon(process.env.DATABASE_URL!)

// GET - List all affiliate links
export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const links = await sql`
      SELECT * FROM affiliate_links 
      ORDER BY sort_order ASC, created_at DESC
    `
    return NextResponse.json({ ok: true, links })
  } catch (error) {
    console.error("Failed to fetch affiliate links:", error)
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 })
  }
}

// POST - Create new affiliate link
export async function POST(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, description, url, category, logo_url, highlight, sort_order } = await request.json()

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO affiliate_links (name, description, url, category, logo_url, highlight, sort_order, is_active, created_at)
      VALUES (${name}, ${description || null}, ${url}, ${category || "other"}, ${logo_url || null}, ${highlight || null}, ${sort_order || 0}, true, NOW())
      RETURNING *
    `

    return NextResponse.json({ ok: true, link: result[0] })
  } catch (error) {
    console.error("Failed to create affiliate link:", error)
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 })
  }
}

// PUT - Update affiliate link
export async function PUT(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, name, description, url, category, logo_url, highlight, sort_order, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await sql`
      UPDATE affiliate_links SET
        name = COALESCE(${name}, name),
        description = ${description !== undefined ? description : null},
        url = COALESCE(${url}, url),
        category = COALESCE(${category}, category),
        logo_url = ${logo_url !== undefined ? logo_url : null},
        highlight = ${highlight !== undefined ? highlight : null},
        sort_order = COALESCE(${sort_order}, sort_order),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ ok: true, message: "Link updated" })
  } catch (error) {
    console.error("Failed to update affiliate link:", error)
    return NextResponse.json({ error: "Failed to update link" }, { status: 500 })
  }
}

// DELETE - Delete affiliate link
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await sql`DELETE FROM affiliate_links WHERE id = ${id}`

    return NextResponse.json({ ok: true, message: "Link deleted" })
  } catch (error) {
    console.error("Failed to delete affiliate link:", error)
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 })
  }
}
