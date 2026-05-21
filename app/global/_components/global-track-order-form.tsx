"use client"

import { useState, useTransition } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import { Loader2, Search } from "lucide-react"

type PublicGlobalOrder = {
  orderNo: string
  product: string
  paymentStatus: string
  deliveryStatus: string
  token: string
  paymentNetwork: string | null
  expectedAmount: number | null
  receivedAmount: number | null
  txHash: string | null
  confirmations: number | null
  paymentAddress: string | null
  paymentUrl: string | null
  deliveryInfo: string | null
  manualReviewReason: string | null
}

export function GlobalTrackOrderForm() {
  const [email, setEmail] = useState("")
  const [orderNo, setOrderNo] = useState("")
  const [order, setOrder] = useState<PublicGlobalOrder | null>(null)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setOrder(null)

    startTransition(async () => {
      try {
        const response = await fetch("/api/global/order/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, orderNo }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          setError(data.error || "Order not found.")
          return
        }
        setOrder(data.order)
      } catch {
        setError("Network error. Please try again.")
      }
    })
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="border border-neutral-950 bg-white p-6 shadow-[8px_8px_0_#111]">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-medium text-neutral-950">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-neutral-300 bg-white px-4 py-3 text-neutral-950 outline-none focus:border-neutral-950"
              placeholder="you@example.com"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-neutral-950">Order ID</span>
            <input
              required
              value={orderNo}
              onChange={(event) => setOrderNo(event.target.value)}
              className="w-full border border-neutral-300 bg-white px-4 py-3 font-mono text-neutral-950 outline-none focus:border-neutral-950"
              placeholder="G..."
            />
          </label>
        </div>
        {error && <p className="mt-4 border border-neutral-950 p-3 text-sm text-neutral-950">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-5 py-4 text-sm font-medium text-white hover:bg-white hover:text-neutral-950 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Track Order
        </button>
      </form>

      {order && (
        <section className="border border-neutral-200 bg-white p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Order</p>
              <h2 className="mt-2 font-mono text-xl font-semibold text-neutral-950 break-all">{order.orderNo}</h2>
            </div>
            <Link href={`/global/pay/${order.orderNo}`} className="text-sm font-medium text-neutral-950 hover:underline">
              Open payment page
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <ResultRow label="Product" value={order.product} />
            <ResultRow label="Payment Status" value={order.paymentStatus} />
            <ResultRow label="Delivery Status" value={order.deliveryStatus} />
            <ResultRow label="Network" value={order.paymentNetwork ? `USDT-${order.paymentNetwork}` : "USDT"} />
            <ResultRow label="Expected Amount" value={order.expectedAmount ? `${Number(order.expectedAmount).toFixed(2)} USDT` : "-"} />
            <ResultRow label="Received Amount" value={order.receivedAmount ? `${Number(order.receivedAmount).toFixed(2)} USDT` : "-"} />
            <ResultRow label="Tx Hash" value={order.txHash || "-"} mono />
            <ResultRow label="Confirmations" value={order.confirmations === null || order.confirmations === undefined ? "-" : String(order.confirmations)} />
          </div>
          {order.manualReviewReason && (
            <div className="mt-5 border border-neutral-950 bg-[#f7f7f3] p-4 text-sm leading-6 text-neutral-700">
              {order.manualReviewReason}
            </div>
          )}
          {order.deliveryInfo && (
            <div className="mt-5 border border-neutral-950 bg-[#f7f7f3] p-4">
              <p className="mb-3 text-sm font-semibold text-neutral-950">Delivery Info</p>
              <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-neutral-950">{order.deliveryInfo}</pre>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function ResultRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border border-neutral-200 p-4">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-neutral-500">{label}</p>
      <p className={`${mono ? "font-mono" : ""} break-all text-sm font-medium text-neutral-950`}>{value}</p>
    </div>
  )
}
