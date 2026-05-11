import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Telegram Premium会员 | TG会员充值 | Telegram会员购买",
  description: "Telegram Premium会员充值服务，享受TG高级功能：无广告、更大文件上传、专属表情、更快下载速度。支付宝微信即时支付，快速开通。",
  keywords: ["Telegram Premium", "TG会员", "Telegram会员充值", "TG Premium", "电报会员"],
  alternates: {
    canonical: "https://upgrade.xiaoheiwan.com/telegram-premium",
  },
  openGraph: {
    title: "Telegram Premium会员 | TG会员充值 - 小黑丸",
    description: "Telegram Premium会员充值，享受TG高级功能",
    url: "https://upgrade.xiaoheiwan.com/telegram-premium",
    type: "website",
  },
}

export default function TelegramPremiumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
