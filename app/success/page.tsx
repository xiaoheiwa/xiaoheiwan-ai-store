"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Clock, Copy, ArrowLeft, ArrowRight, Mail, Loader2, Sparkles } from "lucide-react"
import { getActivationRoute, getAllActivationRoutes } from "@/lib/activation-routes"

interface Order {
  orderNo: string
  email: string
  amount: number
  status: string
  activationCode?: string
  createdAt: string
  paid_at?: string
  fulfilled_at?: string
  productName?: string
  productId?: string
}

function SuccessContent() {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle")
  const [pollingCount, setPollingCount] = useState(0)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [recoveredOrderNo, setRecoveredOrderNo] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const recoverOrderNo = (): string | null => {
      const urlOrderNo =
        searchParams.get("orderNo") ||
        searchParams.get("out_trade_no") ||
        searchParams.get("order_no") ||
        searchParams.get("trade_no")
      if (urlOrderNo) return urlOrderNo

      const sessionOrderNo = sessionStorage.getItem("pendingOrderNo")
      if (sessionOrderNo) return sessionOrderNo

      const pendingOrderStr = localStorage.getItem("pendingOrder")
      if (pendingOrderStr) {
        try {
          const pendingOrder = JSON.parse(pendingOrderStr)
          const orderAge = Date.now() - pendingOrder.timestamp
          if (orderAge < 30 * 60 * 1000 && pendingOrder.orderNo) {
            return pendingOrder.orderNo
          }
        } catch (e) {
          console.error("Error parsing pending order:", e)
        }
      }
      return null
    }

    const orderNo = recoverOrderNo()
    setRecoveredOrderNo(orderNo)

    if (orderNo) {
      const urlHasOrderNo = searchParams.get("orderNo") || searchParams.get("out_trade_no")
      if (!urlHasOrderNo) {
        window.history.replaceState({}, "", `/success?orderNo=${orderNo}`)
      }
      fetchOrder(orderNo)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    if (order && order.status === "pending" && pollingCount < 60 && recoveredOrderNo) {
      const delay = pollingCount < 10 ? 2000 : pollingCount < 30 ? 5000 : 10000
      const timer = setTimeout(() => {
        fetchOrder(recoveredOrderNo)
        setPollingCount((prev) => prev + 1)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [order, recoveredOrderNo, pollingCount])

  const fetchOrder = async (orderNo: string) => {
    try {
      const savedPwd = sessionStorage.getItem("orderQueryPwd") || ""
      const params = new URLSearchParams({ t: String(Date.now()), r: String(Math.random()) })
      if (savedPwd) params.set("pwd", savedPwd)

      const response = await fetch(`/api/order/${orderNo}?${params.toString()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache", Expires: "0" },
      })

      if (response.ok) {
        const data = await response.json()
        setOrder(data)
        if (data.status === "paid") {
          setPollingCount(60)
          localStorage.removeItem("pendingOrder")
          sessionStorage.removeItem("pendingOrderNo")
          if (data.activationCode) sessionStorage.removeItem("orderQueryPwd")
        }
      } else if (response.status === 403) {
        // Password required - stop polling and show order link
        setPollingCount(60)
        setOrder({ orderNo, email: "", amount: 0, status: "unknown", createdAt: "" })
      }
    } catch (error) {
      console.error("Error fetching order:", error)
    } finally {
      setLoading(false)
      setIsManualRefreshing(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState("copied")
      setTimeout(() => setCopyState("idle"), 3000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleManualRefresh = () => {
    if (!isManualRefreshing && recoveredOrderNo) {
      setIsManualRefreshing(true)
      fetchOrder(recoveredOrderNo)
    }
  }

  const isPaid = order?.status === "paid"
  const activationRoute = getActivationRoute(order?.productName)
  const allRoutes = getAllActivationRoutes()

  // Build activation link with prefilled code
  const getActivationHref = (basePath: string) => {
    if (order?.activationCode) {
      return `${basePath}?code=${encodeURIComponent(order.activationCode)}`
    }
    return basePath
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">{"正在查询订单状态..."}</p>
        </div>
      </div>
    )
  }

  if (!recoveredOrderNo) {
    return (
      <div className="min-h-screen bg-background dark noise-overlay">
        <div className="fixed inset-0 bg-grid-subtle opacity-40" />
        <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
        <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-4">{"订单号缺失"}</h1>
            <p className="text-muted-foreground mb-6">{"无法查询订单状态，请通过订单查询页面查找您的订单"}</p>
            <div className="flex flex-col gap-3">
              <Link href="/order-lookup" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 transition-all">
                {"查询订单"}
              </Link>
              <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-foreground font-medium border border-border rounded-xl hover:bg-muted/50 transition-all">
                <ArrowLeft className="w-4 h-4" />
                {"返回首页"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark noise-overlay">
      <div className="fixed inset-0 bg-grid-subtle opacity-40" />
      <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <Link href="/" className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 animated-underline">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {"返回首页"}
        </Link>

        {/* Status Card */}
        <div className="glass-card card-shadow rounded-2xl p-6 sm:p-8 mb-6 animate-fade-up">
          <div className="text-center mb-8">
            {isPaid ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full border border-accent/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{"支付成功"}</h1>
                <p className="text-muted-foreground text-sm">{"激活码已发送到您的邮箱"}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/10 rounded-full border border-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{"等待支付"}</h1>
                <p className="text-muted-foreground text-sm">
                  {pollingCount > 0 && pollingCount < 60
                    ? `正在验证支付状态... (${pollingCount}/60)`
                    : "请完成支付流程"}
                </p>
                {pollingCount >= 60 && order?.status !== "unknown" && (
                  <button onClick={handleManualRefresh} disabled={isManualRefreshing} className="mt-4 px-6 py-2 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-all">
                    {isManualRefreshing ? "刷新中..." : "手动刷新"}
                  </button>
                )}
                {order?.status === "unknown" && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-3">{"订单需要密码验证"}</p>
                    <Link href={`/order/${recoveredOrderNo}`} className="px-6 py-2 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 transition-all inline-block">
                      {"前往查看订单"}
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border mb-6">
            <h2 className="font-semibold text-foreground mb-3 text-sm">{"订单详情"}</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{"订单号"}</span>
                <span className="text-foreground font-mono text-xs">{order?.orderNo || recoveredOrderNo}</span>
              </div>
              {order?.email && (
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">{"邮箱"}</span>
                  <span className="text-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{order.email}</span>
                </div>
              )}
              {order?.productName && (
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">{"产品"}</span>
                  <span className="text-foreground">{order.productName}</span>
                </div>
              )}
              {order?.amount && (
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">{"金额"}</span>
                  <span className="font-bold text-foreground">{"\u00a5"}{order.amount}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground">{"状态"}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isPaid ? "bg-accent/10 text-accent" : "bg-yellow-500/10 text-yellow-500"}`}>
                  {isPaid ? "已支付" : "待支付"}
                </span>
              </div>
            </div>
          </div>

          {/* Activation Code / Delivery Info */}
          {isPaid && order?.activationCode && (
            <div className="bg-muted/30 rounded-xl p-4 border border-accent/20 mb-6">
              <h2 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                {order.activationCode.includes("\n") ? "激活码列表" : "激活码"}
              </h2>
              <div className="bg-background/80 border border-accent/20 rounded-xl p-4 mb-3">
                {order.activationCode.includes("\n") ? (
                  <div className="space-y-2">
                    {order.activationCode.split("\n").filter(Boolean).map((code, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 py-1 border-b border-border/50 last:border-0">
                        <span className="font-mono text-sm text-accent tracking-wider break-all">{code}</span>
                        <button
                          onClick={() => copyToClipboard(code)}
                          className="p-1.5 hover:bg-muted rounded transition-all shrink-0"
                          title="复制"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => copyToClipboard(order.activationCode!)}
                      className="w-full py-2 text-xs text-accent hover:text-accent/80 transition-colors"
                    >
                      {"复制全部"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-lg text-accent tracking-wider break-all">{order.activationCode}</span>
                    <button
                      onClick={() => copyToClipboard(order.activationCode!)}
                      className="p-2.5 hover:bg-muted rounded-lg transition-all border border-border hover:border-accent/30 shrink-0 active:scale-95"
                      title="复制激活码"
                    >
                      <Copy className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                )}
              </div>
              {copyState === "copied" && (
                <p className="text-xs text-accent text-center mb-2 animate-fade-up">{"已复制到剪贴板"}</p>
              )}
              <p className="text-xs text-muted-foreground text-center">{"请妥善保管您的激活码，切勿泄露给他人"}</p>
            </div>
          )}

          {/* Waiting for manual fulfillment */}
          {isPaid && !order?.activationCode && !order?.fulfilled_at && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800 mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                <div>
                  <h2 className="font-semibold text-foreground text-sm">{"等待发货"}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{"支付成功，客服正在为您处理订单，请留意邮箱通知"}</p>
                </div>
              </div>
            </div>
          )}

          {/* P0: Activation CTA */}
          {isPaid && order?.activationCode && (
            <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-5 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowRight className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{"下一步：前往激活"}</h3>
                  <p className="text-xs text-muted-foreground">{"激活码已复制？请前往对应的激活页面完成会员开通"}</p>
                </div>
              </div>

              {activationRoute ? (
                /* Direct match - show single prominent CTA */
                <Link
                  href={getActivationHref(activationRoute.href)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: activationRoute.color, color: "#fff" }}
                >
                  <Sparkles className="w-4 h-4" />
                  {activationRoute.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                /* No match - show all activation options */
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

          {/* Bottom Actions */}
          <div className="flex gap-3">
            <Link href={`/order/${order?.orderNo || recoveredOrderNo}`} className="flex-1 bg-accent text-accent-foreground py-3 px-4 rounded-xl text-center text-sm font-semibold hover:bg-accent/90 transition-all">
              {"查看订单"}
            </Link>
            <Link href="/" className="flex-1 text-foreground py-3 px-4 rounded-xl text-center text-sm font-medium border border-border hover:bg-muted/50 transition-all">
              {"返回首页"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
