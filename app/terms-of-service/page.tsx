import { LegalPageLayout } from "@/components/legal-page-layout"

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title={{ zh: "服务条款", en: "Terms of Service" }}
      lastUpdated="2025年3月 / March 2025"
      renderContent={(lang) => lang === "zh" ? (
        <>
          <p>本服务条款规定了您访问和使用小黑丸及相关产品、内容和服务的条件。访问或使用本网站即表示您同意受这些条款约束。</p>

          <h2>1. 资格</h2>
          <p>您声明并保证：具有法律行为能力、使用合法、信息准确、不用于非法目的。</p>

          <h2>2. 受限司法管辖区</h2>
          <p>本网站仅面向可合法购买和使用所提供产品的用户。您应自行确定是否符合当地法律。</p>

          <h2>3. 订单与付款</h2>
          <p>下单即表示同意支付显示的价格。所有价格均为最终价格。付款后订单开始处理。</p>

          <h2>4. 交付</h2>
          <p>数字产品通常在付款确认后自动交付。手工发货产品在24小时内处理。</p>

          <h2>5. 退款政策</h2>
          <p>数字商品一经交付不可退款，除非法律另有规定。详见退款政策页面。</p>

          <h2>6. 知识产权</h2>
          <p>本网站内容受版权保护。未经授权不得复制或分发。</p>

          <h2>7. 免责声明</h2>
          <p>服务"按原样"提供，不提供任何明示或暗示的保证。</p>

          <h2>8. 责任限制</h2>
          <p>我们对任何间接、附带、特殊或后果性损害不承担责任。</p>

          <h2>9. 条款修改</h2>
          <p>我们可随时修改条款，继续使用即表示接受修改。</p>
        </>
      ) : (
        <>
          <p>These Terms of Service govern your access to and use of Xiaoheiwan and related products, content, and services. By using this Website, you agree to be bound by these Terms.</p>

          <h2>1. Eligibility</h2>
          <p>You represent and warrant that: you have legal capacity, your use is lawful, your information is accurate, and you will not use for illegal purposes.</p>

          <h2>2. Restricted Jurisdictions</h2>
          <p>This Website is intended only for users in jurisdictions where the products can be legally purchased and used. You are responsible for compliance with local laws.</p>

          <h2>3. Orders and Payment</h2>
          <p>Placing an order means you agree to pay the displayed price. All prices are final. Orders are processed after payment confirmation.</p>

          <h2>4. Delivery</h2>
          <p>Digital products are typically delivered automatically after payment. Manual delivery products are processed within 24 hours.</p>

          <h2>5. Refund Policy</h2>
          <p>Digital goods are non-refundable once delivered, unless required by law. See Refund Policy page for details.</p>

          <h2>6. Intellectual Property</h2>
          <p>Website content is protected by copyright. Unauthorized copying or distribution is prohibited.</p>

          <h2>7. Disclaimer</h2>
          <p>Services are provided "as is" without any express or implied warranties.</p>

          <h2>8. Limitation of Liability</h2>
          <p>We are not liable for any indirect, incidental, special, or consequential damages.</p>

          <h2>9. Modifications</h2>
          <p>We may modify these Terms at any time. Continued use constitutes acceptance of modifications.</p>
        </>
      )}
    />
  )
}
