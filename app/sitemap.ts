import type { MetadataRoute } from "next"
import { neon } from "@neondatabase/serverless"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://upgrade.xiaoheiwan.com"
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/purchase`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/activate`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/activate/gpt`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/activate/claude`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/activate/grok`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/activate/team`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/guide`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/recommendations`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    // 注意: /order-lookup 设置了 noindex，不包含在 sitemap 中
  ]

  // Dynamic blog posts
  let blogPages: MetadataRoute.Sitemap = []
  let productPages: MetadataRoute.Sitemap = []

  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Fetch published blog posts
    const blogPosts = await sql`
      SELECT slug, updated_at, created_at FROM blog_posts 
      WHERE status = 'published' 
      ORDER BY created_at DESC
    `
    blogPages = blogPosts.map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updated_at || post.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

    // Fetch active products
    const products = await sql`
      SELECT id, updated_at, created_at FROM products 
      WHERE status = 'active' 
      ORDER BY created_at DESC
    `
    productPages = products.map((product: any) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: product.updated_at || product.created_at || now,
      changeFrequency: "daily" as const,
      priority: 0.85,
    }))
  } catch (error) {
    console.error("Sitemap: Failed to fetch dynamic content", error)
  }

  return [...staticPages, ...productPages, ...blogPages]
}
