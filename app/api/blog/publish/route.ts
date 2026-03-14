import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Verify API key
function verifyApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const apiKey = authHeader?.replace("Bearer ", "")
  
  // Use BLOG_API_KEY environment variable
  const validKey = process.env.BLOG_API_KEY
  if (!validKey) {
    console.error("[blog/publish] BLOG_API_KEY not configured")
    return false
  }
  
  return apiKey === validKey
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, "") // Keep Chinese chars, letters, numbers, spaces, hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove multiple hyphens
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
    + "-" + Date.now().toString(36) // Add unique suffix
}

/**
 * POST /api/blog/publish
 * 
 * Create and optionally publish a blog post via API
 * 
 * Headers:
 *   Authorization: Bearer YOUR_BLOG_API_KEY
 *   Content-Type: application/json
 * 
 * Body:
 * {
 *   "title": "文章标题",           // Required
 *   "content": "Markdown内容",     // Required
 *   "excerpt": "摘要",             // Optional, auto-generated if not provided
 *   "slug": "custom-slug",         // Optional, auto-generated from title if not provided
 *   "cover_image": "https://...",  // Optional
 *   "tags": ["tag1", "tag2"],      // Optional
 *   "status": "published"          // Optional: "draft" or "published", default "published"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "post": { id, title, slug, status, ... },
 *   "url": "https://upgrade.xiaoheiwan.com/blog/your-slug"
 * }
 */
export async function POST(request: NextRequest) {
  // Verify API key
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing API key" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { title, content, excerpt, slug, cover_image, tags, status = "published" } = body

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Bad Request", message: "Title is required" },
        { status: 400 }
      )
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Bad Request", message: "Content is required" },
        { status: 400 }
      )
    }

    // Generate or validate slug
    let finalSlug = slug ? slug.trim() : generateSlug(title)
    
    // Check slug uniqueness
    const existing = await sql`SELECT id FROM blog_posts WHERE slug = ${finalSlug}`
    if (existing.length > 0) {
      // Append timestamp to make it unique
      finalSlug = finalSlug + "-" + Date.now().toString(36)
    }

    // Auto-generate excerpt if not provided
    const finalExcerpt = excerpt || content
      .replace(/[#*`>\[\]!_~]/g, "") // Remove markdown syntax
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim()
      .substring(0, 200) + (content.length > 200 ? "..." : "")

    // Validate status
    const finalStatus = status === "draft" ? "draft" : "published"
    const publishedAt = finalStatus === "published" ? new Date().toISOString() : null

    // Process tags
    const tagsArray = Array.isArray(tags) ? tags.filter(t => typeof t === "string") : []
    const tagsLiteral = `{${tagsArray.map((t: string) => `"${t.replace(/"/g, '\\"')}"`).join(",")}}`

    // Insert post
    const result = await sql`
      INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, status, tags, published_at)
      VALUES (
        ${title.trim()}, 
        ${finalSlug}, 
        ${finalExcerpt}, 
        ${content.trim()}, 
        ${cover_image || null}, 
        ${finalStatus}, 
        ${tagsLiteral}::text[], 
        ${publishedAt}
      )
      RETURNING id, title, slug, excerpt, status, tags, published_at, created_at
    `

    const post = result[0]
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://upgrade.xiaoheiwan.com"

    return NextResponse.json({
      success: true,
      post,
      url: `${baseUrl}/blog/${post.slug}`,
    }, { status: 201 })

  } catch (error) {
    console.error("[blog/publish] Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create post" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/blog/publish
 * 
 * API documentation / health check
 */
export async function GET(request: NextRequest) {
  // Optionally verify API key for listing
  const hasAuth = verifyApiKey(request)
  
  return NextResponse.json({
    name: "Blog Publish API",
    version: "1.0",
    authenticated: hasAuth,
    endpoints: {
      "POST /api/blog/publish": {
        description: "Create and publish a blog post",
        headers: {
          "Authorization": "Bearer YOUR_BLOG_API_KEY",
          "Content-Type": "application/json"
        },
        body: {
          title: "string (required)",
          content: "string (required, Markdown supported)",
          excerpt: "string (optional, auto-generated)",
          slug: "string (optional, auto-generated)",
          cover_image: "string (optional, URL)",
          tags: "string[] (optional)",
          status: "string (optional, 'draft' or 'published', default 'published')"
        },
        response: {
          success: true,
          post: { id: "uuid", title: "string", slug: "string", "...": "..." },
          url: "https://upgrade.xiaoheiwan.com/blog/your-slug"
        }
      }
    }
  })
}
