import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import WeChatRedirect from "@/components/wechat-redirect"
import LayoutWrapper from "@/components/layout-wrapper"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

const BASE_URL = "https://upgrade.xiaoheiwan.com"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export const metadata: Metadata = {
  title: {
    default: "小黑丸 - AI会员激活码商城 | ChatGPT Plus充值 | Claude Pro订阅 | GPT Team兑换",
    template: "%s | 小黑丸 AI激活码商城",
  },
  description:
    "小黑丸(XiaoHeiWan)是专业的AI服务激活码购买平台。提供ChatGPT Plus充值、Claude Pro订阅激活、GPT Team邀请兑换等服务，支持支付宝/微信支付，付款后激活码自动发送至邮箱，3分钟内到账。官方渠道正品保证，7×24小时自动发货。",
  keywords: [
    "小黑丸",
    "AI激活码",
    "ChatGPT Plus充值",
    "ChatGPT Plus激活码",
    "Claude Pro激活码",
    "Claude Pro订阅",
    "GPT Team兑换码",
    "ChatGPT订阅充值",
    "Claude会员购买",
    "AI会员充值",
    "GPT4激活码",
    "AI订阅服务",
    "ChatGPT Plus购买",
    "AI账号充值平台",
    "人工智能订阅",
  ],
  authors: [{ name: "小黑丸", url: BASE_URL }],
  creator: "小黑丸",
  publisher: "小黑丸",
  metadataBase: new URL(BASE_URL),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: BASE_URL,
    siteName: "小黑丸 AI激活码商城",
    title: "小黑丸 - ChatGPT Plus充值 | Claude Pro订阅 | AI激活码一站式商城",
    description:
      "专业的AI服务激活码购买平台，提供ChatGPT Plus、Claude Pro、GPT Team等主流AI服务激活码，支付后自动发货至邮箱，安全可靠。",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "小黑丸 - AI会员激活码商城，ChatGPT Plus充值、Claude Pro订阅",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "小黑丸 - AI会员激活码商城",
    description: "ChatGPT Plus充值、Claude Pro订阅、GPT Team兑换 - 付款自动发货，3分钟到账",
    images: ["/og-image.jpg"],
    creator: "@xiaoheiwan",
    site: "@xiaoheiwan",
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: "technology",
  classification: "AI Services, Digital Products, Software Subscription",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "format-detection": "telephone=no",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        name: "小黑丸",
        alternateName: ["XiaoHeiWan", "AI激活码商城", "小黑丸AI商城"],
        url: BASE_URL,
        description: "专业的AI服务激活码购买平台，提供ChatGPT Plus、Claude Pro、GPT Team等激活码",
        inLanguage: "zh-CN",
        publisher: { "@id": `${BASE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "小黑丸",
        alternateName: "XiaoHeiWan",
        url: BASE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${BASE_URL}/logo.jpg`,
          width: 512,
          height: 512,
          caption: "小黑丸 Logo",
        },
        image: `${BASE_URL}/og-image.jpg`,
        description: "小黑丸是专业的AI服务激活码购买平台，提供ChatGPT Plus充值、Claude Pro订阅激活、GPT Team邀请兑换等服务。",
        sameAs: [
          "https://t.me/jialiao2025",
          "https://b.xiaoheiwan.com/",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableLanguage: ["Chinese", "English"],
          url: `${BASE_URL}/guide`,
        },
      },
      {
        "@type": "WebPage",
        "@id": `${BASE_URL}/#webpage`,
        url: BASE_URL,
        name: "小黑丸 - AI会员激活码商城",
        description: "ChatGPT Plus充值、Claude Pro订阅、GPT Team兑换，付款后自动发货至邮箱",
        isPartOf: { "@id": `${BASE_URL}/#website` },
        about: { "@id": `${BASE_URL}/#organization` },
        inLanguage: "zh-CN",
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `${BASE_URL}/og-image.jpg`,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${BASE_URL}/#products`,
        name: "AI激活码产品列表",
        description: "小黑丸提供的AI服务激活码产品",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            item: {
              "@type": "Product",
              name: "ChatGPT Plus 激活码",
              description: "OpenAI ChatGPT Plus会员充值激活码，支持GPT-4o等最新模型",
              brand: { "@type": "Brand", name: "OpenAI" },
              category: "AI订阅服务",
              offers: {
                "@type": "Offer",
                url: `${BASE_URL}/purchase`,
                priceCurrency: "CNY",
                availability: "https://schema.org/InStock",
                seller: { "@id": `${BASE_URL}/#organization` },
              },
            },
          },
          {
            "@type": "ListItem",
            position: 2,
            item: {
              "@type": "Product",
              name: "Claude Pro 激活码",
              description: "Anthropic Claude Pro会员订阅激活码，享受5倍用量和优先访问",
              brand: { "@type": "Brand", name: "Anthropic" },
              category: "AI订阅服务",
              offers: {
                "@type": "Offer",
                url: `${BASE_URL}/purchase`,
                priceCurrency: "CNY",
                availability: "https://schema.org/InStock",
                seller: { "@id": `${BASE_URL}/#organization` },
              },
            },
          },
          {
            "@type": "ListItem",
            position: 3,
            item: {
              "@type": "Product",
              name: "GPT Team 兑换码",
              description: "ChatGPT Team团队版自动邀请兑换，无需信用卡即可加入Team工作区",
              brand: { "@type": "Brand", name: "OpenAI" },
              category: "AI订阅服务",
              offers: {
                "@type": "Offer",
                url: `${BASE_URL}/purchase`,
                priceCurrency: "CNY",
                availability: "https://schema.org/InStock",
                seller: { "@id": `${BASE_URL}/#organization` },
              },
            },
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${BASE_URL}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "ChatGPT Plus激活码怎么使用？",
            acceptedAnswer: {
              "@type": "Answer",
              text: "购买激活码后，进入小黑丸的ChatGPT Plus激活页面，输入卡密和您的账号JSON Token即可自动完成充值升级。全程无需国外信用卡。",
            },
          },
          {
            "@type": "Question",
            name: "Claude Pro激活码怎么使用？",
            acceptedAnswer: {
              "@type": "Answer",
              text: "购买Claude Pro激活码后，进入小黑丸的Claude激活页面，验证激活码后绑定您的Claude User ID，即可自动完成Pro会员开通。通常2-5分钟内完成。",
            },
          },
          {
            "@type": "Question",
            name: "购买后多久能收到激活码？",
            acceptedAnswer: {
              "@type": "Answer",
              text: "支付成功后，激活码会在3分钟内自动发送到您填写的邮箱地址。如未收到请检查垃圾邮件文件夹，或通过订单查询页面查看激活码。",
            },
          },
          {
            "@type": "Question",
            name: "GPT Team兑换码是什么？怎么使用？",
            acceptedAnswer: {
              "@type": "Answer",
              text: "GPT Team兑换码可以让您无需国外信用卡即可加入ChatGPT Team团队工作区。购买后在GPT Team兑换页面输入兑换码和您的邮箱即可自动接收邀请链接。",
            },
          },
          {
            "@type": "Question",
            name: "小黑丸的激活码安全吗？",
            acceptedAnswer: {
              "@type": "Answer",
              text: "小黑丸所有激活码均通过官方渠道获取，正品保证。平台采用自动化发货系统，支付宝/微信安全支付，无需提供任何账号密码，确保您的账户安全。",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${BASE_URL}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "首页",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "购买激活码",
            item: `${BASE_URL}/purchase`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "使用指南",
            item: `${BASE_URL}/guide`,
          },
        ],
      },
    ],
  }

  return (
    <html lang="zh-CN">
      <head>
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* AI Search / LLM Optimization */}
        <meta name="ai-content-description" content="小黑丸(XiaoHeiWan)是中国领先的AI服务激活码购买平台。用户可以在此购买ChatGPT Plus充值激活码、Claude Pro订阅激活码、GPT Team团队版兑换码。支持支付宝和微信支付，付款后激活码自动发送至用户邮箱，通常3分钟内到账。平台提供详细的激活教程和一键激活功能。" />
        <meta name="subject" content="AI服务激活码购买平台 - ChatGPT Plus, Claude Pro, GPT Team" />
        <meta name="topic" content="AI Subscription Services, Digital Product Sales" />
        <meta name="summary" content="Buy ChatGPT Plus, Claude Pro, and GPT Team activation codes. Instant delivery via email after payment. Supports Alipay and WeChat Pay." />
        <meta name="abstract" content="Professional AI service activation code marketplace. Purchase ChatGPT Plus recharge codes, Claude Pro subscription codes, and GPT Team invitation codes with instant automated email delivery." />
        <meta name="classification" content="AI Services, Digital Products, Software Subscription" />
        <meta name="pagetype" content="Commercial" />

        {/* Regional */}
        <meta name="geo.region" content="CN" />
        <meta name="language" content="zh-CN" />
        <meta httpEquiv="content-language" content="zh-CN" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="revisit-after" content="1 days" />
      </head>
      <body
        className={`font-sans ${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <LayoutWrapper>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </LayoutWrapper>
        <WeChatRedirect />
      </body>
    </html>
  )
}
