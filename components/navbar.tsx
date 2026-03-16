"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ShoppingBag, Zap, BookOpen, FileText, ChevronDown } from "lucide-react"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"

// Navigation items with unique labels for proper React key handling
const navItems = [
  { 
    label: "购买", 
    href: "/purchase",
    icon: ShoppingBag,
  },
  { 
    label: "激活",
    icon: Zap,
    children: [
      { label: "Claude 激活", href: "/activate", description: "Claude Pro 会员激活" },
      { label: "Grok 激活", href: "/activate", description: "Grok Premium 会员激活" },
      { label: "ChatGPT 激活", href: "/activate/gpt", description: "ChatGPT Plus 会员激活" },
      { label: "Team 兑换", href: "/activate/team", description: "GPT Team 邀请兑换" },
    ]
  },
  { 
    label: "指南", 
    href: "/guide",
    icon: BookOpen,
  },
  { 
    label: "博客", 
    href: "/blog",
    icon: FileText,
  },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setOpenDropdown(null)
  }, [pathname])

  const isActive = (href: string) => pathname === href

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-xl border-b border-border/60 shadow-sm"
            : "bg-background"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Logo size={28} className="transition-transform group-hover:scale-105" />
              <span className="font-semibold text-foreground hidden sm:block">{"小黑丸"}</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <div key={item.label} className="relative">
                  {item.children ? (
                    <div
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          item.children.some(child => isActive(child.href))
                            ? "text-accent"
                            : "text-foreground hover:text-accent"
                        }`}
                      >
                        {item.label}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                      </button>
                      
                      {/* Dropdown */}
                      {openDropdown === item.label && (
                        <div className="absolute top-full left-0 pt-2 w-48">
                          <div className="bg-popover border border-border rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            {item.children.map((child) => (
                              <Link
                                key={child.label}
                                href={child.href}
                                className={`flex flex-col px-3 py-2.5 rounded-lg transition-colors ${
                                  isActive(child.href)
                                    ? "bg-accent/10 text-accent"
                                    : "hover:bg-secondary"
                                }`}
                              >
                                <span className="text-sm font-medium">{child.label}</span>
                                <span className="text-xs text-muted-foreground">{child.description}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href!}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive(item.href!)
                          ? "text-accent"
                          : "text-foreground hover:text-accent"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <Link href="/order-lookup" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-foreground/80 hover:text-foreground">
                  {"订单查询"}
                </Button>
              </Link>
              <Link href="/purchase" className="hidden sm:block">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-white">
                  {"立即购买"}
                </Button>
              </Link>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
                aria-label="菜单"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-5xl mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-secondary transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                      </button>
                      {openDropdown === item.label && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                              <Link
                              key={child.label}
                              href={child.href}
                              className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                                isActive(child.href)
                                  ? "text-accent bg-accent/10"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                              }`}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href!}
                      className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive(item.href!)
                          ? "text-accent bg-accent/10"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              
              <div className="pt-4 mt-4 border-t border-border space-y-3">
                <Link href="/order-lookup" className="block">
                  <Button variant="outline" size="default" className="w-full justify-center h-11">
                    {"订单查询"}
                  </Button>
                </Link>
                <Link href="/purchase" className="block">
                  <Button size="default" className="w-full justify-center bg-accent hover:bg-accent/90 text-white h-11">
                    {"立即购买"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-14 sm:h-16" />
    </>
  )
}
