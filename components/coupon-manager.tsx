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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Loader2, Copy, Check, Ticket, Users, Eye, RefreshCw } from "lucide-react"

interface Referrer {
  id: number
  name: string
  email: string
  referral_code: string
  commission_rate: number
  status: string
}

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
  referrer_id: number | null
  commission_rate: number | null
  referrer_name?: string
}

interface CouponUsage {
  id: string
  coupon_code: string
  order_no: string
  user_email: string
  discount_amount: number
  order_amount: number
  commission_amount: number
  referrer_name: string | null
  used_at: string
}

export function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [referrers, setReferrers] = useState<Referrer[]>([])
  const [usageRecords, setUsageRecords] = useState<CouponUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [usageDialogOpen, setUsageDialogOpen] = useState(false)
  const [selectedCouponCode, setSelectedCouponCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [error, setError] = useState<string | null>(null)
  
  // 新建优惠码表单 - 使用简单的初始值
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "fixed",
    discount_value: "",
    min_order_amount: "0",
    max_discount_amount: "",
    usage_limit: "",
    per_user_limit: "1",
    valid_until: "",
    notes: "",
    referrer_id: "",
    commission_rate: ""
  })

  // 加载优惠码列表
  async function loadCoupons() {
    try {
      const res = await fetch("/api/coupons")
      const data = await res.json()
      if (data.success) {
        setCoupons(data.data)
      }
    } catch (err) {
      console.error("加载优惠码失败:", err)
    } finally {
      setLoading(false)
    }
  }

  // 加载推广用户列表
  async function loadReferrers() {
    try {
      const res = await fetch("/api/referrers")
      const data = await res.json()
      if (data.success) {
        setReferrers(data.data.filter((r: Referrer) => r.status === "active"))
      }
    } catch (err) {
      console.error("加载推广用户失败:", err)
    }
  }

  // 加载使用记录
  async function loadUsageRecords(couponCode?: string) {
    try {
      const url = couponCode 
        ? `/api/coupons/usage?code=${encodeURIComponent(couponCode)}`
        : "/api/coupons/usage"
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setUsageRecords(data.data)
      }
    } catch (err) {
      console.error("加载使用记录失败:", err)
    }
  }

  useEffect(() => {
    loadCoupons()
    loadReferrers()
  }, [])

  // 生成随机优惠码
  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, code }))
  }

  // 重置表单
  function resetForm() {
    setFormData({
      code: "",
      discount_type: "fixed",
      discount_value: "",
      min_order_amount: "0",
      max_discount_amount: "",
      usage_limit: "",
      per_user_limit: "1",
      valid_until: "",
      notes: "",
      referrer_id: "",
      commission_rate: ""
    })
    setError(null)
  }

  // 选择推广用户时自动生成专属码
  function handleReferrerChange(value: string) {
    if (value === "none" || !value) {
      setFormData(prev => ({ ...prev, referrer_id: "", commission_rate: "" }))
      return
    }
    
    const referrer = referrers.find(r => r.id.toString() === value)
    if (referrer) {
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
      const newCode = `${referrer.referral_code}${suffix}`
      setFormData(prev => ({ 
        ...prev, 
        referrer_id: value,
        code: newCode,
        commission_rate: referrer.commission_rate.toString()
      }))
    }
  }

  // 创建优惠码
  async function handleCreate() {
    console.log("[v0] handleCreate 被调用, formData:", formData)
    setError(null)
    
    if (!formData.code.trim()) {
      console.log("[v0] 验证失败: 优惠码为空")
      setError("请填写优惠码")
      return
    }
    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      console.log("[v0] 验证失败: 折扣值无效", formData.discount_value)
      setError("请填写有效的折扣值")
      return
    }

    console.log("[v0] 验证通过, 开始创建优惠码")
    setCreating(true)
    
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        per_user_limit: parseInt(formData.per_user_limit) || 1,
        valid_until: formData.valid_until || null,
        notes: formData.notes.trim() || null,
        referrer_id: formData.referrer_id ? parseInt(formData.referrer_id) : null,
        commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : null
      }
      
      console.log("[v0] 发送创建优惠码请求:", JSON.stringify(payload))
      
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      
      console.log("[v0] 请求完成, 状态:", res.status)
      const data = await res.json()
      console.log("[v0] 创建优惠码响应:", JSON.stringify(data))
      
      if (data.success) {
        console.log("[v0] 创建成功, 关闭对话框")
        setDialogOpen(false)
        resetForm()
        loadCoupons()
      } else {
        console.log("[v0] 创建失败:", data.error)
        setError(data.error || "创建失败")
      }
    } catch (err) {
      console.error("[v0] 创建优惠码异常:", err)
      setError("创建失败，请重试: " + (err instanceof Error ? err.message : String(err)))
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
    } catch (err) {
      console.error("删除优惠码失败:", err)
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
    } catch (err) {
      console.error("更新状态失败:", err)
    }
  }

  // 复制优惠码
  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // 查看使用记录
  function viewUsage(couponCode: string) {
    setSelectedCouponCode(couponCode)
    loadUsageRecords(couponCode)
    setUsageDialogOpen(true)
  }

  // 格式化折扣显示
  function formatDiscount(coupon: Coupon) {
    if (coupon.discount_type === "fixed") {
      return `¥${coupon.discount_value}`
    }
    return `${coupon.discount_value}%${coupon.max_discount_amount ? `（最高¥${coupon.max_discount_amount}）` : ""}`
  }

  // 筛选优惠码
  const filteredCoupons = activeTab === "all" 
    ? coupons 
    : activeTab === "referrer" 
      ? coupons.filter(c => c.referrer_id)
      : coupons.filter(c => !c.referrer_id)

  // 统计数据
  const stats = {
    total: coupons.length,
    referrer: coupons.filter(c => c.referrer_id).length,
    active: coupons.filter(c => c.status === "active").length,
    totalUsed: coupons.reduce((sum, c) => sum + c.used_count, 0)
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
            <CardDescription>管理优惠码和推广用户专属码</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建优惠码
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新建优惠码</DialogTitle>
                <DialogDescription>创建普通优惠码或推广用户专属码</DialogDescription>
              </DialogHeader>
              
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="grid gap-4 py-4">
                {/* 关联推广用户 */}
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    关联推广用户（可选）
                  </Label>
                  <Select 
                    value={formData.referrer_id || "none"} 
                    onValueChange={handleReferrerChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="不关联（普通优惠码）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">不关联（普通优惠码）</SelectItem>
                      {referrers.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.name} ({r.referral_code}) - 佣金{r.commission_rate}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.referrer_id && (
                    <p className="text-xs text-muted-foreground">
                      已选择推广用户，已自动生成专属码前缀
                    </p>
                  )}
                </div>

                {/* 优惠码 */}
                <div className="grid gap-2">
                  <Label>优惠码 *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="输入或生成优惠码"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* 折扣类型和值 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>折扣类型</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, discount_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">固定金额</SelectItem>
                        <SelectItem value="percent">百分比</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>折扣值 *</Label>
                    <Input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                      placeholder={formData.discount_type === "fixed" ? "金额" : "百分比"}
                    />
                  </div>
                </div>

                {/* 百分比折扣的最高减免 */}
                {formData.discount_type === "percent" && (
                  <div className="grid gap-2">
                    <Label>最高减免金额</Label>
                    <Input
                      type="number"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_discount_amount: e.target.value }))}
                      placeholder="留空表示不限制"
                    />
                  </div>
                )}

                {/* 最低消费 */}
                <div className="grid gap-2">
                  <Label>最低消费金额</Label>
                  <Input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                {/* 使用次数限制 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>总使用次数</Label>
                    <Input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                      placeholder="不限制"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>每人限用</Label>
                    <Input
                      type="number"
                      value={formData.per_user_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, per_user_limit: e.target.value }))}
                      placeholder="1"
                    />
                  </div>
                </div>

                {/* 有效期 */}
                <div className="grid gap-2">
                  <Label>有效期至</Label>
                  <Input
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>

                {/* 推广用户佣金比例 */}
                {formData.referrer_id && (
                  <div className="grid gap-2">
                    <Label>佣金比例 (%)</Label>
                    <Input
                      type="number"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: e.target.value }))}
                      placeholder="使用推广用户默认比例"
                    />
                    <p className="text-xs text-muted-foreground">
                      留空则使用推广用户的默认佣金比例
                    </p>
                  </div>
                )}

                {/* 备注 */}
                <div className="grid gap-2">
                  <Label>备注</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="内部备注（可选）"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">总优惠码</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.referrer}</div>
            <div className="text-sm text-muted-foreground">推广专属码</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.active}</div>
            <div className="text-sm text-muted-foreground">生效中</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.totalUsed}</div>
            <div className="text-sm text-muted-foreground">总使用次数</div>
          </div>
        </div>

        {/* 标签页筛选 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="normal">普通优惠码</TabsTrigger>
            <TabsTrigger value="referrer">推广专属码</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 优惠码列表 */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无优惠码
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>优惠码</TableHead>
                <TableHead>折扣</TableHead>
                <TableHead>使用/限制</TableHead>
                <TableHead>推广用户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                        {coupon.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
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
                  <TableCell>{formatDiscount(coupon)}</TableCell>
                  <TableCell>
                    {coupon.used_count}/{coupon.usage_limit || "∞"}
                  </TableCell>
                  <TableCell>
                    {coupon.referrer_name ? (
                      <Badge variant="secondary" className="text-xs">
                        {coupon.referrer_name}
                        {coupon.commission_rate && ` (${coupon.commission_rate}%)`}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={coupon.status === "active" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(coupon.id, coupon.status)}
                    >
                      {coupon.status === "active" ? "生效" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewUsage(coupon.code)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(coupon.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* 使用记录弹窗 */}
        <Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>优惠码使用记录</DialogTitle>
              <DialogDescription>
                {selectedCouponCode && `优惠码: ${selectedCouponCode}`}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-auto">
              {usageRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无使用记录
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单号</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>订单金额</TableHead>
                      <TableHead>优惠金额</TableHead>
                      <TableHead>佣金</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-xs">
                          {record.order_no}
                        </TableCell>
                        <TableCell className="text-xs">
                          {record.user_email}
                        </TableCell>
                        <TableCell>¥{record.order_amount}</TableCell>
                        <TableCell className="text-green-600">
                          -¥{record.discount_amount}
                        </TableCell>
                        <TableCell>
                          {record.commission_amount > 0 ? (
                            <span className="text-blue-600">¥{record.commission_amount}</span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(record.used_at).toLocaleString("zh-CN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
