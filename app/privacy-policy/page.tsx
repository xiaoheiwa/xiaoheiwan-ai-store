"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicyPage() {
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
              &lt;h1&gt;隐私政策&lt;/h1&gt;
              &lt;p className="text-muted-foreground"&gt;最后更新：2025年3月&lt;/p&gt;

              &lt;p&gt;欢迎访问小黑丸（"本网站"、"我们"）。本隐私政策说明了当您访问或使用本网站、产品或服务时，我们如何收集、使用、存储和披露信息。&lt;/p&gt;
              &lt;p&gt;使用本网站即表示您已阅读并理解本隐私政策。&lt;/p&gt;

              &lt;h2&gt;1. 适用范围&lt;/h2&gt;
              &lt;p&gt;本隐私政策适用于通过以下方式收集的信息：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;本网站&lt;/li&gt;
                &lt;li&gt;结账页面&lt;/li&gt;
                &lt;li&gt;客户支持通信&lt;/li&gt;
                &lt;li&gt;订单和交付流程&lt;/li&gt;
                &lt;li&gt;与本网站相关的分析、安全和防欺诈系统&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;2. 我们收集的信息&lt;/h2&gt;
              &lt;h3&gt;2.1 您直接提供的信息&lt;/h3&gt;
              &lt;ul&gt;
                &lt;li&gt;电子邮件地址&lt;/li&gt;
                &lt;li&gt;用户名、账户标识符或其他用于订单履行的服务相关信息&lt;/li&gt;
                &lt;li&gt;您在结账时提供的账单相关详细信息&lt;/li&gt;
                &lt;li&gt;您发送给客服的消息&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h3&gt;2.2 自动收集的信息&lt;/h3&gt;
              &lt;ul&gt;
                &lt;li&gt;IP 地址&lt;/li&gt;
                &lt;li&gt;浏览器类型和版本&lt;/li&gt;
                &lt;li&gt;设备信息&lt;/li&gt;
                &lt;li&gt;操作系统&lt;/li&gt;
                &lt;li&gt;访问的页面&lt;/li&gt;
                &lt;li&gt;来源引用&lt;/li&gt;
                &lt;li&gt;页面停留时间&lt;/li&gt;
                &lt;li&gt;Cookie 和类似跟踪技术&lt;/li&gt;
                &lt;li&gt;用于安全、防欺诈和故障排除的日志&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h3&gt;2.3 来自第三方的信息&lt;/h3&gt;
              &lt;p&gt;我们可能从支付处理商、托管提供商、分析提供商、电子邮件服务提供商和反滥用供应商处接收有限的订单、支付状态、欺诈风险或技术数据。&lt;/p&gt;

              &lt;h2&gt;3. 信息使用方式&lt;/h2&gt;
              &lt;p&gt;我们可能使用收集的信息用于：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;处理和履行订单&lt;/li&gt;
                &lt;li&gt;交付数字产品或服务相关信息&lt;/li&gt;
                &lt;li&gt;验证交易并减少欺诈或滥用&lt;/li&gt;
                &lt;li&gt;提供客户支持&lt;/li&gt;
                &lt;li&gt;维护服务安全和技术稳定性&lt;/li&gt;
                &lt;li&gt;改进网站功能和用户体验&lt;/li&gt;
                &lt;li&gt;发送订单通知、服务公告或合规相关通信&lt;/li&gt;
                &lt;li&gt;执行我们的服务条款和其他政策&lt;/li&gt;
                &lt;li&gt;遵守适用的法律义务&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;4. 法律依据 / 用户责任&lt;/h2&gt;
              &lt;p&gt;您有责任确保您对本网站的访问和使用在您所在的司法管辖区是合法的。我们保留因法律、合规、欺诈、制裁或风险控制原因拒绝服务、请求验证、暂停交付或取消订单的权利。&lt;/p&gt;

              &lt;h2&gt;5. Cookie 和跟踪技术&lt;/h2&gt;
              &lt;p&gt;我们可能使用 Cookie、本地存储、服务器日志和类似技术来：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;保持网站正常运行&lt;/li&gt;
                &lt;li&gt;记住用户偏好&lt;/li&gt;
                &lt;li&gt;分析流量和使用情况&lt;/li&gt;
                &lt;li&gt;检测滥用、恶意请求或可疑行为&lt;/li&gt;
              &lt;/ul&gt;
              &lt;p&gt;您可以通过浏览器设置管理 Cookie，但禁用 Cookie 可能会影响某些网站功能。&lt;/p&gt;

              &lt;h2&gt;6. 信息共享&lt;/h2&gt;
              &lt;p&gt;我们不会将个人信息作为独立商业模式进行出售。我们可能与以下方共享有限信息：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;支付处理商&lt;/li&gt;
                &lt;li&gt;托管和基础设施提供商&lt;/li&gt;
                &lt;li&gt;分析和安全供应商&lt;/li&gt;
                &lt;li&gt;电子邮件递送提供商&lt;/li&gt;
                &lt;li&gt;法律或监管机构（如有要求）&lt;/li&gt;
                &lt;li&gt;专业顾问（如合理必要）&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;7. 数据保留&lt;/h2&gt;
              &lt;p&gt;我们仅在以下目的合理需要的时间内保留信息：订单履行、争议处理、防欺诈、记录保存、法律、税务、会计或合规目的。&lt;/p&gt;

              &lt;h2&gt;8. 跨境处理&lt;/h2&gt;
              &lt;p&gt;根据基础设施、服务提供商和您的位置，您的信息可能在与您所在地不同的国家或地区进行处理或存储。使用本网站即表示您理解并确认可能发生跨境处理。&lt;/p&gt;

              &lt;h2&gt;9. 数据安全&lt;/h2&gt;
              &lt;p&gt;我们采取合理的行政、技术和组织措施来保护信息免受未经授权的访问、丢失、滥用、更改或披露。但是，没有任何系统是完全安全的，我们不保证绝对安全。&lt;/p&gt;

              &lt;h2&gt;10. 您的权利&lt;/h2&gt;
              &lt;p&gt;根据适用法律，您可以请求：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;访问我们持有的关于您的某些信息&lt;/li&gt;
                &lt;li&gt;更正不准确的信息&lt;/li&gt;
                &lt;li&gt;请求删除某些信息&lt;/li&gt;
                &lt;li&gt;在同意是法律依据的情况下撤回同意&lt;/li&gt;
                &lt;li&gt;反对某些处理活动&lt;/li&gt;
              &lt;/ul&gt;
              &lt;p&gt;如需提出请求，请联系：support@xiaoheiwan.com&lt;/p&gt;

              &lt;h2&gt;11. 未成年人&lt;/h2&gt;
              &lt;p&gt;本网站不面向适用法律规定的无法独立使用所提供服务的儿童或未成年人。如果我们发现违反适用法律收集了信息，我们可能会删除该信息并拒绝服务。&lt;/p&gt;

              &lt;h2&gt;12. 第三方服务&lt;/h2&gt;
              &lt;p&gt;本网站可能依赖第三方服务或链接到第三方网站。我们不对第三方的隐私做法负责。&lt;/p&gt;

              &lt;h2&gt;13. 政策变更&lt;/h2&gt;
              &lt;p&gt;我们可能随时更新本隐私政策。更新版本在本页面发布时生效，"最后更新"日期会相应修订。&lt;/p&gt;

              &lt;h2&gt;14. 联系方式&lt;/h2&gt;
              &lt;p&gt;如果您对本隐私政策有疑问，请联系：&lt;/p&gt;
              &lt;p&gt;support@xiaoheiwan.com&lt;/p&gt;
            &lt;/&gt;
          ) : (
            &lt;&gt;
              &lt;h1&gt;Privacy Policy&lt;/h1&gt;
              &lt;p className="text-muted-foreground"&gt;Last updated: March 2025&lt;/p&gt;

              &lt;p&gt;Welcome to Xiaoheiwan ("Website", "we", "us", or "our"). This Privacy Policy explains how we collect, use, store, and disclose information when you access or use our website, products, or services.&lt;/p&gt;
              &lt;p&gt;By using this Website, you acknowledge that you have read and understood this Privacy Policy.&lt;/p&gt;

              &lt;h2&gt;1. Scope&lt;/h2&gt;
              &lt;p&gt;This Privacy Policy applies to information collected through:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;our website;&lt;/li&gt;
                &lt;li&gt;checkout pages;&lt;/li&gt;
                &lt;li&gt;customer support communications;&lt;/li&gt;
                &lt;li&gt;order and delivery processes;&lt;/li&gt;
                &lt;li&gt;analytics, security, and fraud-prevention systems connected to the Website.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;2. Information We Collect&lt;/h2&gt;
              &lt;h3&gt;2.1 Information you provide directly&lt;/h3&gt;
              &lt;ul&gt;
                &lt;li&gt;email address;&lt;/li&gt;
                &lt;li&gt;username, account identifier, or other service-related information you submit for order fulfillment;&lt;/li&gt;
                &lt;li&gt;billing-related details you provide during checkout;&lt;/li&gt;
                &lt;li&gt;messages you send to support.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h3&gt;2.2 Information collected automatically&lt;/h3&gt;
              &lt;ul&gt;
                &lt;li&gt;IP address;&lt;/li&gt;
                &lt;li&gt;browser type and version;&lt;/li&gt;
                &lt;li&gt;device information;&lt;/li&gt;
                &lt;li&gt;operating system;&lt;/li&gt;
                &lt;li&gt;pages visited;&lt;/li&gt;
                &lt;li&gt;referral source;&lt;/li&gt;
                &lt;li&gt;time spent on pages;&lt;/li&gt;
                &lt;li&gt;cookies and similar tracking technologies;&lt;/li&gt;
                &lt;li&gt;logs used for security, fraud prevention, and troubleshooting.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h3&gt;2.3 Information from third parties&lt;/h3&gt;
              &lt;p&gt;We may receive limited order, payment status, fraud-risk, or technical data from payment processors, hosting providers, analytics providers, email service providers, and anti-abuse vendors.&lt;/p&gt;

              &lt;h2&gt;3. How We Use Information&lt;/h2&gt;
              &lt;p&gt;We may use collected information to:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;process and fulfill orders;&lt;/li&gt;
                &lt;li&gt;deliver digital products or service-related information;&lt;/li&gt;
                &lt;li&gt;verify transactions and reduce fraud or abuse;&lt;/li&gt;
                &lt;li&gt;provide customer support;&lt;/li&gt;
                &lt;li&gt;maintain service security and technical stability;&lt;/li&gt;
                &lt;li&gt;improve website functionality and user experience;&lt;/li&gt;
                &lt;li&gt;send order notifications, service notices, or compliance-related communications;&lt;/li&gt;
                &lt;li&gt;enforce our Terms of Service and other policies;&lt;/li&gt;
                &lt;li&gt;comply with applicable legal obligations.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;4. Legal Basis / User Responsibility&lt;/h2&gt;
              &lt;p&gt;You are responsible for ensuring that your access to and use of the Website is lawful in your jurisdiction. We reserve the right to refuse service, request verification, suspend delivery, or cancel orders for legal, compliance, fraud, sanctions, or risk-control reasons.&lt;/p&gt;

              &lt;h2&gt;5. Cookies and Tracking Technologies&lt;/h2&gt;
              &lt;p&gt;We may use cookies, local storage, server logs, and similar technologies to:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;keep the Website functioning properly;&lt;/li&gt;
                &lt;li&gt;remember user preferences;&lt;/li&gt;
                &lt;li&gt;analyze traffic and usage;&lt;/li&gt;
                &lt;li&gt;detect abuse, malicious requests, or suspicious behavior.&lt;/li&gt;
              &lt;/ul&gt;
              &lt;p&gt;You may manage cookies through your browser settings, but disabling cookies may affect certain Website functions.&lt;/p&gt;

              &lt;h2&gt;6. Sharing of Information&lt;/h2&gt;
              &lt;p&gt;We do not sell personal information as a standalone business model. We may share limited information with:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;payment processors;&lt;/li&gt;
                &lt;li&gt;hosting and infrastructure providers;&lt;/li&gt;
                &lt;li&gt;analytics and security vendors;&lt;/li&gt;
                &lt;li&gt;email delivery providers;&lt;/li&gt;
                &lt;li&gt;legal or regulatory authorities when required;&lt;/li&gt;
                &lt;li&gt;professional advisers where reasonably necessary.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;7. Data Retention&lt;/h2&gt;
              &lt;p&gt;We retain information only for as long as reasonably necessary for: order fulfillment, dispute handling, fraud prevention, recordkeeping, legal, tax, accounting, or compliance purposes.&lt;/p&gt;

              &lt;h2&gt;8. Cross-Border Processing&lt;/h2&gt;
              &lt;p&gt;Depending on infrastructure, service providers, and your location, your information may be processed or stored in countries or regions different from your own. By using the Website, you understand and acknowledge that cross-border processing may occur.&lt;/p&gt;

              &lt;h2&gt;9. Data Security&lt;/h2&gt;
              &lt;p&gt;We take reasonable administrative, technical, and organizational measures to protect information against unauthorized access, loss, misuse, alteration, or disclosure. However, no system is completely secure, and we do not guarantee absolute security.&lt;/p&gt;

              &lt;h2&gt;10. Your Rights&lt;/h2&gt;
              &lt;p&gt;Subject to applicable law, you may request to:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;access certain information we hold about you;&lt;/li&gt;
                &lt;li&gt;correct inaccurate information;&lt;/li&gt;
                &lt;li&gt;request deletion of certain information;&lt;/li&gt;
                &lt;li&gt;withdraw consent where consent is the legal basis;&lt;/li&gt;
                &lt;li&gt;object to certain processing activities.&lt;/li&gt;
              &lt;/ul&gt;
              &lt;p&gt;To make a request, contact us at: support@xiaoheiwan.com&lt;/p&gt;

              &lt;h2&gt;11. Minors&lt;/h2&gt;
              &lt;p&gt;This Website is not directed to children or minors under the age required by applicable law to independently use the services offered. If we become aware that information has been collected in violation of applicable law, we may delete it and refuse service.&lt;/p&gt;

              &lt;h2&gt;12. Third-Party Services&lt;/h2&gt;
              &lt;p&gt;The Website may rely on third-party services or link to third-party websites. We are not responsible for the privacy practices of third parties.&lt;/p&gt;

              &lt;h2&gt;13. Changes to This Policy&lt;/h2&gt;
              &lt;p&gt;We may update this Privacy Policy at any time. The updated version becomes effective when posted on this page, with the "Last updated" date revised accordingly.&lt;/p&gt;

              &lt;h2&gt;14. Contact&lt;/h2&gt;
              &lt;p&gt;If you have questions about this Privacy Policy, contact:&lt;/p&gt;
              &lt;p&gt;support@xiaoheiwan.com&lt;/p&gt;
            &lt;/&gt;
          )}
        &lt;/article&gt;
      &lt;/div&gt;
    &lt;/main&gt;
  )
}
