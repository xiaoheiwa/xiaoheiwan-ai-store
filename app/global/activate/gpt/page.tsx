import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, LockKeyhole, ReceiptText, ShieldAlert } from "lucide-react"
import { GlobalGptActivateForm } from "../../_components/global-gpt-activate-form"
import { GlobalPageFrame, MonoBadge } from "../../_components/global-store-ui"

export const metadata: Metadata = {
  title: "Activate ChatGPT Plus Code | Global Store",
  description: "Activate a delivered ChatGPT Plus digital code from a completed global store order.",
}

const steps = [
  {
    icon: <ReceiptText className="h-4 w-4" />,
    title: "Use a delivered code",
    body: "Complete your USDT order first, then enter the code sent with your delivery.",
  },
  {
    icon: <LockKeyhole className="h-4 w-4" />,
    title: "Review account data",
    body: "New activations may require ChatGPT session JSON. Read the warning before submitting.",
  },
  {
    icon: <ShieldAlert className="h-4 w-4" />,
    title: "Need support?",
    body: "If activation cannot complete, contact Telegram support with your order ID and code reference.",
  },
]

export default function GlobalGptActivatePage() {
  return (
    <GlobalPageFrame>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
        <Link href="/global" className="mb-10 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950">
          <ArrowLeft className="h-4 w-4" />
          Back to Global Store
        </Link>
        <div className="grid gap-10 lg:grid-cols-[1fr_460px] lg:items-start">
          <div>
            <MonoBadge>Delivered Code Activation</MonoBadge>
            <h1 className="mt-7 max-w-xl text-5xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-6xl">
              Activate a delivered ChatGPT code.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-600">
              This desk is for customers who already received a ChatGPT activation code from a completed order. Payment
              and delivery status remain available through order tracking.
            </p>

            <div className="mt-10 grid max-w-xl gap-3">
              {steps.map((item, index) => (
                <div key={item.title} className="grid grid-cols-[44px_1fr] gap-4 border-t border-neutral-200 py-5">
                  <div className="flex h-9 w-9 items-center justify-center border border-neutral-950 text-neutral-950">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
                      Step {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-neutral-950">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/global/track-order"
              className="mt-8 inline-flex items-center gap-2 border border-neutral-950 bg-white px-5 py-3 text-sm font-medium text-neutral-950 hover:bg-neutral-950 hover:text-white"
            >
              Track an order first
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <GlobalGptActivateForm />
        </div>
      </section>
    </GlobalPageFrame>
  )
}
