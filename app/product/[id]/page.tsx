"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ShoppingCart, CheckCircle, Package, Loader2, AlertCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getActivationRoute } from "@/lib/activation-routes"

interface PriceTier {
  min_qty: number
  price: number
}

interface Product {
  id: string
  name: string
  description: string
  details: string | null
  price: number
  original_price: number | null
  sku: string
  stock_count: number
  delivery_type: "auto" | "manual"
  price_tiers: PriceTier[] | null
}

function getUnitPrice(product: Product, qty: number): number {
  if (!product.price_tiers || product.price_tiers.length === 0) return product.price
  const sorted = [...product.price_tiers].sort((a, b) => b.min_qty - a.min_qty)
  for (const tier of sorted) {
    if (qty >= tier.min_qty) return tier.price
  }
  return product.price
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (!productId) return
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`)
        if (response.ok) {
          const data = await response.json()
          setProduct(data)
        } else {
          setError("not_found")
        }
      } catch (err) {
        setError("fetch_error")
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark noise-overlay">
        <div className="fixed inset-0 bg-grid-subtle opacity-40" />
        <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
        <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background dark noise-overlay">
        <div className="fixed inset-0 bg-grid-subtle opacity-40" />
        <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
        <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <div className="glass-card rounded-2xl p-8 text-center max-w-md w-full">
            <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">{"产品未找到"}</h2>
            <p className="text-sm text-muted-foreground mb-6">{"该产品可能已下架或不存在"}</p>
            <Link href="/">
              <Button variant="outline" className="rounded-xl bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {"返回首页"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isManual = product.delivery_type === "manual"
  const inStock = isManual ? true : Number(product.stock_count) > 0
  const maxQty = isManual ? 99 : Math.max(Number(product.stock_count), 0)
  const unitPrice = getUnitPrice(product, quantity)
  const totalPrice = (unitPrice * quantity).toFixed(2)
  const discount = product.original_price
    ? Math.round((1 - unitPrice / product.original_price) * 100)
    : 0

  return (
    <div className="min-h-screen bg-background dark noise-overlay">
      <div className="fixed inset-0 bg-grid-subtle opacity-40" />
      <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-16 overflow-x-hidden">

          {/* Back link */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 sm:mb-8 animated-underline animate-fade-up"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{"返回首页"}</span>
          </Link>

          {/* Product Header */}
          <div className="glass-card card-shadow rounded-2xl p-6 sm:p-8 mb-6 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {product.sku && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border">
                      {product.sku}
                    </span>
                  )}
                  {isManual ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <Package className="w-3 h-3" />
                      {"人工发货"}
                    </span>
                  ) : inStock ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent border border-accent/20">
                      <CheckCircle className="w-3 h-3" />
                      {"自动发货 · 库存 "}{product.stock_count}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
                      {"暂时缺货"}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 text-balance break-words">
                  {product.name}
                </h1>
                {product.description && (
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>
            </div>

            {/* Price & Quantity */}
            <div className="pt-6 border-t border-border space-y-4">
              {/* Tier pricing display */}
              {product.price_tiers && product.price_tiers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {[{ min_qty: 1, price: product.price }, ...product.price_tiers.filter(t => t.min_qty > 1)].sort((a, b) => a.min_qty - b.min_qty).map((tier, i) => (
                    <button
                      key={i}
                      onClick={() => setQuantity(Math.max(tier.min_qty, 1))}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        quantity >= tier.min_qty && (i === product.price_tiers!.length || quantity < ([...product.price_tiers!].sort((a, b) => a.min_qty - b.min_qty)[i]?.min_qty ?? Infinity))
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-accent/50"
                      }`}
                    >
                      {tier.min_qty === 1 ? "单个" : `${tier.min_qty}+ 个`}
                      {" "}{"\u00a5"}{tier.price}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="space-y-2">
                  {/* Quantity selector */}
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground">{"数量"}</p>
                    <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="px-3 py-1.5 text-sm text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-30"
                      >-</button>
                      <input
                        type="number"
                        min={1}
                        max={maxQty}
                        value={quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 1
                          setQuantity(Math.min(Math.max(1, v), maxQty))
                        }}
                        className="w-12 text-center text-sm text-foreground font-medium py-1.5 bg-background border-x border-border focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                        disabled={quantity >= maxQty}
                        className="px-3 py-1.5 text-sm text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-30"
                      >+</button>
                    </div>
                    {!isManual && <span className="text-xs text-muted-foreground">{"库存 "}{product.stock_count}</span>}
                  </div>
                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground">
                      {"\u00a5"}{totalPrice}
                    </span>
                    {quantity > 1 && (
                      <span className="text-sm text-muted-foreground">
                        ({"\u00a5"}{unitPrice}/{"个"})
                      </span>
                    )}
                    {product.original_price && (
                      <span className="text-base text-muted-foreground/50 line-through">
                        {"\u00a5"}{product.original_price}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                        -{discount}%
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/purchase?product=${product.id}&qty=${quantity}`}>
                  <Button
                    size="lg"
                    disabled={!inStock}
                    className="w-full sm:w-auto rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 ripple active:scale-[0.98] transition-all"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {inStock ? "立即购买" : "暂时缺货"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Product Details */}
          {product.details && (
            <div
              className="glass-card card-shadow rounded-2xl p-6 sm:p-8 mb-6 opacity-0 animate-fade-up"
              style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
            >
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-4 h-4 text-accent" />
                <h2 className="text-lg font-semibold text-foreground">{"产品详情"}</h2>
              </div>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                {product.details}
              </div>
            </div>
          )}

          {/* Usage Flow */}
          {(() => {
            const route = getActivationRoute(product.name)
            return (
              <div
                className="glass-card card-shadow rounded-2xl p-6 sm:p-8 mb-6 opacity-0 animate-fade-up"
                style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <ArrowRight className="w-4 h-4 text-accent" />
                  <h2 className="text-lg font-semibold text-foreground">{"使用流程"}</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  {(isManual ? [
                    { step: "1", title: "下单支付", desc: "选择产品并完成支付" },
                    { step: "2", title: "人工处理", desc: "客服确认后为您采购开通" },
                    { step: "3", title: "完成交付", desc: "账号/激活码发送至邮箱" },
                  ] : [
                    { step: "1", title: "下单支付", desc: "选择产品并完成支付" },
                    { step: "2", title: "获取激活码", desc: "激活码自动发送至邮箱" },
                    { step: "3", title: "前往激活", desc: route ? `在${route.label.replace("激活", "").replace("兑换", "")}页面完成开通` : "在激活页面输入激活码" },
                  ]).map((item, i) => (
                    <div key={i} className="flex-1 flex items-start gap-3 sm:flex-col sm:items-center sm:text-center p-4 rounded-xl bg-muted/30 border border-border relative">
                      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-sm font-bold text-accent">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      {i < 2 && <div className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10"><ArrowRight className="w-4 h-4" /></div>}
                    </div>
                  ))}
                </div>
                {route && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link
                      href={route.href}
                      className="inline-flex items-center gap-2 text-sm font-medium transition-colors group"
                      style={{ color: route.color }}
                    >
                      <span>{"购买后前往"}{route.label}{"页面"}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Purchase Info Cards */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-0 animate-fade-up"
            style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
          >
            {[
              { icon: Package, title: isManual ? "人工发货" : "自动发货", desc: isManual ? "下单后客服将尽快为您处理" : "支付成功后激活码自动发送至邮箱" },
              { icon: CheckCircle, title: "正品保证", desc: "全部为官方正版" },
              { icon: Sparkles, title: "售后支持", desc: "遇到问题可联系客服解决" },
            ].map((item, i) => (
              <div key={i} className="glass-card card-shadow rounded-xl p-5 text-center hover-lift">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
