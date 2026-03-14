"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AdminSidebar } from "@/components/admin-sidebar"
import {
  ArrowLeft, Plus, Pencil, Trash2, Eye, Search, Loader2, Menu,
  FileText, Save, X, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle, ExternalLink
} from "lucide-react"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image: string | null
  status: "draft" | "published"
  tags: string[]
  view_count: number
  published_at: string | null
  created_at: string
  updated_at: string
}

type EditorMode = "list" | "create" | "edit"

export default function AdminBlogPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginLoading, setLoginLoading] = useState(true)



  // List state
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Editor state
  const [mode, setMode] = useState<EditorMode>("list")
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    status: "draft" as "draft" | "published",
    tags: "",
  })

  // Auth check
  useEffect(() => {
    const token = document.cookie.split("; ").find(c => c.startsWith("admin_token="))?.split("=")[1]
    if (token) {
      fetch("/api/admin/verify", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.ok) setIsAuthenticated(true); else window.location.href = "/admin" })
        .catch(() => window.location.href = "/admin")
        .finally(() => setLoginLoading(false))
    } else {
      window.location.href = "/admin"
    }
  }, [])

  const getToken = () => document.cookie.split("; ").find(c => c.startsWith("admin_token="))?.split("=")[1] || ""

  // Load posts
  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" })
      if (statusFilter) params.set("status", statusFilter)
      if (searchQuery) params.set("search", searchQuery)
      const res = await fetch(`/api/admin/blog?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (e) { console.error("Load posts error:", e) }
    finally { setLoading(false) }
  }, [page, statusFilter, searchQuery])

  useEffect(() => { if (isAuthenticated) loadPosts() }, [isAuthenticated, loadPosts])

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 80)
  }

  const resetForm = () => {
    setForm({ title: "", slug: "", excerpt: "", content: "", cover_image: "", status: "draft", tags: "" })
    setEditingPost(null)
  }

  const openCreate = () => { resetForm(); setMode("create") }

  const openEdit = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      if (res.ok) {
        const fullPost = await res.json()
        setEditingPost(fullPost)
        setForm({
          title: fullPost.title,
          slug: fullPost.slug,
          excerpt: fullPost.excerpt || "",
          content: fullPost.content,
          cover_image: fullPost.cover_image || "",
          status: fullPost.status,
          tags: (fullPost.tags || []).join(", "),
        })
        setMode("edit")
      }
    } catch (e) { console.error("Load post error:", e) }
  }

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.content) return
    setSaving(true)
    try {
      const body = {
        ...(mode === "edit" && editingPost ? { id: editingPost.id } : {}),
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        content: form.content,
        cover_image: form.cover_image || null,
        status: form.status,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      }
      const res = await fetch("/api/admin/blog", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setMode("list")
        resetForm()
        loadPosts()
      } else {
        const err = await res.json()
        alert(err.error || "Save failed")
      }
    } catch (e) { console.error("Save error:", e) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch("/api/admin/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id: deleteId }),
      })
      setDeleteId(null)
      loadPosts()
    } catch (e) { console.error("Delete error:", e) }
    finally { setDeleting(false) }
  }

  const handleTabChange = (tab: string) => {
    if (tab === "blog") return
    window.location.href = `/admin?tab=${tab}`
  }

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; max-age=0"
    window.location.href = "/admin"
  }

  if (loginLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  // Editor view
  if (mode !== "list") {
    return (
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-card/50 backdrop-blur-sm">
            <button onClick={() => { setMode("list"); resetForm() }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              <span>{mode === "create" ? "新建文章" : "编辑文章"}</span>
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, status: f.status === "draft" ? "published" : "draft" }))}>
                {form.status === "published" ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.title || !form.slug || !form.content}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar activeTab="blog" onTabChange={handleTabChange} onLogout={handleLogout} />
        </div>
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Editor Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { setMode("list"); resetForm() }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>{mode === "create" ? "新建文章" : "编辑文章"}</span>
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, status: f.status === "draft" ? "published" : "draft" }))}>
                {form.status === "published" ? <><CheckCircle className="w-4 h-4 mr-1.5" />{"已发布"}</> : <><Clock className="w-4 h-4 mr-1.5" />{"草稿"}</>}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.title || !form.slug || !form.content}>
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                {"保存"}
              </Button>
            </div>
          </div>

          {/* Editor Form */}
          <div className="max-w-4xl space-y-6">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-base">{"基本信息"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{"标题"} *</Label>
                  <Input
                    value={form.title}
                    onChange={e => {
                      const title = e.target.value
                      setForm(f => ({ ...f, title, ...(mode === "create" ? { slug: generateSlug(title) } : {}) }))
                    }}
                    placeholder="文章标题"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Slug *</Label>
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="url-friendly-slug" className="mt-1.5 font-mono text-sm" />
                </div>
                <div>
                  <Label>{"摘要"}</Label>
                  <textarea
                    value={form.excerpt}
                    onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                    placeholder="文章摘要（列表页显示）"
                    rows={2}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{"封面图 URL"}</Label>
                    <Input value={form.cover_image} onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))} placeholder="https://..." className="mt-1.5" />
                  </div>
                  <div>
                    <Label>{"标签"}</Label>
                    <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="教程, ChatGPT, AI" className="mt-1.5" />
                    <p className="text-[11px] text-muted-foreground mt-1">{"用逗号分隔多个标签"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-base">{"正文内容"}</CardTitle></CardHeader>
              <CardContent>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder={"支持 Markdown 格式...\n\n# 标题\n## 小标题\n\n正文内容...\n\n- 列表项\n- 列表项\n\n> 引用\n\n```code```"}
                  rows={20}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y min-h-[400px]"
                />
                <p className="text-[11px] text-muted-foreground mt-2">{"支持 Markdown 格式，保存后前台自动渲染"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-background bg-grid-pattern flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-card/50 backdrop-blur-sm">
          <h1 className="text-lg sm:text-xl font-bold truncate">{"博客管理"}</h1>
          <Button variant="outline" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="min-h-[40px] min-w-[40px] touch-manipulation">
            <Menu className="w-4 h-4" />
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="border-b bg-card shadow-lg">
            <AdminSidebar activeTab="blog" onTabChange={(tab) => { handleTabChange(tab); setMobileMenuOpen(false) }} onLogout={handleLogout} />
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar activeTab="blog" onTabChange={handleTabChange} onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">{"博客管理"}</h1>
              <p className="text-sm text-muted-foreground mt-1">{"创建和管理博客文章"}</p>
            </div>
            <Button onClick={openCreate} className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0">
              <Plus className="w-4 h-4 mr-1.5" />
              {"新建文章"}
            </Button>
          </div>

          {/* Filters */}
          <Card className="bg-card border-border mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
                    placeholder="搜索文章标题..."
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  {[
                    { value: "", label: "全部" },
                    { value: "published", label: "已发布" },
                    { value: "draft", label: "草稿" },
                  ].map(opt => (
                    <Button
                      key={opt.value}
                      variant={statusFilter === opt.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setStatusFilter(opt.value); setPage(1) }}
                      className={statusFilter === opt.value ? "bg-accent text-accent-foreground" : ""}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">{"暂无文章"}</p>
                <Button onClick={openCreate} variant="outline" size="sm" className="mt-4">
                  <Plus className="w-4 h-4 mr-1.5" />{"创建第一篇文章"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <Card key={post.id} className="bg-card border-border hover:border-accent/30 transition-colors group">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{post.title}</h3>
                          <Badge variant={post.status === "published" ? "default" : "secondary"} className={post.status === "published" ? "bg-accent/20 text-accent border-accent/30" : ""}>
                            {post.status === "published" ? "已发布" : "草稿"}
                          </Badge>
                        </div>
                        {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{post.excerpt}</p>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="font-mono">/{post.slug}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.view_count}</span>
                          {post.published_at && <span>{new Date(post.published_at).toLocaleDateString("zh-CN")}</span>}
                          {post.tags?.length > 0 && post.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {post.status === "published" && (
                          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEdit(post)} className="h-8 w-8 p-0">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(post.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{"确认删除"}</h3>
                <p className="text-sm text-muted-foreground">{"删除后无法恢复"}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>{"取消"}</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                {"删除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
