import Link from "next/link"
import { ArrowRight, Check, Mail, MessageCircle, PackageCheck, ShieldCheck, Terminal, WalletCards } from "lucide-react"
import type { MarketProductCard } from "@/lib/global-market"
import { GlobalMobileNav } from "./global-mobile-nav"

const SUPPORT_TELEGRAM_URL = process.env.GLOBAL_SUPPORT_TELEGRAM?.trim()

const trustBadges = [
  "USDT-TRC20 / BEP20 Payment",
  "Fast Digital Delivery",
  "Order Tracking",
  "Clear Refund Rules",
  "Telegram Support",
]

export function GlobalHeader() {
  return (
    <header className="border-b border-neutral-200 bg-[#f7f7f3]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/global" className="group flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border border-neutral-950 bg-neutral-950 text-xs font-semibold text-white">
            XH
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-neutral-950">Global Store</span>
            <span className="block text-xs text-neutral-500">USDT self-service edition</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-neutral-600 sm:flex">
          <Link href="/global/products" className="hover:text-neutral-950">
            Products
          </Link>
          <Link href="/global/track-order" className="hover:text-neutral-950">
            Track Order
          </Link>
          <Link href="/global/refund-policy" className="hover:text-neutral-950">
            Refund Policy
          </Link>
          <Link href="/" className="border border-neutral-300 px-3 py-2 text-neutral-950 hover:border-neutral-950">
            China Store
          </Link>
        </nav>
        <GlobalMobileNav />
      </div>
    </header>
  )
}

export function GlobalFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-[#f7f7f3]">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 text-sm text-neutral-600 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-950">Xiaoheiwan Global</p>
          <p className="max-w-md leading-6">
            A self-service digital product store for global customers who understand USDT payment and digital delivery.
          </p>
        </div>
        <div className="grid gap-2">
          <Link href="/global/terms" className="hover:text-neutral-950">
            Terms
          </Link>
          <Link href="/global/refund-policy" className="hover:text-neutral-950">
            Refund Policy
          </Link>
          <Link href="/global/privacy-policy" className="hover:text-neutral-950">
            Privacy Policy
          </Link>
          <Link href="/global/risk-disclaimer" className="hover:text-neutral-950">
            Risk Disclaimer
          </Link>
        </div>
        <div className="grid gap-2">
          <p className="font-medium text-neutral-950">Support</p>
          {SUPPORT_TELEGRAM_URL ? (
            <a
              href={SUPPORT_TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-neutral-950 hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Telegram support
            </a>
          ) : (
            <p>Telegram support details are provided with your order.</p>
          )}
          <p>Use Telegram only for order issues, with your order ID.</p>
          <p>We never ask for private keys or seed phrases.</p>
        </div>
      </div>
    </footer>
  )
}

export function GlobalPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f3] text-neutral-950">
      <GlobalHeader />
      <main>{children}</main>
      <GlobalFooter />
    </div>
  )
}

export function MonoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-neutral-300 bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-700">
      {children}
    </span>
  )
}

export function TerminalOrderCard() {
  return (
    <div className="border border-neutral-950 bg-white p-4 shadow-[8px_8px_0_#111] sm:p-6">
      <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-2 font-mono text-xs text-neutral-500">
          <Terminal className="h-4 w-4" />
          Order #GLOBAL-1024
        </div>
        <span className="border border-neutral-950 px-2 py-1 font-mono text-[10px] uppercase">Live Check</span>
      </div>
      <div className="grid gap-4 font-mono text-sm">
        <TerminalRow label="Token" value="USDT" />
        <TerminalRow label="Networks" value="TRC20 / BEP20" />
        <TerminalRow label="Status" value="Awaiting confirmation" />
        <TerminalRow label="Delivery" value="Email" />
      </div>
    </div>
  )
}

function TerminalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right text-neutral-950">{value}</span>
    </div>
  )
}

export function TrustBadges() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {trustBadges.map((badge) => (
        <div key={badge} className="border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
          <Check className="mb-3 h-4 w-4 text-neutral-950" />
          {badge}
        </div>
      ))}
    </div>
  )
}

