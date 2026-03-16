"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function GrokActivatePage() {
  const [loading, setLoading] = useState(true)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {"返回商城"}
        </Link>
      </div>

      {/* Iframe fills remaining space */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <iframe
          src="https://quickplus.vip/"
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          title="Claude Pro/SuperGrok 激活系统"
        />
      </div>

    </div>
  )
}
