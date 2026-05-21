import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, TriangleAlert, X } from "lucide-react"
import { getMarketListingBySlug } from "@/lib/global-market"
import { GlobalPageFrame, MonoBadge } from "../../_components/global-store-ui"

export const dynamic = "force-dynamic"

type ProductPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getMarketListingBySlug("GLOBAL", slug)

  if (!product) {
    return {
      title: "Product Not Found | Global Store",
    }
  }

  return {
    title: `${product.seo_title || product.title} | USDT Self-Service Edition`,
    description:
      product.seo_description ||
      `Buy ${product.title} with USDT via TRC20 or BEP20. Digital delivery, order tracking, and self-service instructions.`,
  }
}

const included = [
  "USDT-TRC20 / BEP20 payment",
  "Digital delivery",
  "Order tracking",
  "Basic English instructions",
  "Telegram support for order issues",
]

const notIncluded = [
  "RMB payment support",
  "Alipay or WeChat Pay",
  "Chinese customer service",
  "Extended manual assistance",
  "Refund after digital delivery",
  "Coverage for third-party platform policy changes",
  "Coverage for user-caused account risk",
]

const importantNotes = [
  "We do not sell shared accounts.",
  "Make sure your account is eligible before ordering.",
  "Digital products are non-refundable after delivery.",
  "Screenshots are not accepted as proof of payment.",
  "Only confirmed on-chain transactions are valid.",
  "Sending funds on the wrong network may result in permanent loss.",
]

export default async function GlobalProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getMarketListingBySlug("GLOBAL", slug)
  if (!product) notFound()

  const inStock = product.delivery_type === "manual" || product.stock_count > 0
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.short_description || product.description,
    sku: product.product_sku || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "USDT",
      price: product.price.toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  }

  return (
    <GlobalPageFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
        <Link href="/global/products" className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950">
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <article className="min-w-0">
            <div className="border border-neutral-200 bg-white p-6 sm:p-8">
              <div className="mb-5 flex flex-wrap gap-2">
                <MonoBadge>GLOBAL</MonoBadge>
                <MonoBadge>USDT SELF-SERVICE</MonoBadge>
                <MonoBadge>{product.delivery_type === "manual" ? "MANUAL REVIEW" : "DIGITAL DELIVERY"}</MonoBadge>
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-6xl">
                {product.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
                {product.short_description || product.description || "USDT self-service digital product."}
              </p>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <ListPanel title="Included" icon="check" items={included} />
              <ListPanel title="Not included" icon="x" items={notIncluded} />
            </div>

            <div className="mt-6 border border-neutral-950 bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <TriangleAlert className="h-5 w-5 text-neutral-950" />
                <h2 className="text-xl font-semibold text-neutral-950">Important Notes</h2>
              </div>
              <ul className="grid gap-3 text-sm leading-6 text-neutral-600">
                {importantNotes.map((note) => (
                  <li key={note} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-neutral-950" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {(product.refund_policy || product.risk_notice || product.service_level) && (
              <div className="mt-6 grid gap-4">
                {product.service_level && <InfoBlock title="Service Level" body={product.service_level} />}
                {product.refund_policy && <InfoBlock title="Refund Policy" body={product.refund_policy} />}
                {product.risk_notice && <InfoBlock title="Risk Notice" body={product.risk_notice} />}
              </div>
            )}
          </article>

          <aside className="lg:sticky lg:top-6">
            <div className="border border-neutral-950 bg-white p-6 shadow-[8px_8px_0_#111]">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-neutral-500">Price</p>
              <p className="font-mono text-5xl font-semibold tracking-[-0.04em] text-neutral-950">
                {product.price.toFixed(2)}
                <span className="ml-2 text-base tracking-normal">USDT</span>
              </p>
              {product.compare_at_price && (
                <p className="mt-2 font-mono text-sm text-neutral-500 line-through">{product.compare_at_price.toFixed(2)} USDT</p>
              )}

              <div className="my-6 h-px bg-neutral-200" />

              <div className="grid gap-3 text-sm">
                <PanelRow label="Payment" value="USDT via TRC20 or BEP20" />
                <PanelRow label="Delivery" value="After on-chain confirmation" />
                <PanelRow label="Stock" value={inStock ? "Available" : "Out of stock"} />
                <PanelRow label="Best for" value="Users who understand USDT and self-service activation" />
              </div>

              <Link
                href={inStock ? `/global/checkout?product=${product.slug}` : "#"}
                aria-disabled={!inStock}
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 border border-neutral-950 px-5 py-4 text-sm font-medium ${
                  inStock
                    ? "bg-neutral-950 text-white hover:bg-white hover:text-neutral-950"
                    : "pointer-events-none bg-neutral-200 text-neutral-500"
                }`}
              >
                Buy with USDT
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-xs leading-5 text-neutral-500">
                Wrong-network payments may result in permanent loss. Confirm TRC20 or BEP20 before sending funds.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </GlobalPageFrame>
  )
}

function ListPanel({ title, icon, items }: { title: string; icon: "check" | "x"; items: string[] }) {
  return (
    <section className="border border-neutral-200 bg-white p-6">
      <h2 className="mb-5 text-xl font-semibold text-neutral-950">{title}</h2>
      <ul className="grid gap-3 text-sm leading-6 text-neutral-600">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            {icon === "check" ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-950" />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0 text-neutral-950" />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <section className="border border-neutral-200 bg-white p-6">
      <h2 className="mb-3 text-lg font-semibold text-neutral-950">{title}</h2>
      <p className="text-sm leading-6 text-neutral-600">{body}</p>
    </section>
  )
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-5 border-b border-neutral-100 pb-3">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-medium text-neutral-950">{value}</span>
    </div>
  )
}
