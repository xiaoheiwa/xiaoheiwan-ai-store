"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { RefreshCw, CheckCircle, Clock, AlertCircle, Home, Copy, ArrowRight, Sparkles } from "lucide-react"
import { getActivationRoute, getAllActivationRoutes } from "@/lib/activation-routes"

interface Order {
  orderNo: string
  email: string
  amount: number
  status: string
  activationCode?: string
  createdAt: string
  payType: string
  requirePassword?: boolean
  productName?: string
  productId?: string
  paid_at?: string
}

export default function OrderPage() {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle")
  const [queryPassword, setQueryPassword] = useState("")
  const [needPassword, setNeedPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [verifying, setVerifying] = useState(false)
  const params = useParams()
  const orderNo = params.orderNo as string

  useEffect(() => {
    if (orderNo) {
      const savedPwd = sessionStorage.getItem("orderQueryPwd") || ""
      if (savedPwd) setQueryPassword(savedPwd)
      fetchOrder(savedPwd || undefined)
    }
  }, [orderNo])

  const fetchOrder = async (pwd?: string) => {
    try {
      const params = new URLSearchParams()
      if (pwd) params.set("pwd", pwd)
      const response = await fetch(`/api/order/${orderNo}?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        if (data.requirePassword) {
          setNeedPassword(true)
          setOrder(data)
        } else {
          setNeedPassword(false)
          setOrder(data)
        }
      } else if (response.status === 403) {
        const data = await response.json()
        setPasswordError(data.error || "查询密码错误")
        setNeedPassword(true)
      } else {
        setError("订单不存在")
      }
    } catch {
      setError("获取订单失败")
    } finally {
      setLoading(false)
      setVerifying(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryPassword.trim()) { setPasswordError("请输入查询密码"); return }
    setPasswordError("")
    setVerifying(true)
    setLoading(true)
    fetchOrder(queryPassword)
  }

  const refreshOrder = () => { setLoading(true); fetchOrder(needPassword ? undefined : queryPassword || undefined) }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState("copied")
      setTimeout(() => setCopyState("idle"), 3000)
    } catch { /* noop */ }
  }

  const isPaid = order?.status === "paid" || order?.status === "PAID"
  const activationRoute = getActivationRoute(order?.productName)
  const allRoutes = getAllActivationRoutes()

  const getActivationHref = (basePath: string) => {
    if (order?.activationCode) return `${basePath}?code=${encodeURIComponent(order.activationCode)}`
    return basePath
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">{"正在查询订单..."}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-background dark noise-overlay">
        <div className="fixed inset-0 bg-grid-subtle opacity-40" />
        <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
        <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="glass-card card-shadow rounded-2xl p-8 text-center max-w-md w-full">
            <AlertCircle className="w-12 h-12 text-destructive/60 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">{error || "订单未找到"}</h1>
            <p className="text-sm text-muted-foreground mb-6">{"请检查订单号是否正确"}</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/90 transition-all">
              <Home className="w-4 h-4" />
              {"返回首页"}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Password gate
  if (needPassword) {
    return (
      <div className="min-h-screen bg-background dark noise-overlay">
        <div className="fixed inset-0 bg-grid-subtle opacity-40" />
        <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
        <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="relative z-10 max-w-md mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{"验证查询密码"}</h1>
            <p className="text-muted-foreground text-sm">{"请输入下单时设置的查询密码"}</p>
          </div>

          <div className="glass-card card-shadow rounded-2xl p-5 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">{"订单号"}</span>
                <p className="text-foreground font-mono text-xs mt-0.5 break-all">{order.orderNo}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">{"邮箱"}</span>
                <p className="text-foreground text-xs mt-0.5">{order.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">{"金额"}</span>
                <p className="text-foreground font-semibold mt-0.5">{"\u00a5"}{order.amount}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">{"状态"}</span>
                <p className={`text-xs mt-0.5 font-medium ${isPaid ? "text-accent" : "text-yellow-500"}`}>
                  {isPaid ? "已支付" : "待支付"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={queryPassword}
              onChange={(e) => { setQueryPassword(e.target.value); setPasswordError("") }}
              placeholder="输入查询密码"
              className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:border-accent focus:ring-2 focus:ring-accent/20 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm outline-none"
              autoFocus
            />
            {passwordError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                <p className="text-destructive text-xs">{passwordError}</p>
              </div>
            )}
            <button type="submit" disabled={verifying || !queryPassword.trim()} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 px-4 rounded-xl disabled:opacity-50 transition-all font-semibold text-sm flex items-center justify-center gap-2">
              {verifying ? <><RefreshCw className="w-4 h-4 animate-spin" />{"验证中..."}</> : "验证并查看订单"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/order-lookup" className="text-muted-foreground hover:text-foreground text-xs transition-colors">{"返回订单查询"}</Link>
          </div>
        </div>
      </div>
    )
  }

  // Main order view
  return (
    <div className="min-h-screen bg-background dark noise-overlay">
      <div className="fixed inset-0 bg-grid-subtle opacity-40" />
      <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors animated-underline">
            <Home className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {"返回首页"}
          </Link>
          <button onClick={refreshOrder} disabled={loading} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition-all hover:bg-muted/50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {"刷新"}
          </button>
        </div>

        {/* Status Header */}
        <div className="text-center mb-8 animate-fade-up">
          <div className={`w-14 h-14 mx-auto mb-4 rounded-full border flex items-center justify-center ${isPaid ? "bg-accent/10 border-accent/30" : "bg-yellow-500/10 border-yellow-500/20"}`}>
            {isPaid ? <CheckCircle className="w-7 h-7 text-accent" /> : <Clock className="w-7 h-7 text-yellow-500" />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{"订单详情"}</h1>
          <p className="text-muted-foreground text-sm font-mono">{order.orderNo}</p>
        </div>

        {/* Order Info Grid */}
        <div className="glass-card card-shadow rounded-2xl p-6 sm:p-8 mb-6 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-6">
            {[
              { label: "邮箱", value: order.email, full: true },
              { label: "金额", value: `\u00a5${order.amount}`, bold: true },
              { label: "支付方式", value: "支付宝" },
              { label: "状态", badge: true },
              { label: "创建时间", value: new Date(order.createdAt).toLocaleString("zh-CN"), full: true },
              ...(order.productName ? [{ label: "产品", value: order.productName }] : []),
              ...(order.paid_at ? [{ label: "支付时间", value: new Date(order.paid_at).toLocaleString("zh-CN") }] : []),
            ].map((item, i) => (
              <div key={i} className={item.full ? "col-span-2" : ""}>
                <span className="text-muted-foreground text-xs">{item.label}</span>
                {item.badge ? (
                  <p className={`text-sm font-medium mt-0.5 ${isPaid ? "text-accent" : "text-yellow-500"}`}>
                    {isPaid ? "已支付" : "待支付"}
                  </p>
                ) : (
                  <p className={`text-sm mt-0.5 break-all ${item.bold ? "font-bold text-foreground text-lg" : "text-foreground"}`}>
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Activation Code */}
        {order.activationCode && (
          <div className="glass-card card-shadow rounded-2xl p-6 sm:p-8 mb-6 border-accent/20 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
            <h2 className="flex items-center gap-2 font-semibold text-foreground mb-4 text-sm">
              <Sparkles className="w-4 h-4 text-accent" />
              {"激活码"}
            </h2>
            <div className="bg-background/80 rounded-xl p-5 sm:p-6 border border-accent/20 mb-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-xl sm:text-2xl text-accent tracking-wider break-all">{order.activationCode}</span>
                <button
                  onClick={() => copyToClipboard(order.activationCode!)}
                  className="p-2.5 hover:bg-muted rounded-lg transition-all border border-border hover:border-accent/30 shrink-0 active:scale-95"
                >
                  <Copy className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>
            {copyState === "copied" && (
              <p className="text-xs text-accent text-center mb-3 animate-fade-up">{"已复制到剪贴板"}</p>
            )}
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-accent" />
              {"激活码已发送到您的邮箱，请妥善保管"}
            </p>
          </div>
        )}

        {/* Activation Guide */}
        {isPaid && order.activationCode && (
          <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-5 sm:p-6 mb-6 animate-fade-up" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowRight className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{"下一步：前往激活"}</h3>
                <p className="text-xs text-muted-foreground">{"选择对应的激活页面，输入激活码完成开通"}</p>
              </div>
            </div>
            {activationRoute ? (
              <Link
                href={getActivationHref(activationRoute.href)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: activationRoute.color, color: "#fff" }}
              >
                <Sparkles className="w-4 h-4" />
                {activationRoute.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {allRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={getActivationHref(route.href)}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border hover:border-accent/30 hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: route.color }} />
                      <span className="text-sm font-medium text-foreground">{route.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="glass-card rounded-xl p-5 mb-6 animate-fade-up" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
          <h3 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent" />
            {"温馨提示"}
          </h3>
          <ul className="text-muted-foreground text-sm space-y-2">
            {["支付完成后激活码将自动发送到您的邮箱", "请妥善保管您的激活码和查询密码", "如有问题请通过邮箱或在线客服联系我们"].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 animate-fade-up" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
          <Link href="/" className="flex-1 inline-flex items-center justify-center gap-2 text-foreground py-3 px-4 rounded-xl text-sm font-medium border border-border hover:bg-muted/50 transition-all">
            <Home className="w-4 h-4" />
            {"返回首页"}
          </Link>
          {!isPaid && (
            <button onClick={refreshOrder} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3 px-4 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-all disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {"检查支付状态"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
