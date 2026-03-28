import { LegalPageLayout } from "@/components/legal-page-layout"

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title={{ zh: "隐私政策", en: "Privacy Policy" }}
      lastUpdated="2025年3月 / March 2025"
      renderContent={(lang) => lang === "zh" ? (
        <>
          <p>欢迎访问小黑丸（"本网站"、"我们"）。本隐私政策说明了当您访问或使用本网站、产品或服务时，我们如何收集、使用、存储和披露信息。</p>
          <p>使用本网站即表示您已阅读并理解本隐私政策。</p>

          <h2>1. 适用范围</h2>
          <p>本隐私政策适用于通过以下方式收集的信息：本网站、结账页面、客户支持通信、订单和交付流程、与本网站相关的分析、安全和防欺诈系统。</p>

          <h2>2. 我们收集的信息</h2>
          <p><strong>您直接提供的信息：</strong>电子邮件地址、用户名或账户标识符、账单相关详细信息、客服消息。</p>
          <p><strong>自动收集的信息：</strong>IP 地址、浏览器类型、设备信息、操作系统、访问页面、Cookie 和日志。</p>
          <p><strong>来自第三方的信息：</strong>支付处理商、托管提供商、分析提供商提供的有限数据。</p>

          <h2>3. 信息使用方式</h2>
          <p>处理订单、交付产品、验证交易、提供客户支持、维护安全、改进体验、发送通知、执行政策、遵守法律。</p>

          <h2>4. Cookie 和跟踪技术</h2>
          <p>我们使用 Cookie 保持网站运行、记住偏好、分析流量、检测滥用。您可通过浏览器设置管理 Cookie。</p>

          <h2>5. 信息共享</h2>
          <p>我们不出售个人信息。我们可能与支付处理商、托管提供商、分析供应商、法律机构共享有限信息。</p>

          <h2>6. 数据保留与安全</h2>
          <p>我们仅在合理需要的时间内保留信息，并采取合理措施保护数据安全，但无法保证绝对安全。</p>

          <h2>7. 您的权利</h2>
          <p>根据适用法律，您可请求访问、更正、删除信息，或撤回同意。</p>
        </>
      ) : (
        <>
          <p>Welcome to Xiaoheiwan. This Privacy Policy explains how we collect, use, store, and disclose information when you use our website, products, or services.</p>
          <p>By using this Website, you acknowledge that you have read and understood this Privacy Policy.</p>

          <h2>1. Scope</h2>
          <p>This Privacy Policy applies to information collected through: our website, checkout pages, customer support, order processes, and analytics systems.</p>

          <h2>2. Information We Collect</h2>
          <p><strong>Information you provide:</strong> Email address, username or account identifier, billing details, support messages.</p>
          <p><strong>Automatically collected:</strong> IP address, browser type, device info, OS, pages visited, cookies and logs.</p>
          <p><strong>From third parties:</strong> Limited data from payment processors, hosting providers, analytics providers.</p>

          <h2>3. How We Use Information</h2>
          <p>Process orders, deliver products, verify transactions, provide support, maintain security, improve experience, send notifications, enforce policies, comply with laws.</p>

          <h2>4. Cookies and Tracking</h2>
          <p>We use cookies to keep the site functioning, remember preferences, analyze traffic, detect abuse. You may manage cookies through browser settings.</p>

          <h2>5. Sharing of Information</h2>
          <p>We do not sell personal information. We may share limited info with payment processors, hosting providers, analytics vendors, legal authorities.</p>

          <h2>6. Data Retention and Security</h2>
          <p>We retain information only as long as reasonably necessary and take reasonable measures to protect data, but cannot guarantee absolute security.</p>

          <h2>7. Your Rights</h2>
          <p>Subject to applicable law, you may request access, correction, deletion of information, or withdraw consent.</p>
        </>
      )}
    />
  )
}
