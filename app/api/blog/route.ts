import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Public: list published posts only
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
    const limit = Math.min(20, Math.max(6, parseInt(url.searchParams.get("limit") || "12")))
    const tag = url.searchParams.get("tag") || ""
    const offset = (page - 1) * limit

    let posts, totalResult

    if (tag) {
      totalResult = await sql`
        SELECT COUNT(*) as count FROM blog_posts
        WHERE status = 'published' AND ${tag} = ANY(tags)
      `
      posts = await sql`
        SELECT id, title, slug, excerpt, cover_image, tags, view_count, published_at
        FROM blog_posts
        WHERE status = 'published' AND ${tag} = ANY(tags)
        ORDER BY published_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      totalResult = await sql`SELECT COUNT(*) as count FROM blog_posts WHERE status = 'published'`
      posts = await sql`
        SELECT id, title, slug, excerpt, cover_image, tags, view_count, published_at
        FROM blog_posts
        WHERE status = 'published'
        ORDER BY published_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    }

    const total = parseInt(totalResult[0]?.count || "0")

    return NextResponse.json({
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("[blog] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}
