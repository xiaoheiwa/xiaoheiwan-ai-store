import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "购买与使用指南 - 小黑丸 | 帮助中心",
  description:
    "小黑丸AI激活码商城购买与使用指南，详细介绍购买流程、支付方式、激活码使用方法及常见问题解答。",
  keywords: [
    "AI激活码购买教程",
    "激活码使用方法",
    "小黑丸帮助中心",
    "购买指南",
    "常见问题",
    "售后支持",
  ],
  openGraph: {
    title: "购买与使用指南 - 小黑丸AI激活码商城",
    description: "详细的购买流程说明和常见问题解答，帮助您快速完成购买和使用",
    url: "https://upgrade.xiaoheiwan.com/guide",
    type: "article",
  },
  alternates: {
    canonical: "https://upgrade.xiaoheiwan.com/guide",
  },
}

export default function GuideLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
