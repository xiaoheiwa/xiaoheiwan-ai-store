"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Send, 
  Check, 
  Zap, 
  Download, 
  FolderPlus, 
  Mic, 
  Smile, 
  BanIcon, 
  Star,
  ArrowRight,
  MessageCircle,
  Shield,
  Clock,
  Gift,
  AlertCircle
} from "lucide-react"

// Telegram Premium 套餐
const plans = [
  {
    id: "3month",
    name: "3 个月",
    price: 124,
    originalPrice: "14.99 USD",
    perMonth: 41,
    popular: false,
  },
  {
    id: "6month", 
    name: "6 个月",
    price: 155,
    originalPrice: "19.99 USD",
    perMonth: 26,
    popular: true,
  },
  {
    id: "12month",
    name: "12 个月",
    price: 258,
    originalPrice: "35.99 USD",
    perMonth: 22,
    popular: false,
    bestValue: true,
  },
]

// 会员特权列表
const features = [
  {
    icon: Download,
    title: "4GB 文件上传",
    description: "单个文件最大支持 4GB",
  },
  {
    icon: Zap,
    title: "极速下载",
    description: "无限制的下载速度",
  },
  {
    icon: FolderPlus,
    title: "双倍容量",
    description: "频道、文件夹数量翻倍",
  },
  {
    icon: Mic,
    title: "语音转文字",
    description: "自动转换语音消息",
  },
  {
    icon: Smile,
    title: "专属表情包",
    description: "解锁 Premium 表情",
  },
  {
    icon: BanIcon,
    title: "无广告",
    description: "去除频道广告",
  },
  {
    icon: Star,
    title: "专属徽章",
    description: "Premium 标识",
  },
  {
    icon: Gift,
    title: "更多特权",
    description: "动态头像等",
  },
]

// 开通流程
const steps = [
  {
    step: 1,
    title: "联系客服",
    description: "通过 Telegram 联系 @jialiao2025",
  },
  {
    step: 2,
    title: "确认信息",
    description: "告知套餐时长和您的用户名",
  },
  {
    step: 3,
    title: "完成支付",
    description: "按指引完成支付",
  },
  {
    step: 4,
    title: "接收赠送",
    description: "收到通知后点击接受",
  },
]

export default function TelegramPremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState("6month")

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0088cc]/10 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#0088cc]/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            返回首页
          </Link>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0088cc] mb-6 shadow-lg shadow-[#0088cc]/30">
              <Send className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              Telegram Premium
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-2">
              官方赠送方式开通，安全可靠
            </p>
            <p className="text-sm text-muted-foreground/80">
              只需提供 Telegram 用户名，无需手机号
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            选择套餐
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? "border-[#0088cc] bg-[#0088cc]/5 shadow-lg shadow-[#0088cc]/10"
                    : "border-border hover:border-[#0088cc]/50 hover:bg-muted/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0088cc] text-white text-xs font-medium">
                      <Zap className="w-3 h-3" />
                      推荐
                    </span>
                  </div>
                )}
                
                {plan.bestValue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-white text-xs font-medium">
                      <Star className="w-3 h-3" />
                      最划算
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-foreground">¥{plan.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mb-2">
                    官方售价 {plan.originalPrice}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    约 ¥{plan.perMonth}/月
                  </p>
                </div>

                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedPlan === plan.id
                    ? "border-[#0088cc] bg-[#0088cc]"
                    : "border-muted-foreground/30"
                }`}>
                  {selectedPlan === plan.id && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-10 text-center">
            <a
              href="https://t.me/jialiao2025"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-[#0088cc]/30 hover:shadow-xl hover:shadow-[#0088cc]/40 hover:-translate-y-0.5"
            >
              <Send className="w-5 h-5" />
              联系站长购买
            </a>
            <p className="mt-4 text-sm text-muted-foreground">
              Telegram: @jialiao2025
            </p>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">购买须知</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>{"1. 请先设置 Telegram 用户名和头像才能充值"}</li>
                  <li>{"2. 用户名不是手机号，无需提供手机号"}</li>
                  <li>{"3. 会员只有 3/6/12 个月三种周期，没有单月"}</li>
                  <li>{"4. 价格可能随汇率变动调整"}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Premium 会员特权
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-background rounded-xl p-4 border border-border text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0088cc]/10 flex items-center justify-center mb-3 mx-auto">
                  <feature.icon className="w-5 h-5 text-[#0088cc]" />
                </div>
                <h3 className="font-medium text-foreground text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            开通流程
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0088cc]/10 text-[#0088cc] font-bold text-lg mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 mb-3">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-medium text-foreground text-sm">官方渠道</h3>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 mb-3">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-medium text-foreground text-sm">快速开通</h3>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 mb-3">
                <MessageCircle className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-medium text-foreground text-sm">专属客服</h3>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            常见问题
          </h2>
          
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-2">
                如何查看/设置 Telegram 用户名？
              </h3>
              <p className="text-sm text-muted-foreground">
                打开 Telegram 设置 &gt; 编辑个人资料 &gt; 用户名（Username），设置一个 @ 开头的用户名。
              </p>
            </div>
            <div className="bg-muted/30 rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-2">
                已有会员可以续费吗？
              </h3>
              <p className="text-sm text-muted-foreground">
                可以。赠送的会员时长会叠加到现有时长上。
              </p>
            </div>
            <div className="bg-muted/30 rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-2">
                开通需要多久？
              </h3>
              <p className="text-sm text-muted-foreground">
                工作时间内通常 10 分钟内处理，最晚不超过 24 小时。
              </p>
            </div>
            <div className="bg-muted/30 rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-2">
                支持哪些支付方式？
              </h3>
              <p className="text-sm text-muted-foreground">
                支持支付宝转账、USDT 等，具体请联系客服确认。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 sm:py-16 bg-gradient-to-t from-[#0088cc]/10 to-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            准备好升级了吗？
          </h2>
          <p className="text-muted-foreground mb-8">
            立即联系客服，开启您的 Premium 之旅
          </p>
          <a
            href="https://t.me/jialiao2025"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-[#0088cc]/30 hover:shadow-xl hover:shadow-[#0088cc]/40 hover:-translate-y-0.5"
          >
            <Send className="w-5 h-5" />
            联系站长购买
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            Telegram: @jialiao2025
          </p>
        </div>
      </section>
    </main>
  )
}
