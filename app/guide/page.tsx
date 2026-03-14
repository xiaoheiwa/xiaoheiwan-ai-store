"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  BookOpen,
  ShoppingCart,
  Mail,
  CreditCard,
  HelpCircle,
  Shield,
  Clock,
  MessageSquare,
  ChevronDown,
  Sparkles,
} from "lucide-react"

export default function GuidePage() {
  const [mounted, setMounted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const steps = [
    { icon: ShoppingCart, title: "选择产品", desc: "在首页浏览所有可购买的产品，点击进入产品详情页查看介绍和价格，确认后点击「立即购买」" },
    { icon: Mail, title: "填写邮箱", desc: "在购买页面填写您的收件邮箱，激活码/账号信息将在支付成功后自动发送至该邮箱" },
    { icon: CreditCard, title: "完成支付", desc: "选择支付宝或微信支付完成付款，支付成功后系统将在数秒内自动处理您的订单" },
    { icon: Mail, title: "查收邮件", desc: "前往邮箱查收激活码/账号信息邮件，如未收到请检查垃圾邮件箱，或通过订单查询页面查看" },
    { icon: CheckCircle, title: "使用产品", desc: "根据产品详情页的说明和邮件中的指引，完成激活或使用。具体操作步骤因产品而异" },
  ]

  const faqs = [
    { q: "支付成功后多久能收到激活码？", a: "支付宝支付成功后系统会在几秒内自动发送激活码到您的邮箱。USDT加密货币支付会自动验证链上交易，验证通过后即时发送。" },
    { q: "付款后没有收到邮件怎么办？", a: "请先检查邮箱的垃圾邮件/推广邮件文件夹。如果仍未找到，请通过首页的「查询订单」功能输入订单号和查询密码查看订单状态和激活码信息。" },
    { q: "支持哪些支付方式？", a: "支持支付宝（国内用户推荐）和 USDT (TRC20) 加密货币支付（海外用户推荐），满足不同地区用户的支付需求。" },
    { q: "如何查询我的订单？", a: "在首页点击「查询订单」，输入您的订单号和购买时设置的查询密码，即可查看订单状态、支付信息和激活码详情。" },
    { q: "激活码有使用期限吗？", a: "不同产品的有效期和使用规则不同，请在购买前查看产品详情页中的具体说明。" },
    { q: "购买后可以退款吗？", a: "由于激活码/账号属于虚拟商品，一经发送即视为已使用，暂不支持退款。请在购买前确认产品信息。" },
    { q: "USDT支付如何操作？", a: "选择USDT支付后，系统会显示收款钱包地址和需支付的USDT金额。完成转账后提交交易哈希，系统会自动验证链上交易并发货。" },
  ]

  return (
    <div className="min-h-screen bg-background dark noise-overlay">
      <div className="fixed inset-0 bg-grid-subtle opacity-40" />
      <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
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
              <BookOpen className="w-3.5 h-3.5" />
              <span>{"帮助中心"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight text-balance">
              {"购买与使用指南"}
            </h1>
            <p className="text-sm text-muted-foreground">{"了解如何购买和使用我们的产品"}</p>
          </div>

          {/* Purchase Flow Steps */}
          <div className="glass-card card-shadow rounded-2xl p-5 sm:p-8 mb-6 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{"购买流程"}</h2>
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3.5 p-3.5 sm:p-4 bg-muted/30 rounded-xl border border-border hover:border-accent/20 hover:bg-muted/50 transition-all group"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0 border border-accent/20 group-hover:border-accent/40 transition-all">
                    <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-accent/70 uppercase tracking-wider">
                        {"Step " + (index + 1)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 opacity-0 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
            {[
              { icon: Clock, title: "极速发货", desc: "支付后自动发送，无需等待人工处理" },
              { icon: Shield, title: "安全保障", desc: "加密传输，保护您的交易和账户安全" },
              { icon: MessageSquare, title: "售后支持", desc: "遇到问题可通过官方博客联系我们" },
            ].map((feat, index) => (
              <div
                key={index}
                className="glass-card card-shadow rounded-xl p-5 text-center hover-lift"
              >
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <feat.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="glass-card card-shadow rounded-2xl p-5 sm:p-8 mb-8 opacity-0 animate-fade-up" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{"常见问题"}</h2>
            </div>
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-border rounded-xl overflow-hidden hover:border-muted-foreground/30 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <span className="font-medium text-foreground text-sm">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === index ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ${openFaq === index ? "max-h-40" : "max-h-0"}`}
                  >
                    <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center opacity-0 animate-fade-up" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
            <Link
              href="/"
              className="group ripple inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-xl font-medium text-sm transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
            >
              <span>{"浏览全部商品"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/order-lookup"
              className="group btn-secondary hover-scale inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
            >
              <span>{"查询订单"}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
