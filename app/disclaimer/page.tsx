"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Globe } from "lucide-react"

export default function DisclaimerPage() {
  const [lang, setLang] = useState<"zh" | "en">("zh")

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{"返回首页"}</span>
          </Link>
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm"
          >
            <Globe className="w-4 h-4" />
            <span>{lang === "zh" ? "EN" : "中文"}</span>
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {lang === "zh" ? "免责声明" : "Disclaimer"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === "zh" ? "最后更新：2025年3月" : "Last Updated: March 2025"}
          </p>
        </div>

        <div className="space-y-6">
          {lang === "zh" ? (
            <>
              <p className="text-muted-foreground leading-relaxed">{"本网站提供的信息、产品和服务不面向任何在其所在司法管辖区内访问、购买、接收或使用会构成违法的个人或实体。"}</p>
              <p className="text-muted-foreground leading-relaxed">{"本网站上的任何内容均不构成法律、税务、监管、合规或专业建议。"}</p>
              
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"用户责任"}</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">{"用户应自行负责："}</p>
                <ul className="text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
                  <li>{"确定使用本网站在其所在司法管辖区是否合法"}</li>
                  <li>{"确保其购买和使用符合当地法律、平台规则和服务限制"}</li>
                  <li>{"为审查和履行提供准确信息"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"权利保留"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"我们保留随时因法律、制裁、合规、欺诈、运营或政策原因限制访问、拒绝交易或拒绝服务的权利。"}</p>
              </section>
            </>
          ) : (
            <>
              <p className="text-muted-foreground leading-relaxed">{"The information, products, and services on this Website are not directed to persons or entities in any jurisdiction where access, purchase, receipt, or use would be unlawful."}</p>
              <p className="text-muted-foreground leading-relaxed">{"Nothing on this Website constitutes legal, tax, regulatory, compliance, or professional advice."}</p>

              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"User Responsibility"}</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">{"Users are solely responsible for:"}</p>
                <ul className="text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
                  <li>{"Determining whether use of the Website is lawful in their jurisdiction"}</li>
                  <li>{"Ensuring that their purchase and use comply with local law, platform rules, and service restrictions"}</li>
                  <li>{"Providing accurate information for review and fulfillment"}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"Rights Reserved"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"We reserve the right to restrict access, reject transactions, or refuse service at any time for legal, sanctions, compliance, fraud, operational, or policy reasons."}</p>
              </section>
            </>
          )}
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">{lang === "zh" ? "相关文档" : "Related Documents"}</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/terms-of-service" className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
              {lang === "zh" ? "服务条款" : "Terms of Service"}
            </Link>
            <Link href="/privacy-policy" className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
              {lang === "zh" ? "隐私政策" : "Privacy Policy"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
