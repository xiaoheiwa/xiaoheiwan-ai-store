import { LegalPageLayout } from "@/components/legal-page-layout"

export default function DisclaimerPage() {
  return (
    <LegalPageLayout
      title={{ zh: "免责声明", en: "Disclaimer" }}
      lastUpdated="2025年3月 / March 2025"
    >
      {(lang) => lang === "zh" ? (
        <>
          <p>本网站提供的信息、产品和服务不面向任何在其所在司法管辖区内访问、购买、接收或使用会构成违法的个人或实体。</p>

          <p>本网站上的任何内容均不构成法律、税务、监管、合规或专业建议。</p>

          <h2>用户责任</h2>
          <p>用户应自行负责：</p>
          <ul>
            <li>确定使用本网站在其所在司法管辖区是否合法</li>
            <li>确保其购买和使用符合当地法律、平台规则和服务限制</li>
            <li>为审查和履行提供准确信息</li>
          </ul>

          <h2>权利保留</h2>
          <p>我们保留随时因法律、制裁、合规、欺诈、运营或政策原因限制访问、拒绝交易或拒绝服务的权利。</p>
        </>
      ) : (
        <>
          <p>The information, products, and services on this Website are not directed to persons or entities in any jurisdiction where access, purchase, receipt, or use would be unlawful.</p>

          <p>Nothing on this Website constitutes legal, tax, regulatory, compliance, or professional advice.</p>

          <h2>User Responsibility</h2>
          <p>Users are solely responsible for:</p>
          <ul>
            <li>Determining whether use of the Website is lawful in their jurisdiction</li>
            <li>Ensuring that their purchase and use comply with local law, platform rules, and service restrictions</li>
            <li>Providing accurate information for review and fulfillment</li>
          </ul>

          <h2>Rights Reserved</h2>
          <p>We reserve the right to restrict access, reject transactions, or refuse service at any time for legal, sanctions, compliance, fraud, operational, or policy reasons.</p>
        </>
      )}
    </LegalPageLayout>
  )
}
