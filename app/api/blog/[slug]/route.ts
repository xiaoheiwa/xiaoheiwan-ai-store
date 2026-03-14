import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Public: get single published post by slug + increment view count
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    // Increment view count and return post in one query
    const result = await sql`
      UPDATE blog_posts
      SET view_count = view_count + 1
      WHERE slug = ${slug} AND status = 'published'
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[blog/slug] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}
