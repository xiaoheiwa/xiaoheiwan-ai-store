"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Megaphone, Plus, Pencil, Trash2, Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"

interface Notification {
  id: number
  title: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // 编辑表单状态
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_active: true
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          ...formData
        })
      })

      if (res.ok) {
        setMessage({ type: "success", text: editingId ? "通知已更新" : "通知已创建" })
        setFormData({ title: "", content: "", is_active: true })
        setEditingId(null)
        fetchNotifications()
      } else {
        setMessage({ type: "error", text: "保存失败，请重试" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "网络错误，请重试" })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (notification: Notification) => {
    setEditingId(notification.id)
    setFormData({
      title: notification.title || "",
      content: notification.content || "",
      is_active: notification.is_active
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这条通知吗？")) return

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })

      if (res.ok) {
        setMessage({ type: "success", text: "通知已删除" })
        fetchNotifications()
      }
    } catch (error) {
      setMessage({ type: "error", text: "删除失败" })
    }
  }

  const handleToggleActive = async (notification: Notification) => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: notification.id,
          title: notification.title,
          content: notification.content,
          is_active: !notification.is_active
        })
      })

      if (res.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error("Failed to toggle notification:", error)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ title: "", content: "", is_active: true })
  }

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* 编辑/创建表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            {editingId ? "编辑通知" : "创建新通知"}
          </CardTitle>
          <CardDescription>
            通知会显示在网站首页顶部，用户可以手动关闭
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">标题（可选）</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：重要通知"
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  立即启用
                </Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">内容</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="输入通知内容..."
                rows={3}
                required
              />
            </div>

            {/* 预览 */}
            {(formData.title || formData.content) && (
              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-xs text-muted-foreground mb-2">预览效果：</p>
                <div className="flex items-center gap-2 text-sm">
                  <Megaphone className="w-4 h-4 text-accent" />
                  {formData.title && (
                    <span className="font-medium">{formData.title}</span>
                  )}
                  {formData.title && formData.content && (
                    <span className="text-muted-foreground/50">|</span>
                  )}
                  <span className="text-muted-foreground">{formData.content}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving || !formData.content}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? "更新通知" : "发布通知"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  取消
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 通知列表 */}
      <Card>
        <CardHeader>
          <CardTitle>历史通知</CardTitle>
          <CardDescription>
            管理所有通知，同一时间只有一条启用的通知会显示
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无通知，点击上方创建第一条通知
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start justify-between p-4 rounded-lg border ${
                    notification.is_active
                      ? "bg-accent/5 border-accent/30"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      {notification.is_active ? (
                        <Eye className="w-4 h-4 text-accent shrink-0" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${
                        notification.is_active ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {notification.title || "无标题"}
                      </span>
                      {notification.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                          当前显示
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {notification.content}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      更新于 {new Date(notification.updated_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(notification)}
                      title={notification.is_active ? "停用" : "启用"}
                    >
                      {notification.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(notification)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
