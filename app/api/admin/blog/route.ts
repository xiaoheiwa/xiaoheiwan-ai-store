import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// List all posts (admin - includes drafts)
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(10, parseInt(url.searchParams.get("limit") || "20")))
    const status = url.searchParams.get("status") || ""
    const search = url.searchParams.get("search") || ""
    const offset = (page - 1) * limit

    let posts, totalResult

    if (search && status) {
      totalResult = await sql`
        SELECT COUNT(*) as count FROM blog_posts
        WHERE (title ILIKE ${'%' + search + '%'} OR excerpt ILIKE ${'%' + search + '%'})
        AND status = ${status}
      `
      posts = await sql`
        SELECT id, title, slug, excerpt, cover_image, status, tags, view_count, published_at, created_at, updated_at
        FROM blog_posts
        WHERE (title ILIKE ${'%' + search + '%'} OR excerpt ILIKE ${'%' + search + '%'})
        AND status = ${status}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (search) {
      totalResult = await sql`
        SELECT COUNT(*) as count FROM blog_posts
        WHERE title ILIKE ${'%' + search + '%'} OR excerpt ILIKE ${'%' + search + '%'}
      `
      posts = await sql`
        SELECT id, title, slug, excerpt, cover_image, status, tags, view_count, published_at, created_at, updated_at
        FROM blog_posts
        WHERE title ILIKE ${'%' + search + '%'} OR excerpt ILIKE ${'%' + search + '%'}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (status) {
      totalResult = await sql`SELECT COUNT(*) as count FROM blog_posts WHERE status = ${status}`
      posts = await sql`
        SELECT id, title, slug, excerpt, cover_image, status, tags, view_count, published_at, created_at, updated_at
        FROM blog_posts WHERE status = ${status}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      totalResult = await sql`SELECT COUNT(*) as count FROM blog_posts`
      posts = await sql`
        SELECT id, title, slug, excerpt, cover_image, status, tags, view_count, published_at, created_at, updated_at
        FROM blog_posts
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    }

    const total = parseInt(totalResult[0]?.count || "0")

    return NextResponse.json({
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("[admin/blog] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

// Create post
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { title, slug, excerpt, content, cover_image, status, tags } = body

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "Title, slug, and content are required" }, { status: 400 })
    }

    // Check slug uniqueness
    const existing = await sql`SELECT id FROM blog_posts WHERE slug = ${slug}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
    }

    const publishedAt = status === "published" ? new Date().toISOString() : null
    const tagsArray = tags && tags.length > 0 ? tags : []
    const tagsLiteral = `{${tagsArray.map((t: string) => `"${t.replace(/"/g, '\\"')}"`).join(",")}}`

    const result = await sql`
      INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, status, tags, published_at)
      VALUES (${title}, ${slug}, ${excerpt || null}, ${content}, ${cover_image || null}, ${status || 'draft'}, ${tagsLiteral}::text[], ${publishedAt})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[admin/blog] POST error:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}

// Update post
export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, title, slug, excerpt, content, cover_image, status, tags } = body

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Check slug uniqueness (exclude current post)
    if (slug) {
      const existing = await sql`SELECT id FROM blog_posts WHERE slug = ${slug} AND id != ${id}`
      if (existing.length > 0) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      }
    }

    // Get current post to check status change
    const current = await sql`SELECT status, published_at FROM blog_posts WHERE id = ${id}`
    if (current.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Set published_at when first publishing
    let publishedAt = current[0].published_at
    if (status === "published" && current[0].status !== "published") {
      publishedAt = new Date().toISOString()
    }

    const tagsArray = tags && tags.length > 0 ? tags : []
    const tagsLiteral = `{${tagsArray.map((t: string) => `"${t.replace(/"/g, '\\"')}"`).join(",")}}`

    const result = await sql`
      UPDATE blog_posts SET
        title = COALESCE(${title || null}, title),
        slug = COALESCE(${slug || null}, slug),
        excerpt = ${excerpt ?? null},
        content = COALESCE(${content || null}, content),
        cover_image = ${cover_image ?? null},
        status = COALESCE(${status || null}, status),
        tags = ${tagsLiteral}::text[],
        published_at = ${publishedAt},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[admin/blog] PUT error:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}

// Delete post
export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    await sql`DELETE FROM blog_posts WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[admin/blog] DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
