import type { Metadata } from "next"
import { PolicyPage } from "../_components/global-store-ui"

export const metadata: Metadata = {
  title: "Refund Policy | Xiaoheiwan Global Store",
  description: "Refund policy for USDT self-service digital products.",
}

export default function GlobalRefundPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Refund"
      title="Refund Policy"
      intro="Digital products are handled differently from physical goods. Please read this page before payment."
      sections={[
        {
          title: "After delivery",
          items: [
            "Digital products are non-refundable after delivery.",
            "Used, viewed, or delivered codes cannot be refunded.",
            "Refunds do not cover user operation mistakes or third-party platform policy changes.",
          ],
        },
        {
          title: "Before delivery",
          items: [
            "A refund may be available before delivery if we cannot complete the order.",
            "Underpaid orders require additional payment or manual review.",
            "Overpaid orders require manual review.",
          ],
        },
        {
          title: "Network mistakes",
          items: [
            "Sending funds on the wrong network may result in permanent loss.",
            "Screenshots are not accepted as payment proof.",
            "Only confirmed on-chain transactions are valid.",
          ],
        },
      ]}
    />
  )
}
