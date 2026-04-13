"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ShoppingBag, Zap, BookOpen, FileText, ChevronDown, Shield, Wrench, Mail } from "lucide-react"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"

// Navigation items - IMPORTANT: Using child.label as key because Claude and Grok share same /activate href
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
      { label: "Claude 激活", href: "/activate/claude", description: "Claude Pro 会员激活" },
      { label: "Grok 激活", href: "/activate/grok", description: "Grok Premium 会员激活" },
      { label: "X Premium", href: "/activate/x", description: "X Premium 会员激活" },
      { label: "ChatGPT 激活", href: "/activate/gpt", description: "ChatGPT Plus 会员激活" },
      { label: "Team 兑换", href: "/activate/team", description: "GPT Team 邀请兑换" },
      { label: "Telegram 会员", href: "/telegram-premium", description: "Telegram Premium 代开" },
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
  {
    label: "工具",
    icon: Wrench,
    children: [
      { label: "2FA 验证器", href: "/tools/2fa", description: "TOTP 双因素认证码生成" },
      { label: "Gmail 检测", href: "/tools/gmail-checker", description: "批量检测邮箱状态" },
      { label: "图片分割", href: "https://collagesplitter.com/", description: "AI拼贴图分割成单独照片", external: true },
    ]
  },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [toolsConfig, setToolsConfig] = useState({ twofa: true, gmailChecker: true })
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // 加载工具配置
  useEffect(() => {
    fetch("/api/tools-config")
      .then(res => res.json())
      .then(config => setToolsConfig(config))
      .catch(() => {})
  }, [])

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
            <Link href="/" className="flex items-center gap-2 group">
              <Logo size={28} className="transition-transform group-hover:scale-105" />
              <span className="font-semibold text-foreground hidden sm:block">{"小黑丸"}</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                // 过滤工具子菜单
                let filteredChildren = item.children
                if (item.label === "工具" && item.children) {
                  filteredChildren = item.children.filter(child => {
                    if (child.href === "/tools/2fa") return toolsConfig.twofa
                    if (child.href === "/tools/gmail-checker") return toolsConfig.gmailChecker
                    return true
                  })
                  // 如果没有启用的工具，不显示工具菜单
                  if (filteredChildren.length === 0) return null
                }

                return (
                <div key={item.label} className="relative">
                  {filteredChildren ? (
                    <div
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          filteredChildren.some(child => isActive(child.href))
                            ? "text-accent"
                            : "text-foreground hover:text-accent"
                        }`}
                      >
                        {item.label}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                      </button>
                      
                      {openDropdown === item.label && (
                        <div className="absolute top-full left-0 pt-2 w-48">
                          <div className="bg-popover border border-border rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredChildren.map((child) => (
                              child.external ? (
                                <a
                                  key={child.label}
                                  href={child.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex flex-col px-3 py-2.5 rounded-lg transition-colors hover:bg-secondary"
                                >
                                  <span className="text-sm font-medium flex items-center gap-1">
                                    {child.label}
                                    <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </span>
                                  <span className="text-xs text-muted-foreground">{child.description}</span>
                                </a>
                              ) : (
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
                              )
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
              )})}
            </div>

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

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-5xl mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                // 过滤工具子菜单
                let filteredChildren = item.children
                if (item.label === "工具" && item.children) {
                  filteredChildren = item.children.filter(child => {
                    if (child.href === "/tools/2fa") return toolsConfig.twofa
                    if (child.href === "/tools/gmail-checker") return toolsConfig.gmailChecker
                    return true
                  })
                  if (filteredChildren.length === 0) return null
                }

                return (
                <div key={item.label}>
                  {filteredChildren ? (
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
                          {filteredChildren.map((child) => (
                            child.external ? (
                              <a
                                key={child.label}
                                href={child.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
                              >
                                {child.label}
                                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
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
                            )
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
              )})}
              
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

      <div className="h-14 sm:h-16" />
    </>
  )
}
