"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

const links = [
  { href: "/global/products", label: "Products" },
  { href: "/global/activate/gpt", label: "Activate Code", reloadDocument: true },
  { href: "/global/track-order", label: "Track Order", reloadDocument: true },
  { href: "/global/refund-policy", label: "Refund Policy" },
]

export function GlobalMobileNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center border border-neutral-300 text-neutral-950 hover:border-neutral-950 sm:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 top-0 border-b border-neutral-950 bg-[#f7f7f3] p-5 shadow-[0_8px_0_#111]">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-950">
                Global Store
              </span>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center border border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-950 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="grid gap-2">
              {links.map((link) =>
                link.reloadDocument ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="border border-neutral-200 bg-white px-4 py-3 text-base font-medium text-neutral-950 hover:border-neutral-950"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="border border-neutral-200 bg-white px-4 py-3 text-base font-medium text-neutral-950 hover:border-neutral-950"
                  >
                    {link.label}
                  </Link>
                ),
              )}
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="border border-neutral-950 bg-neutral-950 px-4 py-3 text-base font-medium text-white hover:bg-white hover:text-neutral-950"
              >
                China Store
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
