"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Clock, Eye, Tag, ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  tags: string[]
  view_count: number
  published_at: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTag, setActiveTag] = useState("")
  const [allTags, setAllTags] = useState<string[]>([])

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" })
      if (activeTag) params.set("tag", activeTag)
      const res = await fetch(`/api/blog?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
        setTotalPages(data.pagination.totalPages)
        // Collect tags
        const tags = new Set<string>()
        data.posts.forEach((p: BlogPost) => p.tags?.forEach((t: string) => tags.add(t)))
        if (allTags.length === 0 && tags.size > 0) setAllTags(Array.from(tags))
      }
    } catch (e) { console.error("Load error:", e) }
    finally { setLoading(false) }
  }, [page, activeTag])

  useEffect(() => { loadPosts() }, [loadPosts])

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {"返回首页"}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 text-balance">{"博客"}</h1>
          <p className="text-muted-foreground text-lg">{"教程、公告和实用技巧"}</p>
        </div>

        {/* Tags filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => { setActiveTag(""); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!activeTag ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {"全部"}
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => { setActiveTag(tag); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTag === tag ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">{"暂无文章"}</h2>
            <p className="text-sm text-muted-foreground">{"文章发布后会在这里展示"}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group glass-card card-shadow rounded-xl p-5 hover-lift block transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Tags */}
                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {post.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                            <Tag className="w-2.5 h-2.5" />{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="font-semibold text-foreground text-base sm:text-lg mb-1.5 line-clamp-2 group-hover:text-accent transition-colors">{post.title}</h2>
                    {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(post.published_at)}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.view_count}</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-secondary group-hover:bg-accent/10 transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-sm font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary/80 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />{"上一页"}
            </button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-sm font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary/80 transition-colors"
            >
              {"下一页"}<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
