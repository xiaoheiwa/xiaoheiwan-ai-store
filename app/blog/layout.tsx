import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "博客 - 小黑丸",
  description: "小黑丸官方博客，分享 ChatGPT Plus、Claude Pro 等 AI 工具的使用教程、充值指南和最新资讯。",
  keywords: ["AI博客", "ChatGPT教程", "Claude教程", "AI工具指南", "小黑丸博客"],
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
