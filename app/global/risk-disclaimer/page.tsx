import type { Metadata } from "next"
import { PolicyPage } from "../_components/global-store-ui"

export const metadata: Metadata = {
  title: "Risk Disclaimer | Xiaoheiwan Global Store",
  description: "Risk disclaimer for USDT digital product orders.",
}

export default function GlobalRiskDisclaimerPage() {
  return (
    <PolicyPage
      eyebrow="Risk"
      title="Risk Disclaimer"
      intro="This store is built for customers who understand digital delivery, USDT payment, and third-party platform account risk."
      sections={[
        {
          title: "Independent store",
          items: [
            "We are an independent digital product store.",
            "We are not affiliated with OpenAI, Anthropic, Google, GitHub, X, or other third-party platforms unless explicitly stated.",
            "Third-party platforms may change policies, eligibility rules, and activation behavior at any time.",
          ],
        },
        {
          title: "User responsibility",
          items: [
            "User behavior, IP environment, account history, and payment region may affect activation success.",
            "Users are responsible for complying with local laws and third-party platform terms.",
            "Users must ensure their account is eligible before ordering.",
          ],
        },
        {
          title: "Payment risk",
          items: [
            "Sending funds on the wrong network may result in permanent loss.",
            "A TRC20 order cannot be automatically confirmed by a BEP20 payment.",
            "A BEP20 order cannot be automatically confirmed by a TRC20 payment.",
          ],
        },
      ]}
    />
  )
}
