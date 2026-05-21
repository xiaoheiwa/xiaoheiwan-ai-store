"use client"

import { useState, useTransition } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react"
import type { MarketProductCard } from "@/lib/global-market"
import type { PaymentNetwork } from "@/lib/market"

export function GlobalCheckoutForm({ product }: { product: MarketProductCard }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [paymentNetwork, setPaymentNetwork] = useState<PaymentNetwork>("TRC20")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    startTransition(async () => {
      try {
        const response = await fetch("/api/global/order/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            productSlug: product.slug,
            paymentNetwork,
          }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          setError(data.error || "Failed to create order.")
          return
        }
        router.push(data.payUrl || `/global/pay/${data.orderNo}`)
      } catch {
        setError("Network error. Please try again.")
      }
    })
  }

  return (
    <form onSubmit={submit} className="border border-neutral-950 bg-white p-6 shadow-[8px_8px_0_#111]">
      <div className="mb-6">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-neutral-500">Selected product</p>
        <h2 className="text-2xl font-semibold text-neutral-950">{product.title}</h2>
        <p className="mt-3 font-mono text-4xl font-semibold text-neutral-950">
          {product.price.toFixed(2)}
          <span className="ml-2 text-base">USDT</span>
        </p>
      </div>

      <label className="mb-5 block">
        <span className="mb-2 block text-sm font-medium text-neutral-950">Delivery email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 outline-none focus:border-neutral-950 focus:ring-0"
        />
      </label>

      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-neutral-950">Select payment network</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <NetworkOption
            active={paymentNetwork === "TRC20"}
            title="USDT-TRC20"
            description="Send only USDT via TRC20."
            onClick={() => setPaymentNetwork("TRC20")}
          />
          <NetworkOption
            active={paymentNetwork === "BEP20"}
            title="USDT-BEP20"
            description="Send only USDT via BEP20."
            onClick={() => setPaymentNetwork("BEP20")}
          />
        </div>
      </div>

      <div className="mb-6 border border-neutral-200 bg-[#f7f7f3] p-4 text-sm leading-6 text-neutral-700">
        <AlertCircle className="mb-3 h-4 w-4 text-neutral-950" />
        Screenshots are not accepted as proof of payment. Orders are delivered only after on-chain confirmation. Wrong-network
        payments may result in permanent loss.
      </div>

      {error && <p className="mb-4 border border-neutral-950 bg-white p-3 text-sm text-neutral-950">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-5 py-4 text-sm font-medium text-white hover:bg-white hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Create USDT Order
      </button>
    </form>
  )
}

function NetworkOption({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border p-4 text-left transition ${
        active ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950"
      }`}
    >
      <span className="block font-mono text-sm font-semibold">{title}</span>
      <span className={`mt-2 block text-xs leading-5 ${active ? "text-neutral-300" : "text-neutral-600"}`}>{description}</span>
    </button>
  )
}
