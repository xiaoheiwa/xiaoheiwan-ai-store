"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function DisclaimerPage() {
  const [lang, setLang] = useState<"en" | "zh">("zh")

  return (
    &lt;main className="min-h-screen bg-background py-12 px-4"&gt;
      &lt;div className="max-w-4xl mx-auto"&gt;
        {/* Language Toggle */}
        &lt;div className="flex justify-end mb-6 gap-2"&gt;
          &lt;Button
            variant={lang === "zh" ? "default" : "outline"}
            size="sm"
            onClick={() =&gt; setLang("zh")}
          &gt;
            中文
          &lt;/Button&gt;
          &lt;Button
            variant={lang === "en" ? "default" : "outline"}
            size="sm"
            onClick={() =&gt; setLang("en")}
          &gt;
            English
          &lt;/Button&gt;
        &lt;/div&gt;

        &lt;article className="prose prose-neutral dark:prose-invert max-w-none"&gt;
          {lang === "zh" ? (
            &lt;&gt;
              &lt;h1&gt;免责声明及受限司法管辖区通知&lt;/h1&gt;
              &lt;p className="text-muted-foreground"&gt;最后更新：2025年3月&lt;/p&gt;

              &lt;p&gt;本网站提供的信息、产品和服务不面向任何在其所在司法管辖区内访问、购买、接收或使用会构成违法，或会使网站运营者承担注册、许可、税务、报告或其他监管义务（而运营者并未承担此类义务）的个人或实体。&lt;/p&gt;

              &lt;p&gt;本网站上的任何内容均不构成法律、税务、监管、合规或专业建议。&lt;/p&gt;

              &lt;p&gt;用户应自行负责：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;确定使用本网站在其所在司法管辖区是否合法&lt;/li&gt;
                &lt;li&gt;确保其购买和使用符合当地法律、平台规则和服务限制&lt;/li&gt;
                &lt;li&gt;为审查和履行提供准确信息&lt;/li&gt;
              &lt;/ul&gt;

              &lt;p&gt;我们保留随时因法律、制裁、合规、欺诈、运营或政策原因限制访问、拒绝交易、请求进一步验证或拒绝服务的权利。&lt;/p&gt;
            &lt;/&gt;
          ) : (
            &lt;&gt;
              &lt;h1&gt;Disclaimer and Restricted Jurisdictions Notice&lt;/h1&gt;
              &lt;p className="text-muted-foreground"&gt;Last updated: March 2025&lt;/p&gt;

              &lt;p&gt;The information, products, and services made available on this Website are not directed to persons or entities in any jurisdiction where access, purchase, receipt, or use would be unlawful or would subject the Website operator to registration, licensing, tax, reporting, or other regulatory obligations that the operator does not undertake.&lt;/p&gt;

              &lt;p&gt;Nothing on this Website constitutes legal, tax, regulatory, compliance, or professional advice.&lt;/p&gt;

              &lt;p&gt;Users are solely responsible for:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;determining whether use of the Website is lawful in their jurisdiction;&lt;/li&gt;
                &lt;li&gt;ensuring that their purchase and use comply with local law, platform rules, and service restrictions;&lt;/li&gt;
                &lt;li&gt;providing accurate information for review and fulfillment.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;p&gt;We reserve the right to restrict access, reject transactions, request further verification, or refuse service at any time for legal, sanctions, compliance, fraud, operational, or policy reasons.&lt;/p&gt;
            &lt;/&gt;
          )}
        &lt;/article&gt;
      &lt;/div&gt;
    &lt;/main&gt;
  )
}
