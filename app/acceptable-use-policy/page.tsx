"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Globe } from "lucide-react"

export default function AcceptableUsePolicyPage() {
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
            {lang === "zh" ? "可接受使用政策" : "Acceptable Use Policy"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === "zh" ? "最后更新：2025年3月" : "Last Updated: March 2025"}
          </p>
        </div>

        <div className="space-y-6">
          {lang === "zh" ? (
            <>
              <p className="text-muted-foreground leading-relaxed">{"本可接受使用政策是小黑丸服务条款的一部分。您不得将本网站或通过本网站获得的任何产品或服务用于以下目的："}</p>
              <ul className="text-muted-foreground leading-relaxed list-disc list-inside space-y-2">
                <li>{"欺诈、欺骗、身份滥用、冒充或非法转售"}</li>
                <li>{"洗钱、制裁规避、恐怖融资或其他非法金融活动"}</li>
                <li>{"网络钓鱼、垃圾邮件、恶意软件、机器人滥用或未经授权的自动化"}</li>
                <li>{"涉及未成年人的色情内容、人身剥削、人口贩卖或任何非法或滥用内容"}</li>
                <li>{"非法的赌博、诈骗运营或其他被禁止或高风险行业"}</li>
                <li>{"骚扰、跟踪、威胁、基于仇恨的滥用或侵犯他人权利"}</li>
                <li>{"试图违法规避平台规则、安全系统或司法管辖限制"}</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">{"我们可能调查涉嫌违规行为，并可能暂停访问、取消订单、拒绝支持或配合当局的合法请求。"}</p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground leading-relaxed">{"This Acceptable Use Policy forms part of the Terms of Service. You may not use the Website, or any product or service obtained through it, in connection with:"}</p>
              <ul className="text-muted-foreground leading-relaxed list-disc list-inside space-y-2">
                <li>{"Fraud, deception, identity misuse, impersonation, or unlawful resale"}</li>
                <li>{"Money laundering, sanctions evasion, terrorist financing, or other illegal financial activity"}</li>
                <li>{"Phishing, spam, malware, bot abuse, or unauthorized automation"}</li>
                <li>{"Pornography involving minors, human exploitation, trafficking, or any unlawful content"}</li>
                <li>{"Gambling, scam operations, or other prohibited or high-risk industries where unlawful"}</li>
                <li>{"Harassment, stalking, threats, hate-based abuse, or violations of others rights"}</li>
                <li>{"Attempts to evade platform rules, security systems, or jurisdictional restrictions"}</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">{"We may investigate suspected violations and may suspend access, cancel orders, refuse support, or cooperate with lawful requests from authorities."}</p>
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
