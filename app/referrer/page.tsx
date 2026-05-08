"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  User, Mail, Lock, LogOut, TrendingUp, DollarSign, ShoppingCart, 
  Ticket, Copy, Check, Calendar, Loader2, ArrowLeft, Wallet, 
  CreditCard, AlertCircle, RefreshCw
} from "lucide-react"
import Link from "next/link"

interface UserInfo {
  id: number
  username: string
  email: string
  referral_code: string
  commission_rate: number
  total_orders: number
  total_earnings: number
  available_balance: number
  created_at: string
}

interface Coupon {
  id: string
  code: string
  discount_type: string
  discount_value: number
  used_count: number
  usage_limit: number | null
  status: string
  created_at: string
}

interface UsageRecord {
  id: string
  order_no: string
  user_email: string
  order_amount: number
  discount_amount: number
  commission_amount: number
  coupon_code: string
  used_at: string
}

interface Withdrawal {
  id: number
  amount: number
  payment_method: string
  payment_account: string
  status: string
  admin_note: string | null
  created_at: string
  processed_at: string | null
}

interface Stats {
  total_usage: number
  total_order_amount: number
  total_commission: number
  month_usage: number
  month_order_amount: number
  month_commission: number
}

const paymentMethods = [
  { value: "alipay", label: "支付宝" },
  { value: "wechat", label: "微信" },
  { value: "bank", label: "银行卡" },
]

