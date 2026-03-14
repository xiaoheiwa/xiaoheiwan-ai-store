"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  X,
  GripVertical,
  Link2,
  Eye,
  EyeOff,
} from "lucide-react"

interface AffiliateLink {
  id: string
  name: string
  description: string | null
  url: string
  category: string
  logo_url: string | null
  highlight: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

interface AffiliateManagerProps {
  adminToken: string
}

const CATEGORIES = ["VPS", "代理/节点", "静态IP", "域名", "CDN", "其他"]

export function AffiliateManager({ adminToken }: AffiliateManagerProps) {
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    description: "",
    url: "",
    category: "VPS",
    logo_url: "",
    highlight: "",
    sort_order: "0",
  })

  const loadLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/affiliates", {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      const data = await res.json()
      if (data.ok) {
        setLinks(data.links)
      }
    } catch (error) {
      console.error("Failed to load affiliate links:", error)
    }
    setLoading(false)
  }, [adminToken])

  useEffect(() => {
    loadLinks()
  }, [loadLinks])

  const resetForm = () => {
    setForm({ name: "", description: "", url: "", category: "VPS", logo_url: "", highlight: "", sort_order: "0" })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (link: AffiliateLink) => {
    setForm({
      name: link.name,
      description: link.description || "",
      url: link.url,
      category: link.category,
      logo_url: link.logo_url || "",
      highlight: link.highlight || "",
      sort_order: String(link.sort_order),
    })
    setEditingId(link.id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.url) {
      setMessage("名称和链接为必填项")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setSaving(true)
    try {
      const method = editingId ? "PUT" : "POST"
      const body = editingId
        ? { id: editingId, ...form, sort_order: Number(form.sort_order) }
        : { ...form, sort_order: Number(form.sort_order) }

      const res = await fetch("/api/admin/affiliates", {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(editingId ? "更新成功" : "添加成功")
        resetForm()
        loadLinks()
      } else {
        setMessage(data.error || "操作失败")
      }
    } catch {
      setMessage("操作失败")
    }
    setSaving(false)
    setTimeout(() => setMessage(""), 3000)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setMessage("删除成功")
        loadLinks()
      } else {
        setMessage("删除失败")
      }
    } catch {
      setMessage("删除失败")
    }
    setDeletingId(null)
    setTimeout(() => setMessage(""), 3000)
  }

  const handleToggleStatus = async (link: AffiliateLink) => {
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ id: link.id, is_active: !link.is_active }),
      })
      if (res.ok) {
        loadLinks()
      }
    } catch {
      setMessage("操作失败")
    }
  }

  // Group links by category
  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.category]) acc[link.category] = []
    acc[link.category].push(link)
    return acc
  }, {} as Record<string, AffiliateLink[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{"推广链接管理"}</h2>
          <p className="text-sm text-muted-foreground">{"管理您的推广链接，在推荐页面展示"}</p>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <span className="text-sm px-3 py-1.5 rounded-full bg-accent/10 text-accent">{message}</span>
          )}
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {"添加推广"}
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{editingId ? "编辑推广链接" : "添加推广链接"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{"名称"} <span className="text-destructive">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如: RackNerd VPS"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{"分类"}</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>{"推广链接"} <span className="text-destructive">*</span></Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div>
              <Label>{"描述"}</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="简短描述该服务的特点和优惠..."
                className="w-full mt-1 h-20 p-3 border border-input bg-background text-sm rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{"图标 URL"}</Label>
                <Input
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">{"留空使用默认图标"}</p>
              </div>
              <div>
                <Label>{"标签"}</Label>
                <Input
                  value={form.highlight}
                  onChange={(e) => setForm({ ...form, highlight: e.target.value })}
                  placeholder="例如: 热门、限时优惠"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{"排序"}</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">{"数字越小越靠前"}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={resetForm}>{"取消"}</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingId ? "保存修改" : "添加推广"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links List */}
      {links.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Link2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">{"暂无推广链接"}</p>
            <p className="text-sm text-muted-foreground mt-1">{"点击上方「添加推广」按钮创建第一个推广链接"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {category}
                  <Badge variant="secondary" className="text-xs">{categoryLinks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {categoryLinks.map((link) => (
                    <div
                      key={link.id}
                      className={`flex items-center gap-4 p-4 group hover:bg-muted/30 transition-colors ${!link.is_active ? "opacity-50" : ""}`}
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                        {link.logo_url ? (
                          <img src={link.logo_url} alt={link.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <Link2 className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{link.name}</span>
                          {link.highlight && (
                            <Badge variant="outline" className="text-xs shrink-0">{link.highlight}</Badge>
                          )}
                          {!link.is_active && (
                            <Badge variant="secondary" className="text-xs shrink-0">{"已隐藏"}</Badge>
                          )}
                        </div>
                        {link.description && (
                          <p className="text-sm text-muted-foreground truncate mt-0.5">{link.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground/70 truncate mt-1 font-mono">{link.url}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(link.url, "_blank")}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="打开链接"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(link)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title={link.is_active ? "隐藏" : "显示"}
                        >
                          {link.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(link)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(link.id)}
                          disabled={deletingId === link.id}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          title="删除"
                        >
                          {deletingId === link.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Link */}
      {links.length > 0 && (
        <div className="text-center">
          <Button variant="outline" onClick={() => window.open("/recommendations", "_blank")} className="gap-2">
            <ExternalLink className="w-4 h-4" />
            {"预览推荐页面"}
          </Button>
        </div>
      )}
    </div>
  )
}
