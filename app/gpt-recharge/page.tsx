"use client"

import Link from "next/link"
import { ArrowRight, Check, Shield, Zap, Clock, CreditCard, Star, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"

export default function GptRechargePage() {
  const features = [
    { icon: Zap, title: "即时到账", desc: "支付成功后3分钟内激活码发送至邮箱" },
    { icon: Shield, title: "官方渠道", desc: "正规渠道获取，安全有保障" },
    { icon: Clock, title: "24小时服务", desc: "全天候自动发货，随时购买" },
    { icon: CreditCard, title: "多种支付", desc: "支持支付宝、微信、USDT" },
  ]

  const products = [
    {
      name: "ChatGPT Plus 会员",
      desc: "GPT-4o、DALL-E 3、高级数据分析",
      price: "￥158",
      period: "/月",
      popular: true,
      href: "/purchase?product=chatgpt-plus",
      features: ["GPT-4o 无限制使用", "DALL-E 3 图像生成", "高级数据分析", "优先访问新功能"],
    },
    {
      name: "GPT Team 兑换码",
      desc: "团队协作，无需信用卡加入",
      price: "￥10",
      period: "/次",
      popular: false,
      href: "/purchase?product=gpt-team",
      features: ["所有 Plus 功能", "团队工作区", "管理控制台", "自动邀请兑换"],
    },
    {
      name: "Claude Pro 会员",
      desc: "5倍用量，优先访问 Claude 3.5",
      price: "￥126",
      period: "/月",
      popular: false,
      href: "/purchase?product=claude-pro",
      features: ["5倍消息用量", "优先访问新模型", "Projects 功能", "早期功能体验"],
    },
  ]

  const faqs = [
    {
      q: "GPT充值后多久能用？",
      a: "支付成功后，激活码会在3分钟内自动发送到您的邮箱。收到激活码后，按照教程操作即可立即升级使用。",
    },
    {
      q: "ChatGPT Plus 和 GPT Team 有什么区别？",
      a: "ChatGPT Plus 是个人版，GPT Team 是团队版。Team 版包含所有 Plus 功能，额外提供团队协作工作区和管理控制台。",
    },
    {
      q: "需要提供账号密码吗？",
      a: "不需要！我们的激活方式只需要您提供 JSON Token，不需要账号密码，完全安全。",
    },
    {
      q: "激活码有有效期吗？",
      a: "激活码购买后请尽快使用，建议在7天内完成激活。激活成功后会员时长按购买的月数计算。",
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                <span>2026年最受欢迎的GPT充值平台</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                GPT充值
                <span className="text-accent">一站式解决</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                ChatGPT Plus会员充值、GPT Team团队版兑换、Claude Pro订阅激活
                <br className="hidden md:block" />
                支付宝/微信支付，3分钟自动发货到邮箱
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/purchase">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    立即购买 <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/guide">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    查看教程
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">选择您的GPT充值套餐</h2>
              <p className="text-muted-foreground">所有产品均为官方渠道，安全可靠</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {products.map((product) => (
                <div
                  key={product.name}
                  className={`relative rounded-2xl border p-6 transition-all hover:shadow-lg ${
                    product.popular
                      ? "border-accent bg-accent/5 shadow-md"
                      : "border-border bg-card hover:border-accent/50"
                  }`}
                >
                  {product.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                      最受欢迎
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-foreground mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{product.desc}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-foreground">{product.price}</span>
                    <span className="text-muted-foreground">{product.period}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={product.href}>
                    <Button
                      className="w-full"
                      variant={product.popular ? "default" : "outline"}
                    >
                      立即购买
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">GPT充值流程</h2>
              <p className="text-muted-foreground">简单三步，轻松完成充值</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: "1", title: "选择产品", desc: "选择需要的ChatGPT Plus或其他AI会员产品" },
                { step: "2", title: "支付订单", desc: "填写邮箱，使用支付宝或微信完成支付" },
                { step: "3", title: "接收激活码", desc: "3分钟内激活码发送至邮箱，按教程激活即可" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-accent text-accent-foreground text-xl font-bold flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">常见问题</h2>
              <p className="text-muted-foreground">关于GPT充值的常见疑问解答</p>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold text-foreground mb-2 flex items-start gap-2">
                    <MessageSquare className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    {faq.q}
                  </h3>
                  <p className="text-muted-foreground text-sm pl-7">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-accent/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">准备好开始GPT充值了吗？</h2>
            <p className="text-muted-foreground mb-8">立即购买，3分钟内收到激活码</p>
            <Link href="/purchase">
              <Button size="lg" className="gap-2">
                前往购买 <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
