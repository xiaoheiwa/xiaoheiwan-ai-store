"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Eye, Tag, Share2, Check, Loader2, FileText } from "lucide-react"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  status: string
  tags: string[]
  view_count: number
  published_at: string
  created_at: string
  updated_at: string
}

// Simple markdown renderer
function renderMarkdown(md: string): string {
  let html = md
    // Code blocks (``` ... ```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="blog-code-block"><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="blog-inline-code">$1</code>')
    // Markdown images: ![alt](url)
    .replace(/!\[([^\]]*)\]\(([^)\s]+(?:\?[^)\s]*)?)\)/g, '<img src="$2" alt="$1" class="blog-img" loading="lazy" />')
    // Bare image URLs on their own line (png, jpg, jpeg, gif, webp, svg, with optional query params)
    .replace(/^(https?:\/\/[^\s]+\.(?:png|jpe?g|gif|webp|svg|bmp)(?:\?[^\s]*)?)$/gim, '<img src="$1" alt="" class="blog-img" loading="lazy" />')
    // HTML img tags (passthrough, ensure they get the class)
    .replace(/<img\s+([^>]*?)(?:\s*\/?)>/gi, (match, attrs) => {
      if (!attrs.includes('class=')) return `<img ${attrs} class="blog-img" loading="lazy" />`
      return match
    })
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="blog-link" target="_blank" rel="noopener noreferrer">$1</a>')
    // H3
    .replace(/^### (.+)$/gm, '<h3 class="blog-h3">$1</h3>')
    // H2
    .replace(/^## (.+)$/gm, '<h2 class="blog-h2">$1</h2>')
    // H1
    .replace(/^# (.+)$/gm, '<h1 class="blog-h1">$1</h1>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="blog-blockquote">$1</blockquote>')
    // Unordered list
    .replace(/^- (.+)$/gm, '<li class="blog-li">$1</li>')
    // Ordered list
    .replace(/^\d+\. (.+)$/gm, '<li class="blog-li blog-li-ordered">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="blog-hr" />')
    // Paragraphs: wrap remaining lines (skip lines that are already HTML tags)
    .replace(/^(?!<[a-z/])((?!<\/)[^\n]+)$/gm, '<p class="blog-p">$1</p>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li class="blog-li">[\s\S]*?<\/li>(\n)?)+/g, (match) => {
      if (match.includes('blog-li-ordered')) return `<ol class="blog-ol">${match}</ol>`
      return `<ul class="blog-ul">${match}</ul>`
    })

  return html
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetch(`/api/blog/${slug}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null } return r.json() })
      .then(data => { if (data) setPost(data) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  const htmlContent = useMemo(() => {
    if (!post?.content) return ""
    return renderMarkdown(post.content)
  }, [post?.content])

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
  }

  // Handle image clicks for lightbox
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === "IMG") {
      const src = (target as HTMLImageElement).src
      if (src) setLightboxSrc(src)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">{"文章未找到"}</h1>
        <p className="text-sm text-muted-foreground mb-6">{"该文章不存在或尚未发布"}</p>
        <Link href="/blog" className="text-sm text-accent hover:underline">{"返回博客列表"}</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <article className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Back */}
        <Link href="/blog" className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {"返回博客"}
        </Link>

        {/* Header */}
        <header className="mb-8">
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                >
                  <Tag className="w-3 h-3" />{tag}
                </Link>
              ))}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4 text-balance">{post.title}</h1>
          {post.excerpt && <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>}
          <div className="flex items-center gap-4 mt-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDate(post.published_at)}</span>
            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{post.view_count} {"次阅读"}</span>
            <button onClick={handleShare} className="flex items-center gap-1.5 hover:text-foreground transition-colors ml-auto">
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Share2 className="w-4 h-4" />}
              {copied ? "已复制" : "分享"}
            </button>
          </div>
        </header>

        {/* Content */}
        <div
          className="blog-content"
          onClick={handleContentClick}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border">
          <div className="flex items-center justify-between">
            <Link href="/blog" className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {"返回博客列表"}
            </Link>
            <button onClick={handleShare} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? "已复制链接" : "复制链接"}
            </button>
          </div>
        </footer>
      </article>

      {/* Image Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
