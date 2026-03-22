import type { MetadataRoute } from "next"
import { neon } from "@neondatabase/serverless"
import { locales, defaultLocale } from "@/i18n/config"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://upgrade.xiaoheiwan.com"
  const now = new Date()

  // Helper to generate URLs for all locales
  const generateLocalizedUrls = (path: string, lastModified: Date, changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never", priority: number) => {
    return locales.map(locale => ({
      url: locale === defaultLocale ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`,
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [l, l === defaultLocale ? `${baseUrl}${path}` : `${baseUrl}/${l}${path}`])
        )
      }
    }))
  }

  // Static pages with localization
  const staticPaths = [
    { path: "", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/purchase", changeFrequency: "daily" as const, priority: 0.9 },
    { path: "/activate", changeFrequency: "weekly" as const, priority: 0.85 },
    { path: "/activate/gpt", changeFrequency: "weekly" as const, priority: 0.85 },
    { path: "/activate/team", changeFrequency: "weekly" as const, priority: 0.85 },
    { path: "/activate/claude", changeFrequency: "weekly" as const, priority: 0.85 },
    { path: "/activate/grok", changeFrequency: "weekly" as const, priority: 0.85 },
    { path: "/guide", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/blog", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/recommendations", changeFrequency: "weekly" as const, priority: 0.7 },
    { path: "/order-lookup", changeFrequency: "weekly" as const, priority: 0.6 },
  ]

  const staticPages = staticPaths.flatMap(({ path, changeFrequency, priority }) =>
    generateLocalizedUrls(path, now, changeFrequency, priority)
  )

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
    blogPages = blogPosts.flatMap((post: any) =>
      generateLocalizedUrls(
        `/blog/${post.slug}`,
        post.updated_at || post.created_at,
        "weekly",
        0.7
      )
    )

    // Fetch active products
    const products = await sql`
      SELECT id, updated_at, created_at FROM products 
      WHERE status = 'active' 
      ORDER BY created_at DESC
    `
    productPages = products.flatMap((product: any) =>
      generateLocalizedUrls(
        `/product/${product.id}`,
        product.updated_at || product.created_at || now,
        "daily",
        0.85
      )
    )
  } catch (error) {
    console.error("Sitemap: Failed to fetch dynamic content", error)
  }

  return [...staticPages, ...productPages, ...blogPages]
}
