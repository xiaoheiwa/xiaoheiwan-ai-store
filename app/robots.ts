import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://upgrade.xiaoheiwan.com"

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/purchase", "/guide", "/activate", "/activate/gpt", "/activate/team", "/blog", "/recommendations", "/product"],
        disallow: ["/api/", "/admin/", "/success", "/order/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/purchase", "/guide", "/activate", "/activate/gpt", "/activate/team", "/blog", "/recommendations", "/product"],
        disallow: ["/api/", "/admin/", "/success", "/order/"],
      },
      {
        userAgent: "Baiduspider",
        allow: ["/", "/purchase", "/guide", "/activate", "/activate/gpt", "/activate/team", "/blog", "/recommendations", "/product"],
        disallow: ["/api/", "/admin/", "/success", "/order/"],
      },
      // Allow AI search crawlers
      {
        userAgent: "GPTBot",
        allow: ["/", "/purchase", "/guide", "/activate", "/activate/gpt", "/activate/team"],
        disallow: ["/api/", "/admin/", "/success", "/order/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/"],
        disallow: ["/api/", "/admin/", "/success", "/order/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/"],
        disallow: ["/api/", "/admin/", "/success", "/order/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/"],
        disallow: ["/api/", "/admin/", "/success", "/order/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/"],
        disallow: ["/api/", "/admin/", "/success", "/order/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/"],
        disallow: ["/api/", "/admin/", "/success", "/order/"],
      },
      {
        userAgent: "Bytespider",
        allow: ["/"],
        disallow: ["/api/", "/admin/", "/success", "/order/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
