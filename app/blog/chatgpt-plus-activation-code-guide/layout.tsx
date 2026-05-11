import { Metadata } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://upgrade.xiaoheiwan.com"

export const metadata: Metadata = {
  title: "ChatGPT Plus激活码完整指南：快速升级无需信用卡 | 小黑丸",
  description: "详细了解如何使用ChatGPT Plus激活码快速升级，无需信用卡即可享受GPT-4o等高级功能。本指南涵盖激活流程、常见问题解决和使用技巧。",
  keywords: "ChatGPT Plus激活码,ChatGPT升级,激活码兑换,GPT-4o,OpenAI,ChatGPT Plus,无需信用卡",
  canonical: `${BASE_URL}/blog/chatgpt-plus-activation-code-guide`,
  openGraph: {
    title: "ChatGPT Plus激活码完整指南：快速升级无需信用卡",
    description: "详细了解如何使用ChatGPT Plus激活码快速升级，无需信用卡即可享受GPT-4o等高级功能。本指南涵盖激活流程、常见问题解决和使用技巧。",
    url: `${BASE_URL}/blog/chatgpt-plus-activation-code-guide`,
    type: "article",
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "ChatGPT Plus激活码指南",
      },
    ],
    siteName: "小黑丸AI激活码商城",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatGPT Plus激活码完整指南：快速升级无需信用卡",
    description: "详细了解如何使用ChatGPT Plus激活码快速升级，无需信用卡即可享受GPT-4o等高级功能。",
    images: [`${BASE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: `${BASE_URL}/blog/chatgpt-plus-activation-code-guide`,
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
}

export default function BlogArticleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: "ChatGPT Plus激活码完整指南：快速升级无需信用卡",
            description: "详细了解如何使用ChatGPT Plus激活码快速升级，无需信用卡即可享受GPT-4o等高级功能。本指南涵盖激活流程、常见问题解决和使用技巧。",
            image: `${BASE_URL}/og-image.jpg`,
            datePublished: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            author: {
              "@type": "Organization",
              name: "小黑丸AI激活码商城",
              url: BASE_URL,
            },
            publisher: {
              "@type": "Organization",
              name: "小黑丸AI激活码商城",
              logo: {
                "@type": "ImageObject",
                url: `${BASE_URL}/logo.png`,
              },
            },
            mainEntity: {
              "@type": "HowTo",
              name: "如何使用ChatGPT Plus激活码升级",
              step: [
                {
                  "@type": "HowToStep",
                  position: 1,
                  name: "登录ChatGPT账户",
                  text: "访问https://chat.openai.com并使用你的账户登录",
                },
                {
                  "@type": "HowToStep",
                  position: 2,
                  name: "进入升级页面",
                  text: "点击账户头像，选择My Account，查找Upgrade to Plus选项",
                },
                {
                  "@type": "HowToStep",
                  position: 3,
                  name: "输入激活码",
                  text: "点击I have a code选项，输入购买的激活码",
                },
                {
                  "@type": "HowToStep",
                  position: 4,
                  name: "完成升级",
                  text: "点击Redeem按钮，等待系统验证后即可使用Plus功能",
                },
              ],
            },
            keywords: "ChatGPT Plus激活码,ChatGPT升级,GPT-4o,OpenAI,激活码兑换",
            articleBody: "详细的文章内容...",
          }),
        }}
      />
    </>
  )
}
