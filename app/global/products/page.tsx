import type { Metadata } from "next"
import { getPublishedMarketListings } from "@/lib/global-market"
import { GlobalPageFrame, ProductGrid, SectionHeader } from "../_components/global-store-ui"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Global Products | USDT Self-Service Store",
  description: "Browse global AI digital codes available with USDT via TRC20 or BEP20.",
}

export default async function GlobalProductsPage() {
  const products = await getPublishedMarketListings("GLOBAL", 100)

  return (
    <GlobalPageFrame>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <SectionHeader
          eyebrow="Catalog"
          title="Global AI digital codes"
          description="Only products published to the GLOBAL market are shown here. China store pricing and RMB payment options are intentionally hidden from this page."
        />
        <ProductGrid products={products} />
      </section>
    </GlobalPageFrame>
  )
}
