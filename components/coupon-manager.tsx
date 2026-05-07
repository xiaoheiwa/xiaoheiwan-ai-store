"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Loader2, Copy, Check, Ticket } from "lucide-react"

interface Coupon {
  id: string
  code: string
  discount_type: "fixed" | "percent"
  discount_value: number
  min_order_amount: number
  max_discount_amount: number | null
  usage_limit: number | null
  used_count: number
  per_user_limit: number
  valid_from: string
  valid_until: string | null
  status: "active" | "inactive" | "expired"
  notes: string | null
  created_at: string
}

export function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  // 新建优惠码表单
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "fixed" as "fixed" | "percent",
    discount_value: "",
    min_order_amount: "0",
    max_discount_amount: "",
    usage_limit: "",
    per_user_limit: "1",
    valid_until: "",
    notes: ""
  })

  // 加载优惠码列表
  async function loadCoupons() {
    try {
      const res = await fetch("/api/coupons")
      const data = await res.json()
      if (data.success) {
        setCoupons(data.data)
      }
    } catch (error) {
      console.error("加载优惠码失败:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  // 生成随机优惠码
  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCoupon({ ...newCoupon, code })
  }

  // 创建优惠码
  async function handleCreate() {
    if (!newCoupon.code || !newCoupon.discount_value) {
      alert("请填写优惠码和折扣值")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCoupon.code,
          discount_type: newCoupon.discount_type,
          discount_value: parseFloat(newCoupon.discount_value),
          min_order_amount: parseFloat(newCoupon.min_order_amount) || 0,
          max_discount_amount: newCoupon.max_discount_amount ? parseFloat(newCoupon.max_discount_amount) : null,
          usage_limit: newCoupon.usage_limit ? parseInt(newCoupon.usage_limit) : null,
          per_user_limit: parseInt(newCoupon.per_user_limit) || 1,
          valid_until: newCoupon.valid_until || null,
          notes: newCoupon.notes || null
        })
      })
      const data = await res.json()
      if (data.success) {
        setDialogOpen(false)
        setNewCoupon({
          code: "",
          discount_type: "fixed",
          discount_value: "",
          min_order_amount: "0",
          max_discount_amount: "",
          usage_limit: "",
          per_user_limit: "1",
          valid_until: "",
          notes: ""
        })
        loadCoupons()
      } else {
        alert(data.error || "创建失败")
      }
    } catch (error) {
      console.error("创建优惠码失败:", error)
      alert("创建失败")
    } finally {
      setCreating(false)
    }
  }

  // 删除优惠码
  async function handleDelete(id: string) {
    if (!confirm("确定要删除此优惠码吗？")) return

    try {
      const res = await fetch(`/api/coupons?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        loadCoupons()
      } else {
        alert(data.error || "删除失败")
      }
    } catch (error) {
      console.error("删除优惠码失败:", error)
    }
  }

  // 切换状态
  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    try {
      const res = await fetch("/api/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        loadCoupons()
      }
    } catch (error) {
      console.error("更新状态失败:", error)
    }
  }

  // 复制优惠码
  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // 格式化折扣显示
  function formatDiscount(coupon: Coupon) {
    if (coupon.discount_type === "fixed") {
      return `¥${coupon.discount_value}`
    }
    return `${coupon.discount_value}%${coupon.max_discount_amount ? `（最高¥${coupon.max_discount_amount}）` : ""}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              优惠码管理
            </CardTitle>
            <CardDescription>管理私域用户专属优惠码</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建优惠码
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新建优惠码</DialogTitle>
                <DialogDescription>为私域用户创建专属优惠码</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>优惠码</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                      placeholder="例如: VIP2024"
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={generateCode}>随机生成</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>折扣类型</Label>
                    <Select 
                      value={newCoupon.discount_type} 
                      onValueChange={(v) => setNewCoupon({ ...newCoupon, discount_type: v as "fixed" | "percent" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">固定金额</SelectItem>
                        <SelectItem value="percent">百分比折扣</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>{newCoupon.discount_type === "fixed" ? "优惠金额 (¥)" : "折扣比例 (%)"}</Label>
                    <Input 
                      type="number"
                      value={newCoupon.discount_value}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                      placeholder={newCoupon.discount_type === "fixed" ? "例如: 10" : "例如: 15"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>最低订单金额 (¥)</Label>
                    <Input 
                      type="number"
                      value={newCoupon.min_order_amount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, min_order_amount: e.target.value })}
                      placeholder="0 表示无限制"
                    />
                  </div>
                  {newCoupon.discount_type === "percent" && (
                    <div className="grid gap-2">
                      <Label>最高优惠金额 (¥)</Label>
                      <Input 
                        type="number"
                        value={newCoupon.max_discount_amount}
                        onChange={(e) => setNewCoupon({ ...newCoupon, max_discount_amount: e.target.value })}
                        placeholder="留空表示无限制"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>总使用次数限制</Label>
                    <Input 
                      type="number"
                      value={newCoupon.usage_limit}
                      onChange={(e) => setNewCoupon({ ...newCoupon, usage_limit: e.target.value })}
                      placeholder="留空表示无限制"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>每用户限用次数</Label>
                    <Input 
                      type="number"
                      value={newCoupon.per_user_limit}
                      onChange={(e) => setNewCoupon({ ...newCoupon, per_user_limit: e.target.value })}
                      placeholder="默认: 1"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>有效期至</Label>
                  <Input 
                    type="datetime-local"
                    value={newCoupon.valid_until}
                    onChange={(e) => setNewCoupon({ ...newCoupon, valid_until: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>备注（可选）</Label>
                  <Input 
                    value={newCoupon.notes}
                    onChange={(e) => setNewCoupon({ ...newCoupon, notes: e.target.value })}
                    placeholder="例如: 微信群专属"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />创建中...</> : "创建优惠码"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无优惠码，点击上方按钮创建
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>优惠码</TableHead>
                <TableHead>折扣</TableHead>
                <TableHead>使用情况</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{coupon.code}</code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyCode(coupon.code)}
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-accent">{formatDiscount(coupon)}</span>
                    {coupon.min_order_amount > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        满¥{coupon.min_order_amount}可用
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {coupon.used_count}/{coupon.usage_limit || "∞"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {coupon.valid_until 
                      ? new Date(coupon.valid_until).toLocaleDateString("zh-CN")
                      : "永久有效"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={coupon.status === "active" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(coupon.id, coupon.status)}
                    >
                      {coupon.status === "active" ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                    {coupon.notes || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(coupon.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
