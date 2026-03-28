import { LegalPageLayout } from "@/components/legal-page-layout"

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title={{ zh: "退款政策", en: "Refund Policy" }}
      lastUpdated="2025年3月 / March 2025"
      renderContent={(lang) => lang === "zh" ? (
        <>
          <h2>1. 数字商品性质</h2>
          <p>本网站销售的产品为数字商品（激活码、会员服务等）。由于数字商品的特殊性，一经交付即视为已使用，通常不支持退款。</p>

          <h2>2. 不予退款的情况</h2>
          <ul>
            <li>激活码已被使用或查看</li>
            <li>会员服务已开通</li>
            <li>订单已完成交付</li>
            <li>因用户操作错误导致的问题</li>
            <li>违反使用条款的订单</li>
          </ul>

          <h2>3. 可申请退款的情况</h2>
          <ul>
            <li>系统故障导致重复扣款</li>
            <li>商品无法正常使用且无法解决</li>
            <li>未交付且取消订单</li>
          </ul>

          <h2>4. 退款流程</h2>
          <p>如需申请退款，请联系我们并提供订单号和具体情况说明。我们将在3个工作日内回复。</p>
        </>
      ) : (
        <>
          <h2>1. Nature of Digital Goods</h2>
          <p>Products sold on this website are digital goods (activation codes, membership services, etc.). Due to their nature, digital goods are considered used once delivered and are generally non-refundable.</p>

          <h2>2. Non-Refundable Cases</h2>
          <ul>
            <li>Activation code has been used or viewed</li>
            <li>Membership service has been activated</li>
            <li>Order has been delivered</li>
            <li>Issues caused by user error</li>
            <li>Orders violating terms of use</li>
          </ul>

          <h2>3. Refundable Cases</h2>
          <ul>
            <li>Duplicate charges due to system error</li>
            <li>Product cannot be used and issue cannot be resolved</li>
            <li>Undelivered order cancellation</li>
          </ul>

          <h2>4. Refund Process</h2>
          <p>To request a refund, please contact us with your order number and details. We will respond within 3 business days.</p>
        </>
      )}
    />
  )
}
