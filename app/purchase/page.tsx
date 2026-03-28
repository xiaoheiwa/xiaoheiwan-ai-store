"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AlertMessage } from "@/components/alert-message"
import { CreditCard, Mail, ArrowLeft, ArrowRight, CheckCircle, Clock, Loader2, Sparkles, Box, Zap } from "lucide-react"
import Link from "next/link"

interface PriceTier {
  min_qty: number
  price: number
}

interface RegionOption {
  code: string
  name: string
  price?: number
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  original_price: number | null
  sku: string
  stock_count: number
  delivery_type: "auto" | "manual"
  price_tiers: PriceTier[] | null
  region_options?: RegionOption[] | null
  require_region_selection?: boolean
}

function getUnitPrice(product: Product, qty: number): number {
  if (!product.price_tiers || product.price_tiers.length === 0) return product.price
  const sorted = [...product.price_tiers].sort((a, b) => b.min_qty - a.min_qty)
  for (const tier of sorted) {
    if (qty >= tier.min_qty) return tier.price
  }
  return product.price
}

function PurchaseContent() {
  const searchParams = useSearchParams()
  const preselectedProductId = searchParams.get("product")
  const initialQty = Math.max(1, parseInt(searchParams.get("qty") || "1") || 1)
  const [quantity, setQuantity] = useState(initialQty)

  const [email, setEmail] = useState("")
  const [queryPassword, setQueryPassword] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("alipay")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<RegionOption | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [paymentConfig, setPaymentConfig] = useState({ alipay: true, usdt: true })

  // Backwards compat: fallback price/stock for when no products exist
  const [fallbackPrice, setFallbackPrice] = useState(99)
  const [fallbackStock, setFallbackStock] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch products first
      const productsRes = await fetch("/api/products")
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
        if (productsData.length > 0) {
          // Auto-select product from URL param, or default to first
          const preselected = preselectedProductId
            ? productsData.find((p: Product) => p.id === preselectedProductId)
            : null
          setSelectedProduct(preselected || productsData[0])
        }
      }

      // Also fetch fallback price/stock for backwards compat
      const [priceRes, stockRes, paymentRes] = await Promise.all([
        fetch("/api/price"), 
        fetch("/api/stock"),
        fetch("/api/config/payment")
      ])
      if (priceRes.ok) {
        const priceData = await priceRes.json()
        setFallbackPrice(priceData.price)
      }
      if (stockRes.ok) {
        const stockData = await stockRes.json()
        setFallbackStock(stockData.count)
      }
      if (paymentRes.ok) {
        const paymentData = await paymentRes.json()
        setPaymentConfig(paymentData)
        // If current payment method is disabled, switch to the first available
        if (!paymentData.alipay && paymentMethod === "alipay") {
          setPaymentMethod(paymentData.usdt ? "usdt" : "alipay")
        } else if (!paymentData.usdt && paymentMethod === "usdt") {
          setPaymentMethod(paymentData.alipay ? "alipay" : "usdt")
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      setMessage({ text: "加载数据失败，请刷新页面重试", type: "error" })
    } finally {
      setPageLoading(false)
    }
  }

  const isManual = selectedProduct?.delivery_type === "manual"
  const requiresRegion = selectedProduct?.require_region_selection && selectedProduct?.region_options && selectedProduct.region_options.length > 0
  // Use region-specific price if available, otherwise use product price
  const basePrice = selectedRegion?.price ?? selectedProduct?.price ?? fallbackPrice
  const unitPrice = selectedProduct ? getUnitPrice({ ...selectedProduct, price: basePrice }, quantity) : fallbackPrice
  const currentPrice = Number((unitPrice * quantity).toFixed(2))
  const currentOriginalPrice = selectedProduct?.original_price || null
  const stockCount = isManual ? 999 : (selectedProduct ? Number(selectedProduct.stock_count) : fallbackStock)

  // Reset region when product changes
  useEffect(() => {
    if (selectedProduct?.require_region_selection && selectedProduct?.region_options?.length) {
      setSelectedRegion(null)
    } else {
      setSelectedRegion(null)
    }
  }, [selectedProduct?.id])

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setMessage({ text: "请输入邮箱地址", type: "error" })
      return
    }

    if (!queryPassword || queryPassword.length < 4) {
      setMessage({ text: "请设置至少4位的订单查询密码", type: "error" })
      return
    }

    if (queryPassword.length > 20) {
      setMessage({ text: "查询密码不能超过20位", type: "error" })
      return
    }

    if (!isManual && stockCount < quantity) {
      setMessage({ text: `库存不足，当前库存 ${stockCount} 个`, type: "error" })
      return
    }

    if (requiresRegion && !selectedRegion) {
      setMessage({ text: "请选择区域", type: "error" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Handle USDT payment differently - create order and redirect to crypto payment page
      if (paymentMethod === "usdt") {
        const response = await fetch("/api/order/crypto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            amount: currentPrice,
            productId: selectedProduct?.id || null,
            productName: selectedProduct?.name || "激活码",
            queryPassword,
            quantity,
            deliveryType: selectedProduct?.delivery_type || "auto",
            selectedRegion: selectedRegion?.code || null,
            regionName: selectedRegion?.name || null,
          }),
        })

        const data = await response.json()

        if (response.ok && data.orderNo) {
          sessionStorage.setItem("orderQueryPwd", queryPassword)
          setMessage({ text: "订单创建成功！正在跳转到支付页面...", type: "success" })
          setTimeout(() => {
            window.location.href = data.redirectUrl || `/pay/crypto?orderNo=${data.orderNo}&amount=${currentPrice}&usdt=${data.usdtAmount}`
          }, 1000)
          return
        } else {
          setMessage({ text: data.error || "创建订单失败", type: "error" })
        }
        setLoading(false)
        return
      }

      // Normal Alipay payment
      const response = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          paymentMethod,
          amount: currentPrice,
          productId: selectedProduct?.id || null,
          productName: selectedProduct?.name || "激活码",
          queryPassword,
          quantity,
          deliveryType: selectedProduct?.delivery_type || "auto",
          selectedRegion: selectedRegion?.code || null,
          regionName: selectedRegion?.name || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.orderNo) {
          const orderInfo = { orderNo: data.orderNo, email, amount: currentPrice, productName: selectedProduct?.name, quantity, timestamp: Date.now() }
          localStorage.setItem("pendingOrder", JSON.stringify(orderInfo))
          sessionStorage.setItem("pendingOrderNo", data.orderNo)
          // Store query password in sessionStorage for the success/order page to use
          sessionStorage.setItem("orderQueryPwd", queryPassword)
        }

        if (data.paymentUrl || data.redirectUrl) {
          setMessage({ text: "订单创建成功！正在跳转到支付页面...", type: "success" })
          setTimeout(() => {
            window.location.href = data.paymentUrl || data.redirectUrl
          }, 1000)
          return
        } else if (data.paymentForm) {
          const tempDiv = document.createElement("div")
          tempDiv.innerHTML = data.paymentForm
          const form = tempDiv.querySelector("form") as HTMLFormElement
          if (form) {
            form.style.display = "none"
            document.body.appendChild(form)
            setTimeout(() => form.submit(), 100)
            return
          }
        }
        setMessage({ text: "支付信息获取失败", type: "error" })
      } else {
        setMessage({ text: data.error || "创建订单失败", type: "error" })
      }
    } catch (error) {
      setMessage({ text: "网络错误，请重试", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = () => {
    if (isManual) return { text: "接单中", color: "text-blue-500" }
    if (stockCount > 10) return { text: "库存充足", color: "text-accent" }
    if (stockCount > 5) return { text: "库存紧张", color: "text-yellow-500" }
    if (stockCount > 0) return { text: "仅剩少量", color: "text-orange-500" }
    return { text: "暂时缺货", color: "text-destructive" }
  }

  const stockStatus = getStockStatus()

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-10 h-10 spin-smooth text-accent mx-auto mb-4" />
            <div className="absolute inset-0 w-10 h-10 mx-auto rounded-full bg-accent/20 animate-ping" />
          </div>
          <p className="text-muted-foreground animate-pulse-soft">正在加载...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark noise-overlay">
      <div className="fixed inset-0 bg-grid-subtle opacity-40" />
      <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="relative z-10 max-w-xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-10 animated-underline"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>返回首页</span>
        </Link>

        <div className="glass-card card-shadow rounded-3xl p-8 sm:p-10 animate-fade-up">
          <div className="text-center mb-10">
            <div className="badge badge-animate mb-5 inline-flex">
              <Sparkles className="w-3.5 h-3.5" />
              <span>安全购买保障</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {selectedProduct ? `购买 ${selectedProduct.name}` : "购买激活码"}
            </h1>
            <p className="text-muted-foreground">{isManual ? "填写邮箱地址，支付后客服将尽快为您处理" : "填写邮箱地址，支付后自动发货"}</p>
          </div>

          {/* Preselected product - show compact info with option to change */}
          {selectedProduct && preselectedProductId && products.length > 1 && (
            <div className="mb-6 text-center">
              <Link
                href="/purchase"
                className="text-xs text-muted-foreground hover:text-accent transition-colors animated-underline"
              >
                {"切换其他产品"}
              </Link>
            </div>
          )}

          {/* Product Selection - only show if multiple products AND no preselection */}
          {products.length > 1 && !preselectedProductId && (
            <div className="mb-8">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
                <Box className="w-4 h-4 text-accent" />
                选择产品
              </label>
              <div className="space-y-3">
                {products.map((product) => {
                  const pStock = Number(product.stock_count)
                  const isSelected = selectedProduct?.id === product.id
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 hover-scale ${
                        isSelected
                          ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground truncate">{product.name}</span>
                            {pStock <= 0 && product.delivery_type !== "manual" && (
                              <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">{"缺货"}</span>
                            )}
                            {product.delivery_type === "manual" && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">{"人工发货"}</span>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <div className="text-right">
                            <span className="text-lg font-bold text-foreground">¥{product.price}</span>
                            {product.original_price && (
                              <span className="text-xs text-muted-foreground/60 line-through ml-1">¥{product.original_price}</span>
                            )}
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected ? "border-accent bg-accent scale-110" : "border-muted-foreground/50"
                            }`}
                          >
                            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Price & Stock Display */}
          <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-2xl p-6 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground text-sm uppercase tracking-wider">
                {selectedProduct ? selectedProduct.name : "当前价格"}
              </span>
              <div className="text-right">
                <span className="text-3xl font-bold text-foreground">{"\u00a5"}{currentPrice}</span>
                {quantity > 1 && (
                  <span className="text-sm text-muted-foreground ml-2">({"\u00a5"}{unitPrice}/{"个"} x {quantity})</span>
                )}
              </div>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground text-sm">{"购买数量"}</span>
              <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="px-3 py-1.5 text-sm text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-30"
                >-</button>
                <input
                  type="number"
                  min={1}
                  max={isManual ? 99 : stockCount}
                  value={quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 1
                    setQuantity(Math.min(Math.max(1, v), isManual ? 99 : stockCount))
                  }}
                  className="w-12 text-center text-sm text-foreground font-medium py-1.5 bg-background border-x border-border focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(isManual ? 99 : stockCount, quantity + 1))}
                  disabled={!isManual && quantity >= stockCount}
                  className="px-3 py-1.5 text-sm text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-30"
                >+</button>
              </div>
            </div>

            {/* Region Selection */}
            {requiresRegion && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-4" />
                <div className="space-y-3">
                  <span className="text-muted-foreground text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                    选择区域
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedProduct?.region_options?.map((region) => (
                      <button
                        key={region.code}
                        type="button"
                        onClick={() => setSelectedRegion(region)}
                        className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                          selectedRegion?.code === region.code
                            ? "border-accent bg-accent/10 shadow-md"
                            : "border-border hover:border-muted-foreground/50"
                        }`}
                      >
                        <div className="font-medium text-foreground text-sm">{region.name}</div>
                        {region.price !== undefined && (
                          <div className="text-xs text-accent mt-0.5">{"\u00a5"}{region.price}</div>
                        )}
                      </button>
                    ))}
                  </div>
                  {!selectedRegion && (
                    <p className="text-xs text-amber-500">请选择一个区域后继续</p>
                  )}
                </div>
              </>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-4" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                {isManual ? (
                  <Clock className="w-4 h-4 text-blue-500" />
                ) : stockCount > 5 ? (
                  <CheckCircle className="w-4 h-4 text-accent" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
                )}
                {isManual ? "发货方式" : "库存状态"}
              </span>
              <span className={`font-semibold ${stockStatus.color}`}>
                {isManual ? "人工发货" : `${stockStatus.text} (${stockCount}个)`}
              </span>
            </div>
          </div>

          {message && <AlertMessage message={message.text} type={message.type} onClose={() => setMessage(null)} />}

          <form onSubmit={handlePurchase} className="space-y-8">
            <div className="opacity-0 animate-fade-up delay-100" style={{ animationFillMode: "forwards" }}>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <Mail className="w-4 h-4 text-accent" />
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-input border border-border rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                placeholder="请输入您的邮箱地址"
                required
              />
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-accent" />
                {isManual ? "订单完成后将通过此邮箱通知" : "激活码将在支付成功后发送到此邮箱"}
              </p>
            </div>

            <div className="opacity-0 animate-fade-up delay-150" style={{ animationFillMode: "forwards" }}>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                订单查询密码
              </label>
              <input
                type="password"
                value={queryPassword}
                onChange={(e) => setQueryPassword(e.target.value)}
                className="w-full px-5 py-4 bg-input border border-border rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
                placeholder="设置4-20位查询密码"
                minLength={4}
                maxLength={20}
                required
              />
              <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-500 font-medium flex items-start gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4"/><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636-2.87L13.637 3.59a1.914 1.914 0 0 0-3.274 0z"/><path d="M12 17h.01"/></svg>
                  <span>{"重要：此密码是查看订单和激活码的唯一凭证，忘记后将无法找回，请务必牢记！"}</span>
                </p>
              </div>
            </div>

            <div className="opacity-0 animate-fade-up delay-200" style={{ animationFillMode: "forwards" }}>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
                <CreditCard className="w-4 h-4 text-accent" />
                支付方式
              </label>
              <div className="space-y-3">
                {paymentConfig.alipay && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("alipay")}
                    className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 hover-scale ${
                      paymentMethod === "alipay"
                        ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1677FF]/10 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 1024 1024" className="w-6 h-6" fill="#1677FF">
                            <path d="M230.4 512c0-155.6 126-281.6 281.6-281.6s281.6 126 281.6 281.6-126 281.6-281.6 281.6S230.4 667.6 230.4 512zM512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m160.2 497.8c-14.8-7.2-75.4-33-90.8-38.6 30.4-44.4 52.8-95.2 65.6-149.6H544V320h-64v-48h-64v48H288v52h155.8c-10.2 41-28.4 79.6-52.4 113.8-39.6-45.8-60.8-92.4-60.8-92.4l-52 24s31.8 64.2 81.4 118.2C322.6 577 276 606 276 606l28.4 52s58-34.2 107.8-80.6c28 27.2 59.4 49.8 93.2 66.4L512 640c91.8 42 183.8 71 183.8 71l20.4-52s-21.6-8.6-44-19.2z"/>
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-foreground">{"支付宝"}</div>
                          <div className="text-xs text-muted-foreground">{"安全快捷支付"}</div>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          paymentMethod === "alipay" ? "border-accent bg-accent scale-110" : "border-muted-foreground/50"
                        }`}
                      >
                        {paymentMethod === "alipay" && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </button>
                )}

                {paymentConfig.usdt && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("usdt")}
                    className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 hover-scale ${
                      paymentMethod === "usdt"
                        ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#26A17B]/10 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 32 32" className="w-6 h-6">
                            <circle cx="16" cy="16" r="16" fill="#26A17B"/>
                            <path fill="#fff" d="M17.9 17.9v-.003c-.109.008-.67.042-1.9.042-1.014 0-1.723-.03-1.965-.042v.003c-3.896-.168-6.8-1.15-6.8-2.32 0-1.17 2.904-2.15 6.8-2.32v3.69c.246.017.97.057 1.98.057 1.21 0 1.77-.047 1.885-.057V13.26c3.887.17 6.784 1.15 6.784 2.32 0 1.168-2.897 2.15-6.784 2.32zm0-5.02v-3.3h5.282V6H8.783v3.58h5.282v3.3c-4.405.202-7.7 1.42-7.7 2.9 0 1.48 3.295 2.698 7.7 2.9v10.36H18v-10.36c4.397-.202 7.687-1.42 7.687-2.9-.001-1.48-3.29-2.698-7.787-2.9z"/>
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-foreground">{"USDT (TRC20)"}</div>
                          <div className="text-xs text-muted-foreground">{"加密货币支付"}</div>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          paymentMethod === "usdt" ? "border-accent bg-accent scale-110" : "border-muted-foreground/50"
                        }`}
                      >
                        {paymentMethod === "usdt" && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </button>
                )}

                {!paymentConfig.alipay && !paymentConfig.usdt && (
                  <div className="text-center text-muted-foreground py-4">
                    {"暂无可用支付方式"}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (!isManual && stockCount < quantity) || (requiresRegion && !selectedRegion)}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-muted disabled:cursor-not-allowed text-accent-foreground py-5 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-accent/30 active:scale-[0.98] flex items-center justify-center gap-3 ripple opacity-0 animate-fade-up delay-300"
              style={{ animationFillMode: "forwards" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 spin-smooth" />
                  <span>创建订单中...</span>
                </>
              ) : (!isManual && stockCount < quantity) ? (
                <span>{"库存不足"}</span>
              ) : (requiresRegion && !selectedRegion) ? (
                <span>{"请选择区域"}</span>
              ) : (
                <span>{"立即支付"} {"\u00a5"}{currentPrice}{quantity > 1 ? ` (${quantity}个)` : ""}{selectedRegion ? ` - ${selectedRegion.name}` : ""}</span>
              )}
            </button>
          </form>

          {/* 激活码使用入口 */}
          <div className="mt-8 p-5 rounded-2xl bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">{"已购买？前往激活"}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { href: "/activate/claude", label: "Claude Pro", color: "#D4A574" },
                { href: "/activate/grok", label: "Grok", color: "#1DA1F2" },
                { href: "/activate/x", label: "X Premium", color: "#000000" },
                { href: "/activate/gpt", label: "ChatGPT", color: "#10A37F" },
                { href: "/activate/team", label: "GPT Team", color: "#3B82F6" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all text-sm"
                  style={{
                    backgroundColor: `${item.color}10`,
                    borderColor: `${item.color}30`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-foreground font-medium">{item.label}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function PurchasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    }>
      <PurchaseContent />
    </Suspense>
  )
}