export default function ReferrerPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const [user, setUser] = useState<UserInfo | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  // 提现表单
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    payment_method: "alipay",
    payment_account: "",
  })
  const [withdrawError, setWithdrawError] = useState("")

  // 获取 token
  const getToken = () => localStorage.getItem("referrer_token")

  // 加载数据
  const loadData = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/referrer/stats", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (data.success) {
        setUser(data.data.user)
        setCoupons(data.data.coupons)
        setUsageRecords(data.data.usage_records)
        setStats(data.data.stats)
        setIsLoggedIn(true)
        // 同时加载提现记录
        loadWithdrawals(token)
      } else {
        localStorage.removeItem("referrer_token")
        setIsLoggedIn(false)
      }
    } catch {
      localStorage.removeItem("referrer_token")
    } finally {
      setLoading(false)
    }
  }, [])

  // 加载提现记录
  const loadWithdrawals = async (token: string) => {
    try {
      const res = await fetch("/api/referrer/withdraw", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setWithdrawals(data.data)
      }
    } catch (err) {
      console.error("加载提现记录失败:", err)
    }
  }

  // 检查登录状态
  useEffect(() => {
    const token = getToken()
    if (token) {
      loadData(token)
    } else {
      setLoading(false)
    }
  }, [loadData])

  // 登录
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoginLoading(true)

    try {
      const res = await fetch("/api/referrer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()

      if (data.success) {
        localStorage.setItem("referrer_token", data.data.token)
        setUser(data.data.user)
        setIsLoggedIn(true)
        loadData(data.data.token)
      } else {
        setError(data.error || "登录失败")
      }
    } catch {
      setError("登录失败，请重试")
    } finally {
      setLoginLoading(false)
    }
  }

  // 退出登录
  function handleLogout() {
    localStorage.removeItem("referrer_token")
    setIsLoggedIn(false)
    setUser(null)
    setCoupons([])
    setUsageRecords([])
    setWithdrawals([])
    setStats(null)
  }

  // 刷新数据
  function handleRefresh() {
    const token = getToken()
    if (token) {
      setLoading(true)
      loadData(token)
    }
  }

  // 复制推广码
  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 提交提现申请
  async function handleWithdraw() {
    setWithdrawError("")

    const amount = parseFloat(withdrawForm.amount)
    if (!amount || amount <= 0) {
      setWithdrawError("请输入有效的提现金额")
      return
    }

    if (amount > (user?.available_balance || 0)) {
      setWithdrawError(`提现金额超出可用余额 ¥${user?.available_balance?.toFixed(2)}`)
      return
    }

    if (!withdrawForm.payment_account.trim()) {
      setWithdrawError("请填写收款账号")
      return
    }

    setWithdrawLoading(true)

    try {
      const token = getToken()
      const res = await fetch("/api/referrer/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          payment_method: withdrawForm.payment_method,
          payment_account: withdrawForm.payment_account.trim(),
        }),
      })

      const data = await res.json()

      if (data.success) {
        setWithdrawDialogOpen(false)
        setWithdrawForm({ amount: "", payment_method: "alipay", payment_account: "" })
        // 刷新数据
        if (token) loadData(token)
      } else {
        setWithdrawError(data.error || "提现申请失败")
      }
    } catch {
      setWithdrawError("提现申请失败，请重试")
    } finally {
      setWithdrawLoading(false)
    }
  }

  // 获取提现状态显示
  function getWithdrawStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">待处理</Badge>
      case "approved":
        return <Badge variant="outline" className="text-green-500 border-green-500/30">已完成</Badge>
      case "rejected":
        return <Badge variant="outline" className="text-destructive border-destructive/30">已拒绝</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 获取收款方式显示
  function getPaymentMethodLabel(method: string) {
    return paymentMethods.find(m => m.value === method)?.label || method
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  // 登录页面
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">推广员登录</CardTitle>
            <CardDescription>登录查看您的推广数据和佣金</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  邮箱地址
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  密码
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                登录
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-accent flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 推广员面板
  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-accent" />
            <div>
              <h1 className="font-semibold text-foreground">{user?.username}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">本月订单</p>
                  <p className="text-2xl font-bold">{stats?.month_usage || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">本月佣金</p>
                  <p className="text-2xl font-bold">¥{stats?.month_commission?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">累计佣金</p>
                  <p className="text-2xl font-bold">¥{user?.total_earnings?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-accent/50 transition-colors" onClick={() => setWithdrawDialogOpen(true)}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">可提现余额</p>
                  <p className="text-2xl font-bold">¥{user?.available_balance?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

{/* 推广链接卡片 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              我的推广链接
            </CardTitle>
            <CardDescription>分享您的专属链接，用户点击后购买将自动应用优惠，您获得佣金</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 推广链接 */}
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">专属推广链接（推荐分享）</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded-lg truncate">
                  {typeof window !== "undefined" ? `${window.location.origin}/ref/${user?.referral_code?.toLowerCase()}` : `/ref/${user?.referral_code?.toLowerCase()}`}
                </code>
                <Button 
                  onClick={() => copyCode(`${window.location.origin}/ref/${user?.referral_code?.toLowerCase()}`)} 
                  variant="default"
                  size="sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                用户点击此链接后，购买时将自动享受优惠，无需手动输入优惠码
              </p>
            </div>
            
            {/* 推广码 */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">推广码</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-mono font-bold text-foreground">{user?.referral_code}</p>
                <Button onClick={() => copyCode(user?.referral_code || "")} variant="ghost" size="sm">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground">当前佣金比例</span>
              <span className="text-accent font-medium">{user?.commission_rate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* 标签页 */}
        <Tabs defaultValue="coupons">
          <TabsList className="mb-4">
            <TabsTrigger value="coupons">我的优惠码 ({coupons.length})</TabsTrigger>
            <TabsTrigger value="records">使用记录 ({usageRecords.length})</TabsTrigger>
            <TabsTrigger value="withdrawals">提现记录 ({withdrawals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="coupons">
            <Card>
              <CardContent className="pt-6">
                {coupons.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">暂无专属优惠码</p>
                ) : (
                  <div className="space-y-3">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="font-mono font-medium text-foreground">{coupon.code}</div>
                          <Badge variant={coupon.status === "active" ? "default" : "secondary"}>
                            {coupon.status === "active" ? "生效中" : "已停用"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-accent">
                            {coupon.discount_type === "fixed" ? `立减 ¥${coupon.discount_value}` : `${coupon.discount_value}% 折扣`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            已使用 {coupon.used_count} 次{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records">
            <Card>
              <CardContent className="pt-6">
                {usageRecords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">暂无使用记录</p>
                ) : (
                  <div className="space-y-3">
                    {usageRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm">{record.coupon_code}</span>
                            <span className="text-muted-foreground">-</span>
                            <span className="text-sm text-muted-foreground">{record.order_no}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(record.used_at).toLocaleString("zh-CN")}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">订单: ¥{record.order_amount.toFixed(2)}</p>
                          <p className="text-sm font-medium text-green-500">+¥{record.commission_amount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">提现记录</CardTitle>
                  <Button onClick={() => setWithdrawDialogOpen(true)}>
                    <Wallet className="w-4 h-4 mr-2" />
                    申请提现
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">暂无提现记录</p>
                ) : (
                  <div className="space-y-3">
                    {withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">¥{withdrawal.amount.toFixed(2)}</span>
                            {getWithdrawStatusBadge(withdrawal.status)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CreditCard className="w-3 h-3" />
                            {getPaymentMethodLabel(withdrawal.payment_method)} - {withdrawal.payment_account}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(withdrawal.created_at).toLocaleString("zh-CN")}
                          </div>
                        </div>
                        {withdrawal.admin_note && (
                          <div className="text-right text-sm text-muted-foreground max-w-[200px]">
                            {withdrawal.admin_note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* 提现对话框 */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              申请提现
            </DialogTitle>
            <DialogDescription>
              当前可提现余额: <span className="text-accent font-medium">¥{user?.available_balance?.toFixed(2) || "0.00"}</span>
            </DialogDescription>
          </DialogHeader>

          {withdrawError && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {withdrawError}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">提现金额</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="输入提现金额"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
              />
              <Button
                type="button"
                variant="link"
                className="w-fit p-0 h-auto text-xs"
                onClick={() => setWithdrawForm({ ...withdrawForm, amount: String(user?.available_balance || 0) })}
              >
                全部提现
              </Button>
            </div>

            <div className="grid gap-2">
              <Label>收款方式</Label>
              <Select
                value={withdrawForm.payment_method}
                onValueChange={(v) => setWithdrawForm({ ...withdrawForm, payment_method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment_account">
                收款账号
                {withdrawForm.payment_method === "alipay" && " (支付宝账号)"}
                {withdrawForm.payment_method === "wechat" && " (微信号)"}
                {withdrawForm.payment_method === "bank" && " (银行卡号+开户行)"}
              </Label>
              <Input
                id="payment_account"
                placeholder={
                  withdrawForm.payment_method === "alipay" ? "手机号或邮箱" :
                  withdrawForm.payment_method === "wechat" ? "微信号" :
                  "卡号 + 开户行名称"
                }
                value={withdrawForm.payment_account}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, payment_account: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleWithdraw} disabled={withdrawLoading}>
              {withdrawLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
