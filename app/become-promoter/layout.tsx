import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "成为推广员 | 推广赚佣金 | 小黑丸推广计划",
  description: "加入小黑丸推广计划，分享专属推广链接赚取佣金。高额佣金比例，实时数据追踪，快速提现。零投入，零门槛，立即申请成为推广员。",
  keywords: ["推广员", "推广赚钱", "佣金", "推广计划", "分销"],
  alternates: {
    canonical: "https://upgrade.xiaoheiwan.com/become-promoter",
  },
  openGraph: {
    title: "成为推广员 | 推广赚佣金 - 小黑丸",
    description: "加入小黑丸推广计划，分享推广链接赚取高额佣金",
    url: "https://upgrade.xiaoheiwan.com/become-promoter",
    type: "website",
  },
}

export default function BecomePromoterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
