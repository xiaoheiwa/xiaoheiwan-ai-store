"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Package, Clock, CheckCircle, XCircle, RefreshCw, ArrowLeft, Copy, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getActivationRoute, getAllActivationRoutes } from "@/lib/activation-routes"

interface Order {
  orderNo: string
  email: string
  amount: number
  status: string
  activationCode?: string
  createdAt: string
  payType: string
  paidAt?: string
  fulfilledAt?: string
  productName?: string
  requirePassword?: boolean
}

export default function OrderLookupPage() {
  const [orderNo, setOrderNo] = useState("")
  const [email, setEmail] = useState("")
  const [queryPassword, setQueryPassword] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [needPassword, setNeedPassword] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle")

  useEffect(() => {
    const pendingOrderStr = localStorage.getItem("pendingOrder")
    if (pendingOrderStr) {
      try {
        const pendingOrder = JSON.parse(pendingOrderStr)
        const orderAge = Date.now() - pendingOrder.timestamp
        if (orderAge < 30 * 60 * 1000 && pendingOrder.orderNo) {
          setOrderNo(pendingOrder.orderNo)
          if (pendingOrder.email) setEmail(pendingOrder.email)
          setMessage({ text: "检测到待查询订单，已自动填入订单号", type: "success" })
        }
      } catch (e) {
        console.error("Error parsing pending order:", e)
      }
    }
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNo.trim()) { setError("请输入订单号"); return }

    setLoading(true)
    setError("")
    setOrder(null)
    setMessage(null)
    setNeedPassword(false)

    try {
      const params = new URLSearchParams()
      if (queryPassword) params.set("pwd", queryPassword)
      const response = await fetch(`/api/order/${orderNo.trim()}?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()
        if (data.requirePassword) {
          setNeedPassword(true)
          setOrder(data)
          return
        }
        if (email.trim() && data.email !== email.trim()) {
          setError("订单号与邮箱不匹配")
          return
        }
        setNeedPassword(false)
        setOrder(data)
        if (data.status === "paid") {
          localStorage.removeItem("pendingOrder")
          sessionStorage.removeItem("pendingOrderNo")
        }
      } else if (response.status === 403) {
        const data = await response.json()
        setError(data.error || "查询密码错误")
        setNeedPassword(true)
      } else if (response.status === 404) {
        setError("订单不存在，请检查订单号是否正确")
      } else {
        setError("查询失败，请稍后重试")
      }
    } catch (err) {
      console.error("Network error:", err)
      setError("网络错误，请检查网络连接")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState("copied")
      setTimeout(() => setCopyState("idle"), 3000)
    } catch { /* noop */ }
  }

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID": return "已支付"
      case "PENDING": return "待支付"
      case "FAILED": return "支付失败"
      default: return "未知状态"
    }
  }

  const isPaid = order?.status?.toUpperCase() === "PAID"
  const activationRoute = order?.productName ? getActivationRoute(order.productName) : null
  const allRoutes = getAllActivationRoutes()

  const getActivationHref = (basePath: string) => {
    if (order?.activationCode) return `${basePath}?code=${encodeURIComponent(order.activationCode)}`
    return basePath
  }

  return (
    <div className="min-h-screen bg-background dark noise-overlay">
      <div className="fixed inset-0 bg-grid-subtle opacity-40" />
      <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Back */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 animated-underline"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{"返回首页"}</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 animate-fade-up">
          <div className="badge badge-animate mb-5 inline-flex">
            <Search className="w-3.5 h-3.5" />
            <span>{"订单查询"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight text-balance">
            {"查询您的订单"}
          </h1>
          <p className="text-sm text-muted-foreground">{"输入订单号查看订单状态和激活码信息"}</p>
        </div>

        {/* Search Form */}
        <div className="glass-card card-shadow rounded-2xl p-5 sm:p-8 mb-6 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
          <form onSubmit={handleSearch} className="space-y-5">
            <div>
              <label htmlFor="orderNo" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2.5">
                <Package className="w-4 h-4 text-accent" />
                {"订单号"}
              </label>
              <input
                type="text"
                id="orderNo"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="请输入订单号"
                className="w-full px-4 py-3.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="queryPassword" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                {"查询密码"}
              </label>
              <input
                type="password"
                id="queryPassword"
                value={queryPassword}
                onChange={(e) => setQueryPassword(e.target.value)}
                placeholder="输入下单时设置的查询密码"
                className="w-full px-4 py-3.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm"
                required
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-accent" />
                {"查看激活码等敏感信息需要验证查询密码"}
              </p>
            </div>

            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {"邮箱地址"}
                <span className="text-xs text-muted-foreground/60 font-normal">{"（可选）"}</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="用于验证订单归属"
                className="w-full px-4 py-3.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-accent/10 border-accent/20 text-accent" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-muted disabled:cursor-not-allowed text-accent-foreground py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] flex items-center justify-center gap-2 ripple"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{"查询中..."}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{"查询订单"}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Result */}
        {order && (
          <div className="glass-card card-shadow rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
            {/* Result header */}
            <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">{"订单详情"}</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                isPaid ? "bg-accent/10 text-accent border-accent/20" : order.status.toUpperCase() === "PENDING" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
              }`}>
                {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : order.status.toUpperCase() === "PENDING" ? <Clock className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {getStatusText(order.status)}
              </span>
            </div>

            <div className="px-5 sm:px-8 py-6">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground">{"订单号"}</span>
                  <p className="text-sm text-foreground font-mono mt-0.5 break-all">{order.orderNo}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{"邮箱"}</span>
                  <p className="text-sm text-foreground mt-0.5 break-all">{order.email}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{"金额"}</span>
                  <p className="text-lg font-bold text-foreground mt-0.5">{"\u00a5"}{order.amount}</p>
                </div>
                {order.productName && (
                  <div>
                    <span className="text-xs text-muted-foreground">{"产品"}</span>
                    <p className="text-sm text-foreground mt-0.5">{order.productName}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground">{"创建时间"}</span>
                  <p className="text-sm text-foreground mt-0.5">{new Date(order.createdAt).toLocaleString("zh-CN")}</p>
                </div>
              </div>

              {/* Password gate */}
              {needPassword && (
                <div className="rounded-xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <p className="text-sm font-semibold text-amber-500 mb-1">{"需要查询密码"}</p>
                  <p className="text-xs text-muted-foreground">{"请在上方表单输入查询密码后重新查询"}</p>
                </div>
              )}

              {/* Activation code */}
              {!needPassword && order.activationCode && (
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 mb-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                    <Sparkles className="w-4 h-4 text-accent" />
                    {"激活码"}
                  </h3>
                  <div className="bg-background/80 border border-accent/20 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-lg text-accent tracking-wider break-all">{order.activationCode}</span>
                      <button
                        onClick={() => copyToClipboard(order.activationCode!)}
                        className="p-2.5 hover:bg-muted rounded-lg transition-all border border-border hover:border-accent/30 shrink-0 active:scale-95"
                      >
                        <Copy className="w-4 h-4 text-foreground" />
                      </button>
                    </div>
                  </div>
                  {copyState === "copied" && (
                    <p className="text-xs text-accent text-center mb-2 animate-fade-up">{"已复制到剪贴板"}</p>
                  )}
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-accent" />
                    {"激活码已发送到您的邮箱"}
                  </p>
                </div>
              )}

              {/* Activation CTA */}
              {!needPassword && isPaid && order.activationCode && (
                <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-4 mb-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <ArrowRight className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-0.5">{"前往激活"}</h3>
                      <p className="text-xs text-muted-foreground">{"选择对应的激活页面完成开通"}</p>
                    </div>
                  </div>
                  {activationRoute ? (
                    <Link
                      href={getActivationHref(activationRoute.href)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
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
                          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-border hover:border-accent/30 hover:bg-muted/50 transition-all group"
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
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 sm:px-8 pb-6">
              <Link href={`/order/${order.orderNo}`} className="flex-1 bg-accent text-accent-foreground py-3 px-4 rounded-xl text-center text-sm font-semibold hover:bg-accent/90 transition-all">
                {"查看详细页面"}
              </Link>
              <Link href="/" className="flex-1 text-foreground py-3 px-4 rounded-xl text-center text-sm font-medium border border-border hover:bg-muted/50 transition-all">
                {"返回首页"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
