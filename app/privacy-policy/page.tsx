"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Globe } from "lucide-react"

export default function PrivacyPolicyPage() {
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
            {lang === "zh" ? "隐私政策" : "Privacy Policy"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === "zh" ? "最后更新：2025年3月" : "Last Updated: March 2025"}
          </p>
        </div>

        <div className="space-y-6">
          {lang === "zh" ? (
            <>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"1. 信息收集"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"我们收集您在使用服务时提供的信息，包括邮箱地址、支付信息（由第三方支付处理商处理）、以及服务使用数据。"}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"2. 信息使用"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"收集的信息用于：处理订单和交付服务、提供客户支持、改进服务质量、发送服务相关通知。"}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"3. 信息保护"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"我们采用行业标准的安全措施保护您的个人信息，包括 SSL 加密传输和安全存储。"}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"4. 信息共享"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"我们不会出售您的个人信息。仅在必要时与支付处理商、服务提供商共享，或应法律要求披露。"}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"5. 联系我们"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"如有隐私相关问题，请联系 Telegram @jialiao2025"}</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"1. Information Collection"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"We collect information you provide when using our services, including email addresses, payment information (processed by third-party payment processors), and service usage data."}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"2. Information Use"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"Collected information is used to: process orders and deliver services, provide customer support, improve service quality, and send service-related notifications."}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"3. Information Protection"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"We employ industry-standard security measures to protect your personal information, including SSL encrypted transmission and secure storage."}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"4. Information Sharing"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"We do not sell your personal information. We only share with payment processors and service providers when necessary, or disclose as required by law."}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"5. Contact Us"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"For privacy inquiries, contact Telegram @jialiao2025"}</p>
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
            <Link href="/refund-policy" className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
              {lang === "zh" ? "退款政策" : "Refund Policy"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
