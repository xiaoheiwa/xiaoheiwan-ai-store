"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Loader2, Copy, Check, Users, Eye, EyeOff, RefreshCw, ExternalLink, DollarSign, ShoppingCart } from "lucide-react"

interface Referrer {
  id: number
  name: string
  email: string
  referral_code: string
  commission_rate: number
  status: "active" | "inactive"
  total_orders: number
  total_earnings: number
  available_balance: number
  created_at: string
}

export function ReferrerManager() {
  const [referrers, setReferrers] = useState<Referrer[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedReferrer, setSelectedReferrer] = useState<Referrer | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    referral_code: "",
    commission_rate: "10",
  })

  const loadReferrers = useCallback(async () => {
    try {
      const res = await fetch("/api/referrers?all=true")
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

  // 生成随机推广码
  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    let code = ""
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setForm({ ...form, referral_code: code })
  }

  // 生成随机密码
  function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
    let password = ""
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setForm({ ...form, password })
  }

  // 重置表单
  function resetForm() {
    setForm({
      username: "",
      email: "",
      password: "",
      referral_code: "",
      commission_rate: "10",
    })
    setError("")
    setShowPassword(false)
  }

  const handleCreate = async () => {
    setError("")

    if (!form.username.trim()) {
      setError("请填写推广用户名")
      return
    }
    if (!form.email.trim()) {
      setError("请填写邮箱地址")
      return
    }
    if (!form.password || form.password.length < 6) {
      setError("密码至少6位")
      return
    }
    if (!form.referral_code.trim()) {
      setError("请填写推广码")
      return
    }
    if (!form.commission_rate || parseFloat(form.commission_rate) <= 0 || parseFloat(form.commission_rate) > 100) {
      setError("佣金比例需在0-100之间")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/referrers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          referral_code: form.referral_code.trim().toUpperCase(),
          commission_rate: parseFloat(form.commission_rate),
        }),
      })

      const data = await res.json()
      if (data.success) {
        resetForm()
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

  // 删除推广用户
  const handleDelete = async () => {
    if (!selectedReferrer) return

    try {
      const res = await fetch(`/api/referrers?id=${selectedReferrer.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        loadReferrers()
      } else {
        alert(data.error || "删除失败")
      }
    } catch (err) {
      console.error("删除推广用户失败:", err)
      alert("删除失败，请重试")
    } finally {
      setDeleteDialogOpen(false)
      setSelectedReferrer(null)
    }
  }

  // 切换状态
  const toggleStatus = async (referrer: Referrer) => {
    const newStatus = referrer.status === "active" ? "inactive" : "active"
    try {
      const res = await fetch("/api/referrers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: referrer.id, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        loadReferrers()
      }
    } catch (err) {
      console.error("更新状态失败:", err)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(text)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // 统计数据
  const stats = {
    total: referrers.length,
    active: referrers.filter(r => r.status === "active").length,
    totalEarnings: referrers.reduce((sum, r) => sum + (r.total_earnings || 0), 0),
    totalOrders: referrers.reduce((sum, r) => sum + (r.total_orders || 0), 0),
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              推广用户管理
            </CardTitle>
            <CardDescription>
              管理推广用户及其佣金设置。注意：推广用户创建后信息不可修改，如需变更请删除后重新创建。
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                添加推广用户
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>添加推广用户</DialogTitle>
                <DialogDescription>
                  创建新的推广用户。创建后信息将不可修改，请仔细核对。
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">用户名 *</Label>
                  <Input
                    id="username"
                    placeholder="推广用户的显示名称"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱地址 *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="用于登录推广员面板"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">登录密码 *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="至少6位"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">推广用户登录 /referrer 面板查看佣金时使用</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="referral_code">推广码 *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="referral_code"
                      placeholder="2-6位大写字母"
                      value={form.referral_code}
                      onChange={(e) => setForm({ ...form, referral_code: e.target.value.toUpperCase() })}
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">用户专属优惠码将以此为前缀</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="commission_rate">佣金比例 (%) *</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={form.commission_rate}
                    onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">基于实付金额计算佣金</p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  创建
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="w-4 h-4" />
              总推广用户
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Check className="w-4 h-4" />
              活跃用户
            </div>
            <div className="text-2xl font-bold">{stats.active}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <ShoppingCart className="w-4 h-4" />
              总推广订单
            </div>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              总佣金
            </div>
            <div className="text-2xl font-bold">¥{stats.totalEarnings.toFixed(2)}</div>
          </div>
        </div>

        {/* 推广用户列表 */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : referrers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无推广用户</p>
            <p className="text-sm mt-1">点击上方按钮添加第一个推广用户</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead>推广码</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>佣金比例</TableHead>
                <TableHead>订单/佣金</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrers.map((referrer) => (
                <TableRow key={referrer.id}>
                  <TableCell className="font-medium">{referrer.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                        {referrer.referral_code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(referrer.referral_code)}
                      >
                        {copiedCode === referrer.referral_code ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {referrer.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{referrer.commission_rate}%</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span>{referrer.total_orders || 0} 单</span>
                      <span className="mx-1 text-muted-foreground">/</span>
                      <span className="text-green-600">¥{(referrer.total_earnings || 0).toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={referrer.status === "active" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(referrer)}
                    >
                      {referrer.status === "active" ? "活跃" : "已禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open("/referrer", "_blank")}
                        title="查看推广员面板"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReferrer(referrer)
                          setDeleteDialogOpen(true)
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* 删除确认对话框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确定删除此推广用户？</AlertDialogTitle>
              <AlertDialogDescription>
                删除后，该用户的所有优惠码将失去关联，但历史使用记录和佣金数据将保留。
                此操作不可撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
