"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Copy, ExternalLink, RefreshCw, TriangleAlert } from "lucide-react"
import type { GlobalOrder } from "@/lib/global-orders"

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function GlobalPaymentPanel({ order }: { order: GlobalOrder }) {
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState("")
  const expiresAt = order.payment_expired_at ? new Date(order.payment_expired_at).getTime() : 0
  const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000))
  const expired = secondsLeft <= 0 && order.payment_status === "unpaid"
  const network = order.payment_network || "TRC20"

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const warning = useMemo(() => {
    if (network === "BEP20") return "Send only USDT via BEP20 network. Do not send TRC20, ERC20, or other network tokens to this address."
    return "Send only USDT via TRC20 network. Do not send BEP20, ERC20, or other network tokens to this address."
  }, [network])

  async function copy(value: string | number | null | undefined, label: string) {
    if (!value) return
    await navigator.clipboard.writeText(String(value))
    setCopied(label)
    window.setTimeout(() => setCopied(""), 1600)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section className="border border-neutral-950 bg-white p-6 shadow-[8px_8px_0_#111]">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-start">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-neutral-500">Order Created</p>
            <h1 className="font-mono text-2xl font-semibold text-neutral-950 break-all">{order.out_trade_no}</h1>
          </div>
          <div className="border border-neutral-950 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Countdown</p>
            <p className="font-mono text-2xl font-semibold text-neutral-950">{expired ? "Expired" : formatTime(secondsLeft)}</p>
          </div>
        </div>

        <div className="grid gap-4">
          <PayField label="Amount" value={`${Number(order.expected_amount || order.amount).toFixed(2)} USDT`} onCopy={() => copy(order.expected_amount || order.amount, "amount")} copied={copied === "amount"} strong />
          <PayField label="Token" value="USDT" />
          <PayField label="Network" value={`USDT-${network}`} />
          <PayField label="Payment Address" value={order.payment_address || "Open gateway to view address"} onCopy={() => copy(order.payment_address, "address")} copied={copied === "address"} mono />
        </div>

        <div className="mt-6 border border-neutral-950 bg-[#f7f7f3] p-4 text-sm leading-6 text-neutral-700">
          <TriangleAlert className="mb-3 h-5 w-5 text-neutral-950" />
          <p className="font-medium text-neutral-950">{warning}</p>
          <p className="mt-2">
            Screenshots are not accepted as proof of payment. Underpaid or overpaid orders require manual review. Sending
            funds to the wrong network may result in permanent loss.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {order.payment_url && (
            <a
              href={order.payment_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-5 py-3 text-sm font-medium text-white hover:bg-white hover:text-neutral-950"
            >
              Open Payment Gateway
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-950 hover:border-neutral-950"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </button>
        </div>
      </section>

      <aside className="grid gap-4 content-start">
        <StatusBox label="Payment Status" value={expired ? "expired" : order.payment_status} />
        <StatusBox label="Delivery Status" value={order.delivery_status} />
        <div className="border border-neutral-200 bg-white p-5">
          <p className="mb-2 text-sm font-semibold text-neutral-950">{order.product_title_snapshot || order.subject}</p>
          <p className="text-sm leading-6 text-neutral-600">Use the same email and order ID to track payment and delivery status.</p>
          <a href="/global/track-order" className="mt-5 inline-flex text-sm font-medium text-neutral-950 hover:underline">
            Track Order
          </a>
        </div>
      </aside>
    </div>
  )
}

function PayField({
  label,
  value,
  onCopy,
  copied,
  mono,
  strong,
}: {
  label: string
  value: string
  onCopy?: () => void
  copied?: boolean
  mono?: boolean
  strong?: boolean
}) {
  return (
    <div className="grid gap-3 border border-neutral-200 bg-white p-4 sm:grid-cols-[160px_1fr_auto] sm:items-center">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`${mono || strong ? "font-mono" : ""} ${strong ? "text-3xl font-semibold" : "text-sm"} break-all text-neutral-950`}>
        {value}
      </p>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copy ${label}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-neutral-300 px-3 py-2 text-sm text-neutral-950 hover:border-neutral-950"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  )
}

function StatusBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 bg-white p-5">
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="font-mono text-lg font-semibold text-neutral-950">{value}</p>
    </div>
  )
}
