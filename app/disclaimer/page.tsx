"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function DisclaimerPage() {
  const [lang, setLang] = useState<"en" | "zh">("zh")

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6 gap-2">
          <Button
            variant={lang === "zh" ? "default" : "outline"}
            size="sm"
            onClick={() => setLang("zh")}
          >
            中文
          </Button>
          <Button
            variant={lang === "en" ? "default" : "outline"}
            size="sm"
            onClick={() => setLang("en")}
          >
            English
          </Button>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {lang === "zh" ? (
            <>
              <h1>免责声明及受限司法管辖区通知</h1>
              <p className="text-muted-foreground">最后更新：2025年3月</p>

              <p>本网站提供的信息、产品和服务不面向任何在其所在司法管辖区内访问、购买、接收或使用会构成违法的个人或实体。</p>

              <p>本网站上的任何内容均不构成法律、税务、监管、合规或专业建议。</p>

              <p>用户应自行负责：</p>
              <ul>
                <li>确定使用本网站在其所在司法管辖区是否合法</li>
                <li>确保其购买和使用符合当地法律、平台规则和服务限制</li>
                <li>为审查和履行提供准确信息</li>
              </ul>

              <p>我们保留随时因法律、制裁、合规、欺诈、运营或政策原因限制访问、拒绝交易或拒绝服务的权利。</p>
            </>
          ) : (
            <>
              <h1>Disclaimer and Restricted Jurisdictions Notice</h1>
              <p className="text-muted-foreground">Last updated: March 2025</p>

              <p>The information, products, and services on this Website are not directed to persons or entities in any jurisdiction where access, purchase, receipt, or use would be unlawful.</p>

              <p>Nothing on this Website constitutes legal, tax, regulatory, compliance, or professional advice.</p>

              <p>Users are solely responsible for:</p>
              <ul>
                <li>Determining whether use of the Website is lawful in their jurisdiction</li>
                <li>Ensuring that their purchase and use comply with local law, platform rules, and service restrictions</li>
                <li>Providing accurate information for review and fulfillment</li>
              </ul>

              <p>We reserve the right to restrict access, reject transactions, or refuse service at any time for legal, sanctions, compliance, fraud, operational, or policy reasons.</p>
            </>
          )}
        </article>
      </div>
    </main>
  )
}
