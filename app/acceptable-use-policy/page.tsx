import { LegalPageLayout } from "@/components/legal-page-layout"

export default function AcceptableUsePolicyPage() {
  return (
    <LegalPageLayout
      title={{ zh: "可接受使用政策", en: "Acceptable Use Policy" }}
      lastUpdated="2025年3月 / March 2025"
      renderContent={(lang) => lang === "zh" ? (
        <>
          <p>本可接受使用政策是小黑丸服务条款的一部分。您不得将本网站或通过本网站获得的任何产品或服务用于以下目的：</p>

          <ul>
            <li>欺诈、欺骗、身份滥用、冒充或非法转售</li>
            <li>洗钱、制裁规避、恐怖融资或其他非法金融活动</li>
            <li>网络钓鱼、垃圾邮件、恶意软件、机器人滥用或未经授权的自动化</li>
            <li>涉及未成年人的色情内容、人身剥削、人口贩卖或任何非法或滥用内容</li>
            <li>非法的赌博、诈骗运营或其他被禁止或高风险行业</li>
            <li>骚扰、跟踪、威胁、基于仇恨的滥用或侵犯他人权利</li>
            <li>试图违法规避平台规则、安全系统或司法管辖限制</li>
          </ul>

          <p>我们可能调查涉嫌违规行为，并可能暂停访问、取消订单、拒绝支持或配合当局的合法请求。</p>
        </>
      ) : (
        <>
          <p>This Acceptable Use Policy forms part of the Terms of Service. You may not use the Website, or any product or service obtained through it, in connection with:</p>

          <ul>
            <li>Fraud, deception, identity misuse, impersonation, or unlawful resale</li>
            <li>Money laundering, sanctions evasion, terrorist financing, or other illegal financial activity</li>
            <li>Phishing, spam, malware, bot abuse, or unauthorized automation</li>
            <li>Pornography involving minors, human exploitation, trafficking, or any unlawful content</li>
            <li>Gambling, scam operations, or other prohibited or high-risk industries where unlawful</li>
            <li>Harassment, stalking, threats, hate-based abuse, or violations of others rights</li>
            <li>Attempts to evade platform rules, security systems, or jurisdictional restrictions</li>
          </ul>

          <p>We may investigate suspected violations and may suspend access, cancel orders, refuse support, or cooperate with lawful requests from authorities.</p>
        </>
      )}
    />
  )
}
