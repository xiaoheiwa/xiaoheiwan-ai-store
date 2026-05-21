import type { Metadata } from "next"
import { GlobalTrackOrderForm } from "../_components/global-track-order-form"
import { GlobalPageFrame, SectionHeader } from "../_components/global-store-ui"

export const metadata: Metadata = {
  title: "Track Order | Xiaoheiwan Global Store",
  description: "Track your Global Store USDT payment and digital delivery status.",
}

export default function GlobalTrackOrderPage() {
  return (
    <GlobalPageFrame>
      <section className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
        <SectionHeader
          eyebrow="Track order"
          title="Check payment and delivery status"
          description="Enter your email and order ID to check your payment and delivery status."
        />
        <GlobalTrackOrderForm />
      </section>
    </GlobalPageFrame>
  )
}
