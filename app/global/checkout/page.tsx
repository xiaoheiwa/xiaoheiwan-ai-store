import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getMarketListingBySlug } from "@/lib/global-market"
import { GlobalCheckoutForm } from "../_components/global-checkout-form"
import { GlobalPageFrame, SectionHeader } from "../_components/global-store-ui"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Checkout | Global USDT Store",
  description: "Create a USDT order with TRC20 or BEP20 payment.",
}

type CheckoutPageProps = {
  searchParams: Promise<{ product?: string }>
}

export default async function GlobalCheckoutPage({ searchParams }: CheckoutPageProps) {
  const { product: slug } = await searchParams
  if (!slug) notFound()

  const product = await getMarketListingBySlug("GLOBAL", slug)
  if (!product) notFound()

  return (
    <GlobalPageFrame>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
        <Link href={`/global/product/${product.slug}`} className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950">
          <ArrowLeft className="h-4 w-4" />
          Back to product
        </Link>
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Checkout"
              title="Create a USDT order"
              description="Choose the correct network before creating the order. A TRC20 order cannot be automatically paid with BEP20, and a BEP20 order cannot be automatically paid with TRC20."
            />
            <div className="border border-neutral-200 bg-white p-5 text-sm leading-6 text-neutral-600">
              After creation, the payment page will show the exact amount, token, network, payment address, and countdown.
            </div>
          </div>
          <GlobalCheckoutForm product={product} />
        </div>
      </section>
    </GlobalPageFrame>
  )
}
