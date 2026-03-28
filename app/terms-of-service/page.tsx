"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TermsOfServicePage() {
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
              &lt;h1&gt;服务条款&lt;/h1&gt;
              &lt;p className="text-muted-foreground"&gt;最后更新：2025年3月&lt;/p&gt;

              &lt;p&gt;本服务条款（"条款"）规定了您访问和使用小黑丸以及任何相关产品、内容和服务的条件。&lt;/p&gt;
              &lt;p&gt;访问或使用本网站即表示您同意受这些条款的约束。如果您不同意，请勿使用本网站。&lt;/p&gt;

              &lt;h2&gt;1. 资格&lt;/h2&gt;
              &lt;p&gt;您声明并保证：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;您具有签订本条款的法律行为能力&lt;/li&gt;
                &lt;li&gt;您对本网站的使用在您所在的司法管辖区是合法的&lt;/li&gt;
                &lt;li&gt;您提交的信息是准确的且不具有误导性&lt;/li&gt;
                &lt;li&gt;您不会将本网站用于非法、欺诈、滥用或禁止的目的&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;2. 受限司法管辖区和合规&lt;/h2&gt;
              &lt;p&gt;本网站仅面向可以合法购买、接收和使用所提供产品或服务的司法管辖区的用户。&lt;/p&gt;
              &lt;p&gt;您应自行负责确定您的访问、购买和使用是否符合当地法律、法规、制裁、平台规则和服务提供商限制。&lt;/p&gt;
              &lt;p&gt;我们保留在发现法律、合规、制裁、欺诈、滥用或运营风险时，自行决定拒绝服务、阻止访问、取消订单、暂停履行、请求身份或风险验证或退款的权利。&lt;/p&gt;

              &lt;h2&gt;3. 服务性质&lt;/h2&gt;
              &lt;p&gt;本网站提供数字商品、数字访问、数字交付服务、信息相关服务或相关履行支持，视可用性、技术条件和合规审查而定。&lt;/p&gt;
              &lt;p&gt;我们不保证在第三方平台规则、账户状态、地区限制、技术限制或不可抗力影响交付或可用性的情况下，服务会不间断、与每个用户环境兼容或持续可访问。&lt;/p&gt;

              &lt;h2&gt;4. 订单&lt;/h2&gt;
              &lt;p&gt;通过本网站提交的订单仅为订单请求。我们可能因以下原因接受、拒绝、延迟、暂停或取消任何订单：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;风险控制审查&lt;/li&gt;
                &lt;li&gt;疑似欺诈或滥用&lt;/li&gt;
                &lt;li&gt;信息不准确或不完整&lt;/li&gt;
                &lt;li&gt;受限地点或司法管辖区问题&lt;/li&gt;
                &lt;li&gt;服务不可用&lt;/li&gt;
                &lt;li&gt;制裁或法律问题&lt;/li&gt;
                &lt;li&gt;运营错误&lt;/li&gt;
                &lt;li&gt;定价或列表错误&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;5. 定价和支付&lt;/h2&gt;
              &lt;p&gt;本网站上显示的所有价格可能会随时更改，除非已为已接受的订单确认。&lt;/p&gt;
              &lt;p&gt;付款必须通过我们提供的方式完成。您授权我们和我们的支付提供商处理交易和相关验证步骤。&lt;/p&gt;
              &lt;p&gt;我们对支付处理商、银行、发卡机构、风险系统或第三方中介导致的延迟、冻结、撤销或拒绝不承担责任。&lt;/p&gt;

              &lt;h2&gt;6. 交付&lt;/h2&gt;
              &lt;p&gt;数字交付可能通过电子邮件、用户仪表板、屏幕显示、API 触发响应、账户消息或本网站指定的其他电子方式进行。&lt;/p&gt;
              &lt;p&gt;本网站上显示的交付时间仅为估计值。由于安全检查、提供商问题、技术中断或第三方依赖，可能会出现延迟。&lt;/p&gt;
              &lt;p&gt;当相关数字内容、凭证、代码、激活数据、访问数据或服务相关信息已发送、显示、提供或以其他方式提供给客户提供的联系方式或标识符时，数字订单即视为已交付。&lt;/p&gt;

              &lt;h2&gt;7. 用户责任&lt;/h2&gt;
              &lt;p&gt;您同意不会：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;将本网站或购买的商品用于非法目的&lt;/li&gt;
                &lt;li&gt;尝试欺诈、滥用、违法转售、冒充或规避限制&lt;/li&gt;
                &lt;li&gt;提交虚假的账单、账户或身份信息&lt;/li&gt;
                &lt;li&gt;逆向工程、抓取、攻击、超载或干扰本网站&lt;/li&gt;
                &lt;li&gt;将本网站用于垃圾邮件、诈骗、制裁规避、洗钱、滥用自动化或禁止行业&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;8. 不保证第三方平台结果&lt;/h2&gt;
              &lt;p&gt;如果任何产品或服务涉及第三方平台、账户、数字生态系统或外部服务，我们不控制这些第三方，也不保证：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;持续可用性&lt;/li&gt;
                &lt;li&gt;政策稳定性&lt;/li&gt;
                &lt;li&gt;账户接受&lt;/li&gt;
                &lt;li&gt;未来兼容性&lt;/li&gt;
                &lt;li&gt;平台方批准&lt;/li&gt;
                &lt;li&gt;免于限制、审查、暂停或政策执行&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;9. 知识产权&lt;/h2&gt;
              &lt;p&gt;所有网站内容、品牌、设计、文本、软件逻辑、布局和非用户材料均由我们拥有或许可给我们，除非另有说明。未经授权，您不得复制、再现、重新发布、分发或利用网站材料。&lt;/p&gt;

              &lt;h2&gt;10. 免责声明&lt;/h2&gt;
              &lt;p&gt;在适用法律允许的最大范围内，本网站及所有产品和服务均按"现状"和"可用"基础提供，不提供任何明示或暗示的保证。&lt;/p&gt;
              &lt;p&gt;我们不保证适销性、特定用途适用性、可用性、不侵权和不间断运行。&lt;/p&gt;

              &lt;h2&gt;11. 责任限制&lt;/h2&gt;
              &lt;p&gt;在法律允许的最大范围内，我们不对任何间接、附带、特殊、后果性、惩罚性或惩戒性损害承担责任，包括利润损失、业务损失、数据丢失、机会损失、账户限制、第三方执行或服务中断。&lt;/p&gt;
              &lt;p&gt;在无法排除责任的情况下，我们的总累计责任不应超过您为产生索赔的相关订单实际支付的金额。&lt;/p&gt;

              &lt;h2&gt;12. 赔偿&lt;/h2&gt;
              &lt;p&gt;您同意就以下情况产生的索赔、损失、责任、损害、费用和开支，对小黑丸、其运营商、关联方、服务提供商和人员进行赔偿并使其免受损害：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;您违反本条款&lt;/li&gt;
                &lt;li&gt;您非法使用本网站&lt;/li&gt;
                &lt;li&gt;您滥用交付的产品或服务&lt;/li&gt;
                &lt;li&gt;您违反任何第三方权利、平台规则或适用法律&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;13. 暂停和终止&lt;/h2&gt;
              &lt;p&gt;如果我们认为您违反了本条款或造成了法律、欺诈、滥用、声誉或运营风险，我们可能随时暂停或终止您对本网站的访问或取消订单，恕不另行通知。&lt;/p&gt;

              &lt;h2&gt;14. 管辖法律和争议解决&lt;/h2&gt;
              &lt;p&gt;本条款应受适用法律管辖，不考虑法律冲突原则。&lt;/p&gt;
              &lt;p&gt;因本条款、本网站或任何订单引起的或与之相关的任何争议，应由相关法院或争议解决机制解决，除非适用法律另有规定。&lt;/p&gt;

              &lt;h2&gt;15. 条款变更&lt;/h2&gt;
              &lt;p&gt;我们可能随时更新本条款。在更新的条款发布后继续使用本网站即表示接受修订后的条款。&lt;/p&gt;

              &lt;h2&gt;16. 联系方式&lt;/h2&gt;
              &lt;p&gt;如有法律或支持咨询：support@xiaoheiwan.com&lt;/p&gt;
            &lt;/&gt;
          ) : (
            &lt;&gt;
              &lt;h1&gt;Terms of Service&lt;/h1&gt;
              &lt;p className="text-muted-foreground"&gt;Last updated: March 2025&lt;/p&gt;

              &lt;p&gt;These Terms of Service ("Terms") govern your access to and use of Xiaoheiwan and any related products, content, and services.&lt;/p&gt;
              &lt;p&gt;By accessing or using the Website, you agree to be bound by these Terms. If you do not agree, do not use the Website.&lt;/p&gt;

              &lt;h2&gt;1. Eligibility&lt;/h2&gt;
              &lt;p&gt;You represent and warrant that:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;you have the legal capacity to enter into these Terms;&lt;/li&gt;
                &lt;li&gt;your use of the Website is lawful in your jurisdiction;&lt;/li&gt;
                &lt;li&gt;the information you submit is accurate and not misleading;&lt;/li&gt;
                &lt;li&gt;you are not using the Website for unlawful, fraudulent, abusive, or prohibited purposes.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;2. Restricted Jurisdictions and Compliance&lt;/h2&gt;
              &lt;p&gt;The Website is intended only for users in jurisdictions where the offered products or services may be lawfully purchased, received, and used.&lt;/p&gt;
              &lt;p&gt;You are solely responsible for determining whether your access, purchase, and use comply with local laws, regulations, sanctions, platform rules, and service-provider restrictions.&lt;/p&gt;
              &lt;p&gt;We reserve the right to refuse service, block access, cancel orders, hold fulfillment, request identity or risk verification, or issue refunds at our sole discretion where legal, compliance, sanctions, fraud, abuse, or operational risks are identified.&lt;/p&gt;

              &lt;h2&gt;3. Nature of Services&lt;/h2&gt;
              &lt;p&gt;The Website offers digital goods, digital access, digital delivery services, information-related services, or related fulfillment support, subject to availability, technical conditions, and compliance review.&lt;/p&gt;
              &lt;p&gt;We do not guarantee uninterrupted availability, compatibility with every user environment, or ongoing access where third-party platform rules, account status, regional restrictions, technical limitations, or force majeure affect delivery or usability.&lt;/p&gt;

              &lt;h2&gt;4. Orders&lt;/h2&gt;
              &lt;p&gt;An order submitted through the Website is only an order request. We may accept, reject, delay, suspend, or cancel any order for reasons including but not limited to:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;risk-control review;&lt;/li&gt;
                &lt;li&gt;suspected fraud or abuse;&lt;/li&gt;
                &lt;li&gt;inaccurate or incomplete information;&lt;/li&gt;
                &lt;li&gt;restricted location or jurisdiction concerns;&lt;/li&gt;
                &lt;li&gt;service unavailability;&lt;/li&gt;
                &lt;li&gt;sanctions or legal concerns;&lt;/li&gt;
                &lt;li&gt;operational errors;&lt;/li&gt;
                &lt;li&gt;pricing or listing mistakes.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;5. Pricing and Payment&lt;/h2&gt;
              &lt;p&gt;All prices displayed on the Website are subject to change without notice unless already confirmed for an accepted order.&lt;/p&gt;
              &lt;p&gt;Payment must be completed through the methods we make available. You authorize us and our payment providers to process the transaction and related verification steps.&lt;/p&gt;
              &lt;p&gt;We are not responsible for delays, holds, reversals, or declines caused by payment processors, banks, card issuers, risk systems, or third-party intermediaries.&lt;/p&gt;

              &lt;h2&gt;6. Delivery&lt;/h2&gt;
              &lt;p&gt;Digital delivery may occur by email, user dashboard, on-screen display, API-triggered response, account message, or other electronic means designated by the Website.&lt;/p&gt;
              &lt;p&gt;Delivery timeframes shown on the Website are estimates only. Delays may occur due to security checks, provider issues, technical interruptions, or third-party dependencies.&lt;/p&gt;
              &lt;p&gt;A digital order may be deemed delivered when the relevant digital content, credentials, code, activation data, access data, or service-related information has been sent, displayed, made available, or otherwise provided to the contact or identifier supplied by the customer.&lt;/p&gt;

              &lt;h2&gt;7. User Responsibilities&lt;/h2&gt;
              &lt;p&gt;You agree that you will not:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;use the Website or purchased items for unlawful purposes;&lt;/li&gt;
                &lt;li&gt;attempt fraud, abuse, resale in violation of law, impersonation, or circumvention of restrictions;&lt;/li&gt;
                &lt;li&gt;submit false billing, account, or identity information;&lt;/li&gt;
                &lt;li&gt;reverse engineer, scrape, attack, overload, or interfere with the Website;&lt;/li&gt;
                &lt;li&gt;use the Website in connection with spam, scams, sanctions evasion, money laundering, abusive automation, or prohibited industries.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;8. No Guarantee of Third-Party Platform Outcome&lt;/h2&gt;
              &lt;p&gt;Where any product or service relates to third-party platforms, accounts, digital ecosystems, or external services, we do not control those third parties and do not guarantee:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;continued availability;&lt;/li&gt;
                &lt;li&gt;policy stability;&lt;/li&gt;
                &lt;li&gt;account acceptance;&lt;/li&gt;
                &lt;li&gt;future compatibility;&lt;/li&gt;
                &lt;li&gt;platform-side approval;&lt;/li&gt;
                &lt;li&gt;immunity from limitation, review, suspension, or policy enforcement.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;9. Intellectual Property&lt;/h2&gt;
              &lt;p&gt;All Website content, branding, design, text, software logic, layouts, and non-user materials are owned by or licensed to us unless otherwise stated. You may not copy, reproduce, republish, distribute, or exploit Website materials without authorization.&lt;/p&gt;

              &lt;h2&gt;10. Disclaimer of Warranties&lt;/h2&gt;
              &lt;p&gt;To the maximum extent permitted by applicable law, the Website and all products and services are provided on an "as is" and "as available" basis without warranties of any kind, express or implied.&lt;/p&gt;
              &lt;p&gt;We disclaim warranties including merchantability, fitness for a particular purpose, availability, non-infringement, and uninterrupted operation.&lt;/p&gt;

              &lt;h2&gt;11. Limitation of Liability&lt;/h2&gt;
              &lt;p&gt;To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, including loss of profits, loss of business, loss of data, loss of opportunity, account restrictions, third-party enforcement, or service interruption.&lt;/p&gt;
              &lt;p&gt;Where liability cannot be excluded, our total aggregate liability shall not exceed the amount actually paid by you for the relevant order giving rise to the claim.&lt;/p&gt;

              &lt;h2&gt;12. Indemnification&lt;/h2&gt;
              &lt;p&gt;You agree to indemnify and hold harmless Xiaoheiwan, its operators, affiliates, service providers, and personnel from claims, losses, liabilities, damages, costs, and expenses arising out of:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;your breach of these Terms;&lt;/li&gt;
                &lt;li&gt;your unlawful use of the Website;&lt;/li&gt;
                &lt;li&gt;your misuse of delivered products or services;&lt;/li&gt;
                &lt;li&gt;your violation of any third-party rights, platform rules, or applicable laws.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;13. Suspension and Termination&lt;/h2&gt;
              &lt;p&gt;We may suspend or terminate your access to the Website or cancel orders at any time, with or without notice, if we believe you have violated these Terms or created legal, fraud, abuse, reputational, or operational risk.&lt;/p&gt;

              &lt;h2&gt;14. Governing Law and Dispute Resolution&lt;/h2&gt;
              &lt;p&gt;These Terms shall be governed by applicable laws, without regard to conflict-of-law principles.&lt;/p&gt;
              &lt;p&gt;Any dispute arising out of or relating to these Terms, the Website, or any order shall be resolved by the relevant courts or dispute-resolution mechanism, unless otherwise required by applicable law.&lt;/p&gt;

              &lt;h2&gt;15. Changes to Terms&lt;/h2&gt;
              &lt;p&gt;We may update these Terms at any time. Continued use of the Website after updated Terms are posted constitutes acceptance of the revised Terms.&lt;/p&gt;

              &lt;h2&gt;16. Contact&lt;/h2&gt;
              &lt;p&gt;For legal or support inquiries: support@xiaoheiwan.com&lt;/p&gt;
            &lt;/&gt;
          )}
        &lt;/article&gt;
      &lt;/div&gt;
    &lt;/main&gt;
  )
}
