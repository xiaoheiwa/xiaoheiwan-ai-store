"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, Mail, Lock, LogOut, TrendingUp, DollarSign, ShoppingCart, 
  Ticket, Copy, Check, Calendar, Loader2, ArrowLeft
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

interface Stats {
  total_usage: number
  total_order_amount: number
  total_commission: number
  month_usage: number
  month_order_amount: number
  month_commission: number
}

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
  const [stats, setStats] = useState<Stats | null>(null)

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem("referrer_token")
    if (token) {
      loadData(token)
    } else {
      setLoading(false)
    }
  }, [])

  // 加载数据
  async function loadData(token: string) {
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
      } else {
        localStorage.removeItem("referrer_token")
        setIsLoggedIn(false)
      }
    } catch {
      localStorage.removeItem("referrer_token")
    } finally {
      setLoading(false)
    }
  }

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
    setStats(null)
  }

  // 复制推广码
  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            退出
          </Button>
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
                  <p className="text-2xl font-bold">¥{stats?.total_commission?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">可提现余额</p>
                  <p className="text-2xl font-bold">¥{user?.available_balance?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 推广码卡片 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              我的推广码
            </CardTitle>
            <CardDescription>分享您的推广码，用户使用后您将获得佣金</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">您的推广码</p>
                <p className="text-2xl font-mono font-bold text-accent">{user?.referral_code}</p>
              </div>
              <Button onClick={() => copyCode(user?.referral_code || "")} variant="outline">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              当前佣金比例: <span className="text-accent font-medium">{user?.commission_rate}%</span>
            </p>
          </CardContent>
        </Card>

        {/* 标签页 */}
        <Tabs defaultValue="coupons">
          <TabsList className="mb-4">
            <TabsTrigger value="coupons">我的优惠码 ({coupons.length})</TabsTrigger>
            <TabsTrigger value="records">使用记录 ({usageRecords.length})</TabsTrigger>
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
                            <span className="text-muted-foreground">•</span>
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
        </Tabs>
      </main>
    </div>
  )
}
