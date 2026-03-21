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

// Process content - handles both HTML from Tiptap and legacy Markdown
function processContent(content: string): string {
  // If content already looks like HTML (from Tiptap), just clean it up
  if (content.trim().startsWith('<') && (content.includes('<p>') || content.includes('<h') || content.includes('<div'))) {
    return content
  }
  
  // Otherwise, treat as Markdown and convert to HTML
  let html = content
    // Code blocks (``` ... ```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Markdown images: ![alt](url)
    .replace(/!\[([^\]]*)\]\(([^)\s]+(?:\?[^)\s]*)?)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    // Bare image URLs on their own line
    .replace(/^(https?:\/\/[^\s]+\.(?:png|jpe?g|gif|webp|svg|bmp)(?:\?[^\s]*)?)$/gim, '<img src="$1" alt="" loading="lazy" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // H3
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // H2
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // H1
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered list
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered list
    .replace(/^\d+\. (.+)$/gm, '<li class="ordered">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr />')
    // Paragraphs
    .replace(/^(?!<[a-z/])((?!<\/)[^\n]+)$/gm, '<p>$1</p>')
    // Wrap consecutive <li> in <ul> or <ol>
    .replace(/(<li[^>]*>[\s\S]*?<\/li>(\n)?)+/g, (match) => {
      if (match.includes('class="ordered"')) return `<ol>${match}</ol>`
      return `<ul>${match}</ul>`
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
    return processContent(post.content)
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
          className="prose prose-lg max-w-none dark:prose-invert
            prose-headings:text-foreground prose-headings:font-bold
            prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-10
            prose-h2:text-2xl prose-h2:mb-5 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
            prose-h3:text-xl prose-h3:mb-4 prose-h3:mt-6
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-5
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-a:font-medium
            prose-strong:text-foreground prose-strong:font-semibold
            prose-em:italic
            prose-ul:my-5 prose-ul:pl-6 prose-ul:list-disc
            prose-ol:my-5 prose-ol:pl-6 prose-ol:list-decimal
            prose-li:text-muted-foreground prose-li:mb-2 prose-li:leading-relaxed
            prose-blockquote:border-l-4 prose-blockquote:border-accent/50 prose-blockquote:bg-muted/30 prose-blockquote:pl-5 prose-blockquote:pr-4 prose-blockquote:py-3 prose-blockquote:my-6 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-muted-foreground
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-6 prose-pre:overflow-x-auto
            prose-hr:border-border prose-hr:my-10
            prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8 prose-img:cursor-pointer prose-img:hover:shadow-xl prose-img:transition-shadow prose-img:mx-auto
            [&_mark]:bg-yellow-200/80 [&_mark]:dark:bg-yellow-500/30 [&_mark]:px-1 [&_mark]:rounded
            [&_u]:underline [&_u]:decoration-2 [&_u]:underline-offset-2
            [&_s]:line-through [&_s]:opacity-70
            [&_sub]:text-sm [&_sup]:text-sm
            [&_.text-left]:text-left [&_.text-center]:text-center [&_.text-right]:text-right [&_.text-justify]:text-justify"
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
