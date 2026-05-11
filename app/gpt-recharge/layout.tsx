import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "GPT充值 | ChatGPT Plus会员充值 | GPT-4o激活码购买",
  description: "GPT充值首选平台，提供ChatGPT Plus会员充值激活码、GPT Team兑换码、Claude Pro订阅激活码。支付宝微信即时支付，3分钟激活码自动发送至邮箱，官方渠道正品保证。",
  keywords: ["GPT充值", "ChatGPT Plus充值", "GPT-4o激活码", "GPT会员购买", "ChatGPT Plus激活码", "GPT Team兑换码"],
  alternates: {
    canonical: "https://upgrade.xiaoheiwan.com/gpt-recharge",
  },
  openGraph: {
    title: "GPT充值 | ChatGPT Plus会员充值 - 小黑丸",
    description: "GPT充值首选平台，ChatGPT Plus会员充值、GPT Team兑换码，3分钟自动发货",
    url: "https://upgrade.xiaoheiwan.com/gpt-recharge",
    type: "website",
  },
}

export default function GptRechargeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
