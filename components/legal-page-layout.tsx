"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LegalPageLayoutProps {
  title: { zh: string; en: string }
  lastUpdated: string
  renderContent: (lang: "zh" | "en") => React.ReactNode
}

const legalLinks = [
  { href: "/privacy-policy", label: { zh: "隐私政策", en: "Privacy" } },
  { href: "/terms-of-service", label: { zh: "服务条款", en: "Terms" } },
  { href: "/refund-policy", label: { zh: "退款政策", en: "Refund" } },
  { href: "/acceptable-use-policy", label: { zh: "使用政策", en: "Acceptable Use" } },
  { href: "/disclaimer", label: { zh: "免责声明", en: "Disclaimer" } },
]

export function LegalPageLayout({ title, lastUpdated, renderContent }: LegalPageLayoutProps) {
  const [lang, setLang] = useState<"zh" | "en">("zh")

  return (
    <main className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{"返回首页"}</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setLang("zh")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  lang === "zh" 
                    ? "bg-foreground text-background" 
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  lang === "en" 
                    ? "bg-foreground text-background" 
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Title Section */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {title[lang]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === "zh" ? `最后更新：${lastUpdated}` : `Last updated: ${lastUpdated}`}
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="mb-8 p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground mb-3">
            {lang === "zh" ? "相关法律文档" : "Related Legal Documents"}
          </p>
          <div className="flex flex-wrap gap-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors"
              >
                {link.label[lang]}
              </Link>
            ))}
          </div>
        </div>

        {/* Content */}
        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/50 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-ul:my-4 prose-li:my-1">
          {renderContent(lang)}
        </article>

        {/* Footer Contact */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              {lang === "zh" 
                ? "如有任何疑问，请联系我们" 
                : "If you have any questions, please contact us"}
            </p>
            <a 
              href="https://t.me/jialiao2025" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 transition-colors font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              @jialiao2025
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
