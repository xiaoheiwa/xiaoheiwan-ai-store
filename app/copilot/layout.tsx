import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "GitHub Copilot激活 | Copilot Pro订阅 | AI编程助手",
  description: "GitHub Copilot激活服务，一键开通Copilot Pro订阅。AI智能代码补全、代码生成、编程助手。支持VSCode、JetBrains等主流IDE，提升编程效率。",
  keywords: ["GitHub Copilot", "Copilot激活", "Copilot Pro", "AI编程", "代码补全", "编程助手"],
  alternates: {
    canonical: "https://upgrade.xiaoheiwan.com/copilot",
  },
  openGraph: {
    title: "GitHub Copilot激活 | AI编程助手 - 小黑丸",
    description: "GitHub Copilot激活服务，一键开通AI编程助手",
    url: "https://upgrade.xiaoheiwan.com/copilot",
    type: "website",
  },
}

export default function CopilotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
