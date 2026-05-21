import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getPublishedMarketListings } from "@/lib/global-market"
import {
  ContactStrip,
  GlobalPageFrame,
  PaymentRules,
  ProductGrid,
  SectionHeader,
  TerminalOrderCard,
  TrustBadges,
} from "./_components/global-store-ui"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Affordable AI Digital Codes | Pay with USDT",
  description:
    "Buy AI digital codes and activation support with USDT via TRC20 or BEP20. Fast delivery, order tracking, and global self-service access.",
}

const steps = [
  "Choose a product",
  "Select USDT network: TRC20 or BEP20",
  "Pay with USDT",
  "Wait for on-chain confirmation",
  "Receive digital delivery by email",
  "Track your order anytime",
]

const faqs = [
  {
    question: "Why is the price lower?",
    answer:
      "This is a USDT self-service edition. The lower price does not include RMB payment support, Chinese customer service, extended manual assistance, or after-delivery refund coverage.",
  },
  {
    question: "Which payment method do you support?",
    answer: "We support USDT via TRC20 and BEP20 networks for global orders.",
  },
  {
    question: "Can I pay with Alipay or WeChat Pay?",
    answer: "No. Global orders only support USDT. For RMB payment, please use our China store.",
  },
  {
    question: "Can I get a refund?",
    answer: "Digital products are non-refundable after delivery. Refunds are only available before delivery if we cannot complete the order.",
  },
  {
    question: "Is a screenshot enough as payment proof?",
    answer: "No. Only confirmed on-chain transactions are valid.",
  },
]

export default async function GlobalHomePage() {
  const products = await getPublishedMarketListings("GLOBAL", 6)

  return (
    <GlobalPageFrame>
      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-neutral-500">
              USDT self-service digital store
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-7xl">
              Affordable AI Digital Codes
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              Pay with USDT via TRC20 or BEP20. Instant delivery. Global self-service access.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/global/products"
                className="inline-flex items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-6 py-3 text-sm font-medium text-white hover:bg-white hover:text-neutral-950"
              >
                Browse Products
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/global/track-order"
                className="inline-flex items-center justify-center border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-950 hover:border-neutral-950"
              >
                Track Order
              </Link>
            </div>
          </div>
          <TerminalOrderCard />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <TrustBadges />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="mb-8 flex items-end justify-between gap-6">
          <SectionHeader
            eyebrow="Featured products"
            title="Global listings only"
            description="This page only shows products explicitly published to the GLOBAL market."
          />
          <Link href="/global/products" className="hidden text-sm font-medium text-neutral-950 hover:underline sm:block">
            View all products
          </Link>
        </div>
        <ProductGrid products={products} />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <SectionHeader eyebrow="How it works" title="Six clear steps, no hidden payment proof rules" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step} className="border border-neutral-200 bg-white p-5">
              <p className="mb-5 font-mono text-xs text-neutral-500">STEP {String(index + 1).padStart(2, "0")}</p>
              <p className="text-lg font-medium text-neutral-950">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="border border-neutral-950 bg-white p-6 sm:p-8">
          <SectionHeader
            eyebrow="Price logic"
            title="Why is the price lower?"
            description="This is a USDT self-service digital product store. Prices are lower because global orders do not include RMB payment support, Chinese customer service, extended manual assistance, or after-delivery refund coverage."
          />
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950 hover:underline">
            For local payment and full Chinese support, use our China store
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <SectionHeader eyebrow="Payment rules" title="Designed to prevent wrong-network mistakes" />
        <PaymentRules />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <SectionHeader eyebrow="FAQ" title="Read before placing an order" />
        <div className="grid gap-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group border border-neutral-200 bg-white p-5">
              <summary className="cursor-pointer list-none text-lg font-semibold text-neutral-950">{faq.question}</summary>
              <p className="mt-4 text-sm leading-6 text-neutral-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:pb-24">
        <ContactStrip />
      </section>
    </GlobalPageFrame>
  )
}
