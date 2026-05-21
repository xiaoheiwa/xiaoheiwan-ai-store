"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ChatWidget from "@/components/chat-widget"
import NotificationBanner from "@/components/notification-banner"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith("/admin")
  const isGlobalPage = pathname?.startsWith("/global")

  if (isAdminPage || isGlobalPage) {
    return <>{children}</>
  }

  return (
    <>
      <NotificationBanner />
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
      <ChatWidget />
    </>
  )
}
