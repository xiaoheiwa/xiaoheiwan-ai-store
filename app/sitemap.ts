import type { MetadataRoute } from "next"
import { neon } from "@/lib/db-client"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://upgrade.xiaoheiwan.com"
  const now = new Date()

  // Static pages - 只包含对 SEO 有价值的公开页面
  const staticPages: MetadataRoute.Sitemap = [
    // 核心页面
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
    // 激活页面
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
      url: `${baseUrl}/activate/x`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/activate/gpt-ck`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    // 内容页面
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
    // 特色产品页面
    {
      url: `${baseUrl}/gpt-recharge`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/telegram-premium`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/copilot`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    // 推广员申请
    {
      url: `${baseUrl}/become-promoter`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    // 法律页面
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    // 注意: 以下页面不包含在 sitemap 中:
    // - /order-lookup (用户隐私)
    // - /order/* (订单详情)
    // - /success (支付成功)
    // - /pay/* (支付页面)
    // - /ref/* (推广链接，会重定向)
    // - /referrer (推广员面板)
    // - /admin/* (管理后台)
    // - /tools/* (工具页面)
    // - /unauthorized (授权页面)
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