export function ProductCard({ product }: { product: MarketProductCard }) {
  const inStock = product.delivery_type === "manual" || product.stock_count > 0

  return (
    <Link
      href={`/global/product/${product.slug}`}
      className="group flex min-h-[280px] flex-col justify-between border border-neutral-200 bg-white p-5 transition hover:-translate-y-1 hover:border-neutral-950 hover:shadow-[6px_6px_0_#111]"
    >
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <MonoBadge>GLOBAL</MonoBadge>
          <span className="font-mono text-xs text-neutral-500">{inStock ? "Available" : "Out of stock"}</span>
        </div>
        <h3 className="mb-3 text-xl font-semibold leading-tight text-neutral-950">{product.title}</h3>
        <p className="line-clamp-3 text-sm leading-6 text-neutral-600">
          {product.short_description || product.description || "USDT self-service digital delivery."}
        </p>
      </div>
      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Price</p>
          <p className="font-mono text-3xl font-semibold text-neutral-950">
            {product.price.toFixed(2)} <span className="text-sm">USDT</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950">
          View
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

export function ProductGrid({ products }: { products: MarketProductCard[] }) {
  if (products.length === 0) {
    return (
      <div className="border border-dashed border-neutral-300 bg-white p-8 text-center">
        <p className="mb-2 text-lg font-semibold text-neutral-950">Global products are being prepared.</p>
        <p className="text-sm text-neutral-600">No GLOBAL listing is published yet. China store products are not shown here.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="mb-8 max-w-2xl">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-neutral-500">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-7 text-neutral-600">{description}</p>}
    </div>
  )
}

export function PaymentRules() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <RuleCard icon={<WalletCards className="h-5 w-5" />} title="USDT only">
        Global orders support USDT via TRC20 or BEP20. Alipay and WeChat Pay are not shown in this store.
      </RuleCard>
      <RuleCard icon={<ShieldCheck className="h-5 w-5" />} title="On-chain proof">
        Screenshots are not accepted as payment proof. Only confirmed on-chain transfers are valid.
      </RuleCard>
      <RuleCard icon={<PackageCheck className="h-5 w-5" />} title="Digital delivery">
        Delivery starts after payment confirmation. Underpaid or overpaid orders require manual review.
      </RuleCard>
    </div>
  )
}

function RuleCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-neutral-200 bg-white p-5">
      <div className="mb-5 flex h-10 w-10 items-center justify-center border border-neutral-950 bg-neutral-950 text-white">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-neutral-950">{title}</h3>
      <p className="text-sm leading-6 text-neutral-600">{children}</p>
    </div>
  )
}

export function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string
  title: string
  intro: string
  sections: Array<{ title: string; items: string[] }>
}) {
  return (
    <GlobalPageFrame>
      <section className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
        <MonoBadge>{eyebrow}</MonoBadge>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">{intro}</p>
        <div className="mt-12 grid gap-5">
          {sections.map((section) => (
            <section key={section.title} className="border border-neutral-200 bg-white p-6">
              <h2 className="mb-5 text-xl font-semibold text-neutral-950">{section.title}</h2>
              <ul className="grid gap-3 text-sm leading-6 text-neutral-600">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-neutral-950" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <Link
          href="/global"
          className="mt-10 inline-flex items-center gap-2 border border-neutral-950 bg-neutral-950 px-5 py-3 text-sm font-medium text-white hover:bg-white hover:text-neutral-950"
        >
          Back to Global Store
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </GlobalPageFrame>
  )
}

export function ContactStrip() {
  return (
    <div className="border border-neutral-950 bg-neutral-950 p-6 text-white">
      <Mail className="mb-5 h-5 w-5" />
      <p className="mb-2 text-xl font-semibold">Need help with an order?</p>
      <p className="max-w-2xl text-sm leading-6 text-neutral-300">
        Contact our Telegram support with your order ID. We do not accept screenshots as payment proof and we never
        ask for private keys.
      </p>
      {SUPPORT_TELEGRAM_URL && (
        <a
          href={SUPPORT_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 border border-white px-5 py-3 text-sm font-medium text-white hover:bg-white hover:text-neutral-950"
        >
          <MessageCircle className="h-4 w-4" />
          Open Telegram support
        </a>
      )}
    </div>
  )
}
