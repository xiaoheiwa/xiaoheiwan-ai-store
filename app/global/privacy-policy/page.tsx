import type { Metadata } from "next"
import { PolicyPage } from "../_components/global-store-ui"

export const metadata: Metadata = {
  title: "Privacy Policy | Xiaoheiwan Global Store",
  description: "Privacy policy for Global Store orders and support.",
}

export default function GlobalPrivacyPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="We collect only the information needed to process digital orders, payment checks, delivery, and support."
      sections={[
        {
          title: "Information we collect",
          items: [
            "Order email address, order ID, selected product, selected payment network, and payment status.",
            "Basic technical data such as IP address, country signal, and user agent may be used for fraud prevention.",
            "Support messages may be used to resolve order issues.",
          ],
        },
        {
          title: "How we use information",
          items: [
            "To create orders, verify payment, deliver digital products, and provide order support.",
            "To prevent abuse, duplicate payment claims, wrong-network mistakes, and high-risk activity.",
            "To maintain records required for order management and dispute handling.",
          ],
        },
        {
          title: "Sensitive data",
          items: [
            "We never ask for private keys, seed phrases, or wallet passwords.",
            "Do not send private wallet credentials to support.",
            "Payment API keys and internal secrets are kept server-side.",
          ],
        },
      ]}
    />
  )
}
