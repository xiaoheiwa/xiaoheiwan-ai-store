"use client"

import { useState, useEffect } from "react"
import { Shield, Zap, CheckCircle, ArrowRight, Sparkles, Newspaper, BookOpen, Search, Package, Link2, LayoutGrid, Send } from "lucide-react"
import Link from "next/link"
import Logo from "@/components/logo"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  product_count: number
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  original_price: number | null
  stock_count: number
  delivery_type?: string
  category_id?: string
  category_name?: string
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products")
        ])
        
        if (categoriesRes.ok) {
          const catData = await categoriesRes.json()
          setCategories(catData.categories || [])
        }
        
        if (productsRes.ok) {
          const prodData = await productsRes.json()
          setProducts(prodData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId)
    setLoading(true)
    try {
      const url = categoryId === "all" ? "/api/products" : `/api/products?category=${categoryId}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background dark noise-overlay">
      <div className="fixed inset-0 bg-grid-subtle opacity-40" />
      <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20">

          {/* Hero */}
          <div className="text-center mb-16 animate-fade-up">
            <div className="flex items-center justify-center mb-6">
              <Logo size={56} className="drop-shadow-lg" />
            </div>
            <div className="badge badge-animate mb-6 inline-flex">
              <Sparkles className="w-3.5 h-3.5 icon-rotate" />
              <span>{"安全可靠 \u00b7 自动发货"}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-5 text-reveal text-balance">
              {"小黑丸"}
            </h1>
            <p
              className="text-lg sm:text-xl text-muted-foreground font-medium mb-3 opacity-0 animate-fade-up delay-100"
              style={{ animationFillMode: "forwards" }}
            >
              {"AI 激活码 \u00b7 账号 \u00b7 兑换码 一站式商城"}
            </p>
            <p
              className="text-sm sm:text-base text-muted-foreground/70 max-w-lg mx-auto opacity-0 animate-fade-up delay-200"
              style={{ animationFillMode: "forwards" }}
            >
              {"支持 ChatGPT、Claude 等主流 AI 服务，支付后自动发送至邮箱"}
            </p>
          </div>

          {/* Products Section */}
          <div className="mb-16 opacity-0 animate-fade-up delay-200" style={{ animationFillMode: "forwards" }}>
            
            {/* Category Navigation */}
            {categories.length > 0 && (
              <div className="mb-8 max-w-4xl mx-auto">
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="flex items-center justify-start sm:justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleCategoryChange("all")}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                        selectedCategory === "all"
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span>{"全部"}</span>
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                          selectedCategory === category.id
                            ? "bg-accent text-accent-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                        }`}
                      >
                        {category.icon && <span>{category.icon}</span>}
                        <span>{category.name}</span>
                        {Number(category.product_count) > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                            selectedCategory === category.id
                              ? "bg-accent-foreground/20"
                              : "bg-muted"
                          }`}>
                            {category.product_count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                    <div className="h-5 bg-muted rounded-lg w-3/4 mb-4" />
                    <div className="h-4 bg-muted rounded-lg w-full mb-3" />
                    <div className="h-8 bg-muted rounded-lg w-1/3 mb-4" />
                    <div className="h-10 bg-muted rounded-xl w-full" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
                {products.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className={`group glass-card card-shadow rounded-2xl p-6 hover-lift block opacity-0 animate-fade-up`}
                    style={{ animationFillMode: "forwards", animationDelay: `${200 + index * 80}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-foreground text-base group-hover:text-accent transition-colors leading-snug">
                        {product.name}
                      </h3>
                      {(product.delivery_type === "manual" || Number(product.stock_count) > 0) && (
                        <span className="shrink-0 ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent border border-accent/20">
                          {"\u73b0\u8d27"}
                        </span>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-end justify-between mt-auto">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">
                          {"\u00a5"}{product.price}
                        </span>
                        {product.original_price && (
                          <span className="text-xs text-muted-foreground/50 line-through">
                            {"\u00a5"}{product.original_price}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>{"查看详情"}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* No products yet - show general CTA */
              <div className="max-w-md mx-auto glass-card card-shadow rounded-2xl p-8 text-center">
                <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{"商品即将上架"}</h3>
                <p className="text-sm text-muted-foreground mb-5">{"我们正在准备更多优质产品，敬请期待"}</p>
                <Link
                  href="/purchase"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                >
                  <span>{"进入商城"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div
            className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 mb-16 opacity-0 animate-fade-up delay-300"
            style={{ animationFillMode: "forwards" }}
          >
            <Link
              href="/purchase"
              className="group ripple inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3.5 sm:py-3 rounded-xl font-medium text-sm transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
            >
              <span>{"浏览全部商品"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/guide"
                className="group btn-secondary hover-scale inline-flex items-center justify-center gap-2 py-3 sm:py-3 rounded-xl text-sm"
              >
                <BookOpen className="w-4 h-4 group-hover:text-accent transition-colors" />
                <span>{"使用指南"}</span>
              </Link>
              <Link
                href="/order-lookup"
                className="group btn-secondary hover-scale inline-flex items-center justify-center gap-2 py-3 sm:py-3 rounded-xl text-sm"
              >
                <Search className="w-4 h-4 group-hover:text-accent transition-colors" />
                <span>{"订单查询"}</span>
              </Link>
              <Link
                href="/blog"
                className="group btn-secondary hover-scale inline-flex items-center justify-center gap-2 py-3 sm:py-3 rounded-xl text-sm"
              >
                <Newspaper className="w-4 h-4 group-hover:text-accent transition-colors" />
                <span>{"博客"}</span>
              </Link>
              <Link
                href="/recommendations"
                className="group btn-secondary hover-scale inline-flex items-center justify-center gap-2 py-3 sm:py-3 rounded-xl text-sm"
              >
                <Link2 className="w-4 h-4 group-hover:text-accent transition-colors" />
                <span>{"推荐"}</span>
              </Link>
            </div>
          </div>

          {/* Telegram Premium 专区入口 */}
          <div
            className="mb-8 max-w-2xl mx-auto opacity-0 animate-fade-up delay-300"
            style={{ animationFillMode: "forwards" }}
          >
            <Link
              href="/telegram-premium"
              className="group glass-card card-shadow rounded-2xl p-5 flex items-center gap-4 hover:border-[#0088cc]/30 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-[#0088cc] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Send className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{"Telegram Premium 会员"}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#0088cc]/10 text-[#0088cc] text-xs font-medium">{"专区"}</span>
                </div>
                <p className="text-sm text-muted-foreground">{"官方赠送方式开通，无需手机号，安全可靠"}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-[#0088cc] transition-all shrink-0" />
            </Link>
          </div>

          {/* Activation Quick Links */}
          <div
            className="mb-16 max-w-2xl mx-auto opacity-0 animate-fade-up delay-300"
            style={{ animationFillMode: "forwards" }}
          >
            <div className="glass-card card-shadow rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                </div>
                <p className="text-sm font-medium text-foreground">{"激活码使用入口"}</p>
                <span className="text-xs text-muted-foreground">{"购买后前往对应页面激活"}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { href: "/activate/claude", label: "Claude Pro", color: "#D4A574" },
                  { href: "/activate/grok", label: "Grok Premium", color: "#1DA1F2" },
                  { href: "/activate/x", label: "X Premium", color: "#000000" },
                  { href: "/activate/gpt", label: "ChatGPT Plus", color: "#10A37F" },
                  { href: "/activate/team", label: "GPT Team", color: "#3B82F6" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center justify-between gap-2 px-4 py-3 sm:py-2.5 rounded-lg border transition-all active:scale-[0.98]"
                    style={{
                      backgroundColor: `${item.color}10`,
                      borderColor: `${item.color}30`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-foreground font-medium text-sm">{item.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-all" style={{ color: undefined }} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { icon: Zap, title: "\u6781\u901f\u53d1\u8d27", desc: "\u652f\u4ed8\u6210\u529f\u540e\u81ea\u52a8\u53d1\u9001\u81f3\u90ae\u7bb1", delay: "delay-100" },
              { icon: Shield, title: "\u5b89\u5168\u4fdd\u969c", desc: "\u94f6\u884c\u7ea7\u52a0\u5bc6\uff0c\u4fdd\u62a4\u60a8\u7684\u4ea4\u6613\u5b89\u5168", delay: "delay-200" },
              { icon: CheckCircle, title: "\u552e\u540e\u65e0\u5fe7", desc: "99.9% \u6210\u529f\u7387\uff0c\u4e13\u4e1a\u5ba2\u670d\u652f\u6301", delay: "delay-300" },
            ].map((feature, index) => (
              <div
                key={index}
                className={`group glass-card card-shadow rounded-2xl p-7 text-center hover-lift opacity-0 animate-fade-up ${feature.delay}`}
                style={{ animationFillMode: "forwards" }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
