import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "推荐服务 - VPS、代理节点、静态IP等优质服务商",
  description: "小黑丸精选推荐：优质VPS服务商、代理节点、静态IP、域名注册等服务，均为长期使用验证的可靠服务商。",
  keywords: ["VPS推荐", "代理节点", "静态IP", "域名注册", "CDN服务", "服务器推荐", "机场推荐"],
  openGraph: {
    title: "推荐服务 - 小黑丸精选优质服务商",
    description: "VPS、代理节点、静态IP等优质服务商推荐，长期使用验证的可靠选择",
  },
}

export default function RecommendationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
