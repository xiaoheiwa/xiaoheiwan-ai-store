"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Loader2, Copy, Check } from "lucide-react"

interface Referrer {
  id: number
  username: string
  referral_code: string
  commission_rate: number
  status: "active" | "inactive"
  created_at: string
}

export function ReferrerManager() {
  const [referrers, setReferrers] = useState<Referrer[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    username: "",
    referral_code: "",
    commission_rate: "10",
  })

  const loadReferrers = useCallback(async () => {
    try {
      const res = await fetch("/api/referrers")
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setReferrers(data.data)
      }
    } catch (err) {
      console.error("加载推广用户失败:", err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadReferrers()
  }, [loadReferrers])

  const handleCreate = async () => {
    setError("")

    if (!form.username.trim()) {
      setError("请填写推广用户名")
      return
    }
    if (!form.referral_code.trim()) {
      setError("请填写推广码")
      return
    }
    if (!form.commission_rate || parseFloat(form.commission_rate) <= 0) {
      setError("请填写有效的佣金比例")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/referrers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          referral_code: form.referral_code.trim(),
          commission_rate: parseFloat(form.commission_rate),
        }),
      })

      const data = await res.json()
      if (data.success) {
        setForm({ username: "", referral_code: "", commission_rate: "10" })
        setDialogOpen(false)
        loadReferrers()
      } else {
        setError(data.error || "创建失败")
      }
    } catch (err) {
      setError("创建失败，请重试")
      console.error("创建推广用户失败:", err)
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">推广用户管理</h1>
          <p className="text-muted-foreground mt-1">创建和管理推广用户，为他们分配专属推广码和佣金比例</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              添加推广用户
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建推广用户</DialogTitle>
              <DialogDescription>添加一个新的推广用户并为其分配推广码</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {error && <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">{error}</div>}

              <div className="grid gap-2">
                <Label htmlFor="username">推广用户名</Label>
                <Input
                  id="username"
                  placeholder="如: xiaohei"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="referral_code">推广码</Label>
                <Input
                  id="referral_code"
                  placeholder="如: XH"
                  value={form.referral_code}
                  onChange={(e) => setForm({ ...form, referral_code: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">推广用户的专属优惠码会以此为前缀</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="commission_rate">佣金比例（%）</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="如: 10"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">推广用户的默认佣金比例（基于实付金额）</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  创建
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : referrers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">暂无推广用户</p>
            <p className="text-sm text-muted-foreground mt-1">点击上方"添加推广用户"创建第一个推广用户</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {referrers.map((referrer) => (
            <Card key={referrer.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{referrer.username}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">{referrer.referral_code}</code>
                      <button
                        onClick={() => copyToClipboard(referrer.referral_code)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        {copied === referrer.referral_code ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-accent">{referrer.commission_rate}%</div>
                    <div className="text-xs text-muted-foreground">佣金比例</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  创建于 {new Date(referrer.created_at).toLocaleDateString("zh-CN")}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={referrer.status === "active" ? "default" : "secondary"}>
                    {referrer.status === "active" ? "活跃" : "已禁用"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
