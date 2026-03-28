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
  Gift
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Telegram Premium 套餐
const plans = [
  {
    id: "3month",
    name: "3 个月",
    price: 68,
    perMonth: 22.67,
    popular: false,
  },
  {
    id: "6month", 
    name: "6 个月",
    price: 118,
    perMonth: 19.67,
    popular: true,
  },
  {
    id: "12month",
    name: "12 个月",
    price: 198,
    perMonth: 16.5,
    popular: false,
    bestValue: true,
  },
]

// 会员特权列表
const features = [
  {
    icon: Download,
    title: "4GB 文件上传",
    description: "单个文件最大支持 4GB，告别文件大小限制",
  },
  {
    icon: Zap,
    title: "极速下载",
    description: "无限制的下载速度，大文件秒传秒收",
  },
  {
    icon: FolderPlus,
    title: "双倍容量",
    description: "频道、文件夹、置顶聊天数量翻倍",
  },
  {
    icon: Mic,
    title: "语音转文字",
    description: "自动将语音消息转换为文字，方便阅读",
  },
  {
    icon: Smile,
    title: "专属表情包",
    description: "解锁 Premium 专属贴纸和表情",
  },
  {
    icon: BanIcon,
    title: "无广告体验",
    description: "去除所有频道内的赞助商广告",
  },
  {
    icon: Star,
    title: "专属徽章",
    description: "个人资料显示 Premium 专属标识",
  },
  {
    icon: Gift,
    title: "更多特权",
    description: "专属动态头像、自定义表情回应等",
  },
]

// 开通流程
const steps = [
  {
    step: 1,
    title: "联系客服",
    description: "点击下方按钮，通过 Telegram 联系站长",
  },
  {
    step: 2,
    title: "确认套餐",
    description: "告知您需要的套餐时长和 Telegram 用户名",
  },
  {
    step: 3,
    title: "完成支付",
    description: "按照客服指引完成支付",
  },
  {
    step: 4,
    title: "接受赠送",
    description: "收到官方赠送通知后点击接受即可",
  },
]

export default function TelegramPremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState("6month")

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0088cc]/10 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#0088cc]/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* Back link */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            返回首页
          </Link>

          {/* Hero content */}
          <div className="text-center max-w-3xl mx-auto">
            {/* Telegram icon */}
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
              无需提供手机号，只需 Telegram 用户名即可
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
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0088cc] text-white text-xs font-medium">
                      <Zap className="w-3 h-3" />
                      推荐
                    </span>
                  </div>
                )}
                
                {/* Best value badge */}
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
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-foreground">¥{plan.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    约 ¥{plan.perMonth.toFixed(0)}/月
                  </p>
                </div>

                {/* Selection indicator */}
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
              href="https://t.me/xiaoheiwan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-[#0088cc]/30 hover:shadow-xl hover:shadow-[#0088cc]/40 hover:-translate-y-0.5"
            >
              <Send className="w-5 h-5" />
              联系站长购买
            </a>
            <p className="mt-4 text-sm text-muted-foreground">
              点击按钮跳转至 Telegram 与客服沟通
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Premium 会员特权
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            解锁 Telegram 全部高级功能
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-background rounded-xl p-5 border border-border hover:border-[#0088cc]/30 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0088cc]/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-[#0088cc]" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
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
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            开通流程
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            简单四步，轻松开通
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, index) => (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border" />
                )}
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0088cc]/10 text-[#0088cc] font-bold text-xl mb-4 relative z-10">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">官方渠道</h3>
              <p className="text-sm text-muted-foreground">
                采用 Telegram 官方赠送方式，安全合规
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-4">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">快速开通</h3>
              <p className="text-sm text-muted-foreground">
                付款后 24 小时内完成开通
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-4">
                <MessageCircle className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">专属客服</h3>
              <p className="text-sm text-muted-foreground">
                一对一沟通，解答所有疑问
              </p>
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
          
          <div className="space-y-6">
            <div className="bg-muted/30 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">
                需要提供手机号吗？
              </h3>
              <p className="text-muted-foreground">
                不需要。我们采用 Telegram 官方的赠送功能，您只需提供 Telegram 用户名（@username）即可。
              </p>
            </div>
            <div className="bg-muted/30 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">
                如何设置 Telegram 用户名？
              </h3>
              <p className="text-muted-foreground">
                打开 Telegram 设置 &gt; 编辑个人资料 &gt; 用户名，设置一个以 @ 开头的唯一用户名即可。
              </p>
            </div>
            <div className="bg-muted/30 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">
                已有会员可以续费吗？
              </h3>
              <p className="text-muted-foreground">
                可以。通过赠送方式获得的会员时长会叠加到现有会员时长上，不会浪费。
              </p>
            </div>
            <div className="bg-muted/30 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">
                开通需要多长时间？
              </h3>
              <p className="text-muted-foreground">
                通常在付款后 24 小时内完成开通，工作时间内可能更快。
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
            href="https://t.me/xiaoheiwan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-[#0088cc]/30 hover:shadow-xl hover:shadow-[#0088cc]/40 hover:-translate-y-0.5"
          >
            <Send className="w-5 h-5" />
            联系站长购买
          </a>
        </div>
      </section>
    </main>
  )
}
