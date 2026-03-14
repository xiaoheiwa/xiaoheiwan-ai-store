import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "购买ChatGPT Plus激活码 - 小黑丸 | 支付宝微信支付",
  description:
    "在线购买ChatGPT Plus激活码，支持支付宝、微信支付，3分钟快速到账。正版GPT4激活码，安全可靠，99.9%成功率，专业售后服务。",
  keywords: [
    "购买ChatGPT Plus",
    "GPT4激活码购买",
    "ChatGPT充值",
    "OpenAI激活码",
    "GPT Plus购买",
    "ChatGPT代充",
    "支付宝购买GPT",
  ],
  openGraph: {
    title: "购买ChatGPT Plus激活码 - 小黑丸",
    description: "在线购买ChatGPT Plus激活码，支持支付宝微信支付，3分钟快速到账",
    url: "https://upgrade.xiaoheiwan.com/purchase",
    type: "website",
  },
  alternates: {
    canonical: "https://upgrade.xiaoheiwan.com/purchase",
  },
}

export default function PurchaseLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
