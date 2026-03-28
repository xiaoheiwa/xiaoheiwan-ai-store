"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function AcceptableUsePolicyPage() {
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
              &lt;h1&gt;可接受使用政策&lt;/h1&gt;
              &lt;p className="text-muted-foreground"&gt;最后更新：2025年3月&lt;/p&gt;

              &lt;p&gt;本可接受使用政策是小黑丸服务条款的一部分。&lt;/p&gt;

              &lt;p&gt;您不得将本网站或通过本网站获得的任何产品或服务用于以下目的：&lt;/p&gt;

              &lt;ul&gt;
                &lt;li&gt;欺诈、欺骗、身份滥用、冒充或非法转售&lt;/li&gt;
                &lt;li&gt;洗钱、制裁规避、恐怖融资或其他非法金融活动&lt;/li&gt;
                &lt;li&gt;网络钓鱼、垃圾邮件、恶意软件、机器人滥用或未经授权的自动化&lt;/li&gt;
                &lt;li&gt;涉及未成年人的色情内容、人身剥削、人口贩卖或任何非法或滥用内容&lt;/li&gt;
                &lt;li&gt;非法的赌博、诈骗运营或其他被禁止或高风险行业&lt;/li&gt;
                &lt;li&gt;骚扰、跟踪、威胁、基于仇恨的滥用或侵犯他人权利&lt;/li&gt;
                &lt;li&gt;试图违法规避平台规则、安全系统或司法管辖限制&lt;/li&gt;
                &lt;li&gt;可能使我们、我们的提供商或第三方面临法律、监管、制裁、欺诈或声誉风险的任何活动&lt;/li&gt;
              &lt;/ul&gt;

              &lt;p&gt;我们可能调查涉嫌违规行为，并可能暂停访问、取消订单、拒绝支持、保存记录或配合当局或对手方的合法请求。&lt;/p&gt;
            &lt;/&gt;
          ) : (
            &lt;&gt;
              &lt;h1&gt;Acceptable Use Policy&lt;/h1&gt;
              &lt;p className="text-muted-foreground"&gt;Last updated: March 2025&lt;/p&gt;

              &lt;p&gt;This Acceptable Use Policy forms part of the Terms of Service for Xiaoheiwan.&lt;/p&gt;

              &lt;p&gt;You may not use the Website, or any product or service obtained through it, in connection with:&lt;/p&gt;

              &lt;ul&gt;
                &lt;li&gt;fraud, deception, identity misuse, impersonation, or unlawful resale;&lt;/li&gt;
                &lt;li&gt;money laundering, sanctions evasion, terrorist financing, or other illegal financial activity;&lt;/li&gt;
                &lt;li&gt;phishing, spam, malware, bot abuse, or unauthorized automation;&lt;/li&gt;
                &lt;li&gt;pornography involving minors, human exploitation, trafficking, or any unlawful or abusive content;&lt;/li&gt;
                &lt;li&gt;gambling, scam operations, or other prohibited or high-risk industries where unlawful;&lt;/li&gt;
                &lt;li&gt;harassment, stalking, threats, hate-based abuse, or violations of others' rights;&lt;/li&gt;
                &lt;li&gt;attempts to evade platform rules, security systems, or jurisdictional restrictions in violation of law;&lt;/li&gt;
                &lt;li&gt;any activity that may expose us, our providers, or third parties to legal, regulatory, sanctions, fraud, or reputational risk.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;p&gt;We may investigate suspected violations and may suspend access, cancel orders, refuse support, preserve records, or cooperate with lawful requests from authorities or counterparties.&lt;/p&gt;
            &lt;/&gt;
          )}
        &lt;/article&gt;
      &lt;/div&gt;
    &lt;/main&gt;
  )
}
