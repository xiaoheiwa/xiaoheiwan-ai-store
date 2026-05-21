import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getGlobalOrder } from "@/lib/global-orders"
import { GlobalPaymentPanel } from "../../_components/global-payment-panel"
import { GlobalPageFrame, SectionHeader } from "../../_components/global-store-ui"

export const dynamic = "force-dynamic"

type PayPageProps = {
  params: Promise<{ orderNo: string }>
}

export async function generateMetadata({ params }: PayPageProps): Promise<Metadata> {
  const { orderNo } = await params
  return {
    title: `Pay Order ${orderNo} | Global Store`,
    description: "USDT payment confirmation page for Global Store orders.",
  }
}

export default async function GlobalPayPage({ params }: PayPageProps) {
  const { orderNo } = await params
  const order = await getGlobalOrder(orderNo)
  if (!order) notFound()

  return (
    <GlobalPageFrame>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
        <SectionHeader
          eyebrow="Payment"
          title="Confirm every field before sending"
          description="The network, token, exact amount, and address must match this order. Screenshots are not accepted as payment proof."
        />
        <GlobalPaymentPanel order={order} />
      </section>
    </GlobalPageFrame>
  )
}
