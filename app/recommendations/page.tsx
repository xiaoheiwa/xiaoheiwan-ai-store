"use client"

import { useState, useEffect } from "react"
import { ExternalLink, Sparkles, ArrowLeft, Server, Globe, Wifi, Shield, Layers, Link2 } from "lucide-react"
import Link from "next/link"
import Logo from "@/components/logo"

interface AffiliateLink {
  id: string
  name: string
  description: string | null
  url: string
  category: string
  logo_url: string | null
  highlight: string | null
  sort_order: number
}

const CATEGORY_ICONS: Record<string, any> = {
  "VPS": Server,
  "代理/节点": Wifi,
  "静态IP": Globe,
  "域名": Globe,
  "CDN": Layers,
  "其他": Link2,
}

const CATEGORY_COLORS: Record<string, string> = {
  "VPS": "from-blue-500/20 to-blue-600/5 border-blue-500/20",
  "代理/节点": "from-purple-500/20 to-purple-600/5 border-purple-500/20",
  "静态IP": "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
  "域名": "from-orange-500/20 to-orange-600/5 border-orange-500/20",
  "CDN": "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20",
  "其他": "from-gray-500/20 to-gray-600/5 border-gray-500/20",
}

export default function RecommendationsPage() {
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await fetch("/api/affiliates")
        if (response.ok) {
          const data = await response.json()
          setLinks(data.links || [])
        }
      } catch (error) {
        console.error("Failed to fetch affiliate links:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchLinks()
  }, [])

  // Group links by category
  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.category]) acc[link.category] = []
    acc[link.category].push(link)
    return acc
  }, {} as Record<string, AffiliateLink[]>)

  const categories = Object.keys(groupedLinks)
  const filteredCategories = activeCategory ? [activeCategory] : categories

  return (
    <div className="min-h-screen bg-background dark noise-overlay">
      <div className="fixed inset-0 bg-grid-subtle opacity-40" />
      <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-20">

          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {"返回首页"}
          </Link>

          {/* Hero */}
          <div className="text-center mb-12 animate-fade-up">
            <div className="flex items-center justify-center mb-6">
              <Logo size={48} className="drop-shadow-lg" />
            </div>
            <div className="badge badge-animate mb-6 inline-flex">
              <Sparkles className="w-3.5 h-3.5 icon-rotate" />
              <span>{"精选服务 \u00b7 亲测推荐"}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4 text-reveal text-balance">
              {"推荐服务"}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto text-balance">
              {"这里是我正在使用或亲测过的优质服务商，通过以下链接注册可以获得专属优惠"}
            </p>
          </div>

          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === null
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {"全部"}
              </button>
              {categories.map((category) => {
                const Icon = CATEGORY_ICONS[category] || Link2
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeCategory === category
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {category}
                  </button>
                )
              })}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 rounded-2xl bg-card/50 animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && links.length === 0 && (
            <div className="text-center py-16">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">{"暂无推荐服务"}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">{"敬请期待..."}</p>
            </div>
          )}

          {/* Links Grid */}
          {!loading && links.length > 0 && (
            <div className="space-y-10">
              {filteredCategories.map((category) => {
                const categoryLinks = groupedLinks[category]
                if (!categoryLinks?.length) return null
                const Icon = CATEGORY_ICONS[category] || Link2
                const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS["其他"]

                return (
                  <div key={category} className="animate-fade-up">
                    {/* Category Header */}
                    {!activeCategory && (
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-foreground/80" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">{category}</h2>
                          <p className="text-xs text-muted-foreground">{categoryLinks.length} {"个推荐"}</p>
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group relative block p-5 rounded-2xl bg-gradient-to-br ${colorClass} border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/5`}
                        >
                          {/* Tag */}
                          {link.highlight && (
                            <span className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full text-[10px] font-medium bg-accent text-accent-foreground shadow-lg">
                              {link.highlight}
                            </span>
                          )}

                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-xl bg-card/80 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                              {link.logo_url ? (
                                <img src={link.logo_url} alt={link.name} className="w-7 h-7 object-contain" />
                              ) : (
                                <Icon className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground truncate">{link.name}</h3>
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </div>
                              {link.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{link.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Hover indicator */}
                          <div className="absolute bottom-3 right-4 flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>{"访问"}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-16 text-center">
            <p className="text-xs text-muted-foreground/60 max-w-lg mx-auto">
              {"以上链接包含推广返佣，通过这些链接购买不会增加您的费用，但能帮助支持本站运营。感谢您的支持！"}
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-10 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {"返回首页"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
