"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function RefundPolicyPage() {
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
              &lt;h1&gt;退款政策&lt;/h1&gt;
              &lt;p className="text-muted-foreground"&gt;最后更新：2025年3月&lt;/p&gt;

              &lt;p&gt;本退款政策规定了通过小黑丸购买产品的退款资格。&lt;/p&gt;
              &lt;p&gt;下单即表示您同意本退款政策。&lt;/p&gt;

              &lt;h2&gt;1. 产品的数字性质&lt;/h2&gt;
              &lt;p&gt;本网站提供的大多数产品或服务是数字的、电子交付的、时间敏感的或一旦履行即不可逆转的。由于这种性质，并非所有购买都可退款。&lt;/p&gt;

              &lt;h2&gt;2. 不可退款情况&lt;/h2&gt;
              &lt;p&gt;除非适用法律另有规定，以下情况通常不予退款：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;数字产品、代码、凭证、访问数据或服务信息已交付&lt;/li&gt;
                &lt;li&gt;客户提供了错误的电子邮件、用户名、标识符或订单信息&lt;/li&gt;
                &lt;li&gt;客户因当地限制、平台政策、设备环境、网络条件或第三方账户问题无法使用产品&lt;/li&gt;
                &lt;li&gt;客户在交付后改变主意&lt;/li&gt;
                &lt;li&gt;订单因滥用、政策违规或禁止使用而被标记&lt;/li&gt;
                &lt;li&gt;客户未遵循说明或兼容性要求&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;3. 可退款情况&lt;/h2&gt;
              &lt;p&gt;我们可能自行决定在以下情况下提供全额或部分退款：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;订单完全无法履行&lt;/li&gt;
                &lt;li&gt;经核实的重复付款&lt;/li&gt;
                &lt;li&gt;由于我们的错误交付了错误的产品&lt;/li&gt;
                &lt;li&gt;由于我们确认的运营故障导致交付失败且未完成可用履行&lt;/li&gt;
                &lt;li&gt;适用法律要求退款&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;4. 风险审查和拒绝服务权&lt;/h2&gt;
              &lt;p&gt;我们保留在履行前因欺诈、制裁、合规、司法管辖或滥用问题而暂停、取消或拒绝订单的权利。在这种情况下，我们可能会在审查后全额或部分退款。&lt;/p&gt;

              &lt;h2&gt;5. 退款申请窗口&lt;/h2&gt;
              &lt;p&gt;如果您认为您的订单符合审查条件，您必须在订单时间戳后 24 小时内联系我们，并提供：&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;订单号&lt;/li&gt;
                &lt;li&gt;购买邮箱&lt;/li&gt;
                &lt;li&gt;相关账户或标识符&lt;/li&gt;
                &lt;li&gt;问题的清晰描述&lt;/li&gt;
                &lt;li&gt;适用时的截图或证据&lt;/li&gt;
              &lt;/ul&gt;
              &lt;p&gt;逾期申请可能被拒绝。&lt;/p&gt;

              &lt;h2&gt;6. 拒付和支付争议&lt;/h2&gt;
              &lt;p&gt;如果您在未首先联系我们审查的情况下发起拒付或支付争议，我们保留对争议提出异议、暂停相关服务、阻止未来购买以及保存相关记录的权利。&lt;/p&gt;

              &lt;h2&gt;7. 退款方式和时间&lt;/h2&gt;
              &lt;p&gt;批准的退款通常在可能的情况下通过原始付款方式返还。处理时间取决于支付处理商、银行或金融中介，可能会有所不同。&lt;/p&gt;

              &lt;h2&gt;8. 部分退款&lt;/h2&gt;
              &lt;p&gt;在涉及部分履行、部分交付、手动处理或第三方费用的情况下，在法律允许的范围内，我们可能会发放部分退款而非全额退款。&lt;/p&gt;

              &lt;h2&gt;9. 联系方式&lt;/h2&gt;
              &lt;p&gt;要申请退款审查，请联系：support@xiaoheiwan.com&lt;/p&gt;
            &lt;/&gt;
          ) : (
            &lt;&gt;
              &lt;h1&gt;Refund Policy&lt;/h1&gt;
              &lt;p className="text-muted-foreground"&gt;Last updated: March 2025&lt;/p&gt;

              &lt;p&gt;This Refund Policy governs refund eligibility for purchases made through Xiaoheiwan.&lt;/p&gt;
              &lt;p&gt;By placing an order, you agree to this Refund Policy.&lt;/p&gt;

              &lt;h2&gt;1. Digital Nature of Products&lt;/h2&gt;
              &lt;p&gt;Most products or services offered through the Website are digital, electronically delivered, time-sensitive, or irreversible once fulfilled. Because of this nature, not all purchases are refundable.&lt;/p&gt;

              &lt;h2&gt;2. Non-Refundable Situations&lt;/h2&gt;
              &lt;p&gt;Unless otherwise required by applicable law, refunds will generally not be provided where:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;the digital product, code, credential, access data, or service information has already been delivered;&lt;/li&gt;
                &lt;li&gt;the customer provided incorrect email, username, identifier, or order information;&lt;/li&gt;
                &lt;li&gt;the customer is unable to use the product due to local restrictions, platform policy, device environment, network conditions, or third-party account issues;&lt;/li&gt;
                &lt;li&gt;the customer changes their mind after delivery;&lt;/li&gt;
                &lt;li&gt;the order is flagged for abuse, policy violation, or prohibited use;&lt;/li&gt;
                &lt;li&gt;the customer fails to follow stated instructions or compatibility requirements.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;3. Refundable Situations&lt;/h2&gt;
              &lt;p&gt;We may, at our discretion, provide a full or partial refund where:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;the order cannot be fulfilled at all;&lt;/li&gt;
                &lt;li&gt;duplicate payment is verified;&lt;/li&gt;
                &lt;li&gt;the wrong product was delivered due to our error;&lt;/li&gt;
                &lt;li&gt;delivery failed due to our confirmed operational fault and no usable fulfillment was completed;&lt;/li&gt;
                &lt;li&gt;a refund is otherwise required by applicable law.&lt;/li&gt;
              &lt;/ul&gt;

              &lt;h2&gt;4. Risk Review and Right to Refuse Service&lt;/h2&gt;
              &lt;p&gt;We reserve the right to hold, cancel, or refuse orders before fulfillment where fraud, sanctions, compliance, jurisdiction, or abuse concerns arise. In such cases, we may issue a refund in full or in part after review.&lt;/p&gt;

              &lt;h2&gt;5. Refund Request Window&lt;/h2&gt;
              &lt;p&gt;If you believe your order is eligible for review, you must contact us within 24 hours of the order timestamp and provide:&lt;/p&gt;
              &lt;ul&gt;
                &lt;li&gt;order number;&lt;/li&gt;
                &lt;li&gt;purchase email;&lt;/li&gt;
                &lt;li&gt;relevant account or identifier;&lt;/li&gt;
                &lt;li&gt;a clear description of the issue;&lt;/li&gt;
                &lt;li&gt;supporting screenshots or evidence where applicable.&lt;/li&gt;
              &lt;/ul&gt;
              &lt;p&gt;Late claims may be rejected.&lt;/p&gt;

              &lt;h2&gt;6. Chargebacks and Payment Disputes&lt;/h2&gt;
              &lt;p&gt;If you initiate a chargeback or payment dispute without first contacting us for review, we reserve the right to contest the dispute, suspend related service, block future purchases, and preserve relevant records.&lt;/p&gt;

              &lt;h2&gt;7. Refund Method and Timing&lt;/h2&gt;
              &lt;p&gt;Approved refunds are generally returned through the original payment method where possible. Processing time depends on the payment processor, bank, or financial intermediary and may vary.&lt;/p&gt;

              &lt;h2&gt;8. Partial Refunds&lt;/h2&gt;
              &lt;p&gt;Where partial performance, partial delivery, manual handling, or third-party fees are involved, we may issue a partial refund rather than a full refund, to the extent permitted by law.&lt;/p&gt;

              &lt;h2&gt;9. Contact&lt;/h2&gt;
              &lt;p&gt;To request a refund review: support@xiaoheiwan.com&lt;/p&gt;
            &lt;/&gt;
          )}
        &lt;/article&gt;
      &lt;/div&gt;
    &lt;/main&gt;
  )
}
