import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "订单查询 - 小黑丸 | ChatGPT Plus激活码订单",
  description: "查询您的ChatGPT Plus激活码订单状态，输入订单号和邮箱即可查看订单详情和激活码信息。",
  keywords: ["ChatGPT订单查询", "GPT激活码查询", "小黑丸订单", "ChatGPT Plus订单"],
  openGraph: {
    title: "订单查询 - 小黑丸",
    description: "查询您的ChatGPT Plus激活码订单状态",
    url: "https://upgrade.xiaoheiwan.com/order-lookup",
    type: "website",
  },
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://upgrade.xiaoheiwan.com/order-lookup",
  },
}

export default function OrderLookupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
