"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ChatWidget from "@/components/chat-widget"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith("/admin")

  if (isAdminPage) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
      <ChatWidget />
    </>
  )
}
