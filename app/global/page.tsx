import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ShoppingBag } from "lucide-react"
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
    "Buy AI digital codes and activation support with USDT via TRC20 or BEP20. Fast email delivery, order tracking, and global self-service access.",
}

const buyPath = [
  { title: "Pick a product", body: "Browse the global catalog. Prices shown in USDT." },
  { title: "Pay in USDT", body: "Send the exact amount on TRC20 or BEP20 — your choice." },
  { title: "Receive by email", body: "Activation code arrives in your inbox after on-chain confirmation." },
]

const trackPath = [
  { title: "Keep your order ID", body: "Your order ID appears after checkout and in delivery email." },
  { title: "Check status", body: "Use your email and order ID to follow payment and delivery." },
  { title: "Get support", body: "If manual review is needed, contact support with your order ID." },
]

const activatePath = [
  { title: "Receive your code", body: "Activation begins only after your digital delivery is complete." },
  { title: "Open Activation Desk", body: "Enter your delivered ChatGPT code in the global activation page." },
  { title: "Review before submitting", body: "Some products require account session data; the warning is shown before submission." },
]

const faqs = [
  {
    question: "Why is the price lower?",
    answer:
      "This is a USDT self-service edition. It does not include RMB payment support, Chinese-language support, extended manual assistance, or after-delivery refund coverage.",
  },
  {
    question: "Why is this cheaper than the official price?",
    answer:
      "USDT settlement avoids card fees and refund chargebacks. We also do not run RMB payments, Chinese-language support, or post-delivery refund coverage on this store — those are bundled into the China store instead.",
  },
  {
    question: "Which USDT networks do you support?",
    answer:
      "USDT on TRC20 (Tron) and BEP20 (BNB Smart Chain). Pick the one your wallet already holds — the order will fail if you send funds on the wrong network.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Once the on-chain confirmation lands, delivery is automatic — usually within a couple of minutes. You can also track the order anytime with your email and order ID.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Digital products are non-refundable after delivery. Before delivery, a refund may be possible if we cannot complete the order. See the refund policy for details.",
  },
  {
    question: "Is a screenshot enough as payment proof?",
    answer:
      "No. Only confirmed on-chain transactions are valid. Underpaid or overpaid orders go to manual review.",
  },
  {
    question: "How do I activate a delivered ChatGPT code?",
    answer:
      "Use the Global Activation Desk after delivery. Some ChatGPT activations require account session data, so review the on-page warning before you submit anything.",
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
              AI subscriptions, paid in USDT.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              Pay with USDT on TRC20 or BEP20. Receive digital delivery by email after on-chain confirmation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/global/products"
                className="inline-flex items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-6 py-3 text-sm font-medium text-white hover:bg-white hover:text-neutral-950"
              >
                <ShoppingBag className="h-4 w-4" />
                Browse Products
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="/global/track-order"
                className="inline-flex items-center justify-center gap-2 border border-neutral-950 bg-white px-6 py-3 text-sm font-medium text-neutral-950 hover:bg-neutral-950 hover:text-white"
              >
                Track Order
              </a>
              <a
                href="/global/activate/gpt"
                className="inline-flex items-center justify-center gap-2 border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-950 hover:border-neutral-950"
              >
                Activate Code
              </a>
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
            description="This page only shows products explicitly published to the GLOBAL market. China-only listings stay hidden."
          />
          <Link href="/global/products" className="hidden text-sm font-medium text-neutral-950 hover:underline sm:block">
            View all products
          </Link>
        </div>
        <ProductGrid products={products} />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <SectionHeader
          eyebrow="How it works"
          title="Three clear stages"
          description="Purchase, activate delivered codes when required, and track delivery without mixing payment networks or support expectations."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <PathCard
            badge="Buy"
            title="Order a new code"
            cta="Browse products"
            ctaHref="/global/products"
            steps={buyPath}
            primary
          />
          <PathCard
            badge="Activate"
            title="Use a delivered code"
            cta="Activate code"
            ctaHref="/global/activate/gpt"
            steps={activatePath}
            reloadDocument
          />
          <PathCard
            badge="Track"
            title="Follow an existing order"
            cta="Track order"
            ctaHref="/global/track-order"
            steps={trackPath}
            reloadDocument
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="border border-neutral-950 bg-white p-6 sm:p-8">
          <SectionHeader
            eyebrow="Price logic"
            title="Why is the price lower?"
            description="USDT settlement avoids card fees and chargebacks. The global edition also doesn't bundle RMB payment support, Chinese customer service, extended manual assistance, or after-delivery refund coverage — those live in the China store."
          />
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950 hover:underline">
            Need RMB payment or Chinese support? Switch to the China store
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <SectionHeader
          eyebrow="Payment rules"
          title="Designed to prevent wrong-network mistakes"
          description="Read these once before sending USDT. Wrong-network transfers are unrecoverable."
        />
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

function PathCard({
  badge,
  title,
  steps,
  cta,
  ctaHref,
  primary,
  reloadDocument,
}: {
  badge: string
  title: string
  steps: { title: string; body: string }[]
  cta: string
  ctaHref: string
  primary?: boolean
  reloadDocument?: boolean
}) {
  const ctaClassName = `mt-7 inline-flex items-center justify-center gap-2 border border-neutral-950 px-5 py-3 text-sm font-medium ${
    primary
      ? "bg-neutral-950 text-white hover:bg-white hover:text-neutral-950"
      : "bg-white text-neutral-950 hover:bg-neutral-950 hover:text-white"
  }`

  return (
    <article
      className={`flex flex-col border ${
        primary ? "border-neutral-950 bg-white shadow-[8px_8px_0_#111]" : "border-neutral-200 bg-white"
      } p-6 sm:p-8`}
    >
      <span className="self-start border border-neutral-950 bg-neutral-950 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
        {badge}
      </span>
      <h3 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-950">{title}</h3>
      <ol className="mt-6 grid gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[44px_1fr] gap-4 border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0">
            <span className="font-mono text-sm text-neutral-500">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-base font-medium text-neutral-950">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      {reloadDocument ? (
        <a href={ctaHref} className={ctaClassName}>
          {cta}
          <ArrowRight className="h-4 w-4" />
        </a>
      ) : (
        <Link href={ctaHref} className={ctaClassName}>
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </article>
  )
}
