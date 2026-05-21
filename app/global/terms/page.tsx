import type { Metadata } from "next"
import { PolicyPage } from "../_components/global-store-ui"

export const metadata: Metadata = {
  title: "Terms | Xiaoheiwan Global Store",
  description: "Terms for Xiaoheiwan Global USDT self-service digital store.",
}

export default function GlobalTermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms"
      title="Terms of Service"
      intro="These terms apply to the Global Store under /global and cover USDT self-service digital product orders."
      sections={[
        {
          title: "Digital products only",
          items: [
            "The Global Store sells digital products, codes, and activation support only.",
            "Delivery is made by email or order tracking after payment confirmation.",
            "No physical goods are shipped.",
          ],
        },
        {
          title: "USDT payment scope",
          items: [
            "Global orders support USDT via TRC20 and BEP20 networks.",
            "Each order is tied to the selected payment network.",
            "Wrong-network payments may result in permanent loss.",
          ],
        },
        {
          title: "Self-service responsibility",
          items: [
            "Users must ensure their account is eligible before ordering.",
            "Third-party platforms may change policies at any time.",
            "Suspicious orders may be delayed, rejected, or moved to manual review.",
          ],
        },
      ]}
    />
  )
}
