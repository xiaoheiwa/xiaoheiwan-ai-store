"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, CheckCircle, Users, DollarSign, TrendingUp, Gift } from "lucide-react"
import Link from "next/link"

export default function BecomePromoterPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    reason: "",
    promotion_channels: "",
    expected_monthly_orders: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!form.username.trim()) {
      setError("请填写您的名称")
      return
    }
    if (!form.email.trim()) {
      setError("请填写邮箱地址")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("请输入有效的邮箱地址")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/promoter/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expected_monthly_orders: form.expected_monthly_orders ? parseInt(form.expected_monthly_orders) : null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
      } else {
        setError(data.error || "提交失败，请重试")
      }
    } catch {
      setError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">申请已提交</h2>
            <p className="text-muted-foreground mb-6">
              我们已收到您的推广员申请，审核结果将在 1-3 个工作日内通过邮件通知您。
            </p>
            <Link href="/">
              <Button>返回首页</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">申请成为推广员</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
            <CardContent className="pt-6">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">高额佣金</h3>
              <p className="text-sm text-muted-foreground">每笔订单最高可获得 15% 佣金</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
            <CardContent className="pt-6">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3">
                <Gift className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">专属优惠码</h3>
              <p className="text-sm text-muted-foreground">获得专属推广码和推广链接</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
            <CardContent className="pt-6">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">实时追踪</h3>
              <p className="text-sm text-muted-foreground">实时查看订单和佣金数据</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
            <CardContent className="pt-6">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">快速提现</h3>
              <p className="text-sm text-muted-foreground">支持支付宝、微信、银行卡提现</p>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>填写申请信息</CardTitle>
            <CardDescription>请认真填写以下信息，我们将在 1-3 个工作日内审核您的申请</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">您的名称 *</Label>
                  <Input
                    id="username"
                    placeholder="如何称呼您"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址 *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="用于接收审核结果和登录"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">联系电话（选填）</Label>
                  <Input
                    id="phone"
                    placeholder="方便我们联系您"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_monthly_orders">预计月推广订单数（选填）</Label>
                  <Input
                    id="expected_monthly_orders"
                    type="number"
                    placeholder="预估每月能带来多少订单"
                    value={form.expected_monthly_orders}
                    onChange={(e) => setForm({ ...form, expected_monthly_orders: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion_channels">推广渠道（选填）</Label>
                <Textarea
                  id="promotion_channels"
                  placeholder="您打算通过什么渠道推广？如：微信群、QQ群、小红书、抖音、B站、博客等"
                  rows={3}
                  value={form.promotion_channels}
                  onChange={(e) => setForm({ ...form, promotion_channels: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">申请理由（选填）</Label>
                <Textarea
                  id="reason"
                  placeholder="简单介绍一下您自己，以及为什么想成为推广员"
                  rows={4}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">申请须知：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>审核通过后，您将收到邮件通知，包含登录密码</li>
                  <li>推广员初始佣金比例为 10%，可根据业绩调整</li>
                  <li>佣金满 50 元即可申请提现</li>
                  <li>禁止使用虚假信息或恶意刷单，一经发现将永久封禁</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  "提交申请"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
