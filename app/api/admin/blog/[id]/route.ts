import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { id } = await params
    const result = await sql`SELECT * FROM blog_posts WHERE id = ${id}`
    if (result.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[admin/blog/id] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}
