"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ChatWidget from "@/components/chat-widget"
import { I18nProvider } from "@/lib/i18n-context"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith("/admin")

  if (isAdminPage) {
    return <I18nProvider>{children}</I18nProvider>
  }

  return (
    <I18nProvider>
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
      <ChatWidget />
    </I18nProvider>
  )
}
