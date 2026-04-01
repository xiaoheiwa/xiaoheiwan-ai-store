import Link from "next/link"
import Logo from "@/components/logo"

const quickLinks = [
  { href: "/purchase", label: "购买激活码" },
  { href: "/activate", label: "Claude 激活" },
  { href: "/activate", label: "Grok 激活" },
  { href: "/activate/gpt", label: "ChatGPT 激活" },
  { href: "/guide", label: "使用指南" },
  { href: "/order-lookup", label: "订单查询" },
  { href: "/blog", label: "博客" },
]

const legalLinks = [
  { href: "/privacy-policy", label: "隐私政策", labelEn: "Privacy" },
  { href: "/terms-of-service", label: "服务条款", labelEn: "Terms" },
  { href: "/refund-policy", label: "退款政策", labelEn: "Refund" },
  { href: "/disclaimer", label: "免责声明", labelEn: "Disclaimer" },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative mt-auto border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Mobile: Compact layout */}
        <div className="sm:hidden">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Logo size={20} />
            <span className="font-semibold text-foreground">{"小黑丸"}</span>
          </div>
          
          {/* Quick links - horizontal scrollable */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-foreground/70 hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Legal links */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-4 text-xs">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground/50 hover:text-foreground/70 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Service hours */}
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-foreground/60">
            <span>{"客服时间"}</span>
            <span className="font-medium text-foreground/80">{"08:00 - 24:00"}</span>
          </div>

          {/* Social links */}
          <div className="flex justify-center gap-6 mb-6">
            <Link 
              href="https://github.com/xiaoheiwa/upgrade-xiaoheiwan-com" 
              target="_blank"
              className="text-sm text-foreground/60 hover:text-accent transition-colors"
            >
              GitHub
            </Link>
            <Link 
              href="https://t.me/jialiao2025" 
              target="_blank"
              className="text-sm text-foreground/60 hover:text-accent transition-colors"
            >
              Telegram
            </Link>
            <Link 
              href="https://upgrade.xiaoheiwan.com/blog"
              className="text-sm text-foreground/60 hover:text-accent transition-colors"
            >
              {"官方博客"}
            </Link>
          </div>
          
          {/* Copyright */}
          <p className="text-xs text-foreground/50 text-center">
            &copy; {currentYear} {"小黑丸"}
          </p>
        </div>

        {/* Desktop: Full layout */}
        <div className="hidden sm:block">
          <div className="flex items-start justify-between gap-8 mb-8">
            {/* Brand */}
            <div className="max-w-xs">
              <Link href="/" className="flex items-center gap-2 group mb-3">
                <Logo size={24} className="transition-transform group-hover:scale-105" />
                <span className="font-semibold text-foreground">{"小黑丸"}</span>
              </Link>
              <p className="text-sm text-foreground/70 mb-2">
                {"专业的 AI 服务激活码购买平台，安全可靠，自动发货"}
              </p>
              <p className="text-xs text-foreground/50">
                {"客服时间："}<span className="text-foreground/70">{"08:00 - 24:00"}</span>
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">{"产品"}</h3>
                <ul className="space-y-2">
                  <li><Link href="/purchase" className="text-sm text-foreground/70 hover:text-accent transition-colors">{"购买激活码"}</Link></li>
                  <li><Link href="/activate" className="text-sm text-foreground/70 hover:text-accent transition-colors">{"Claude 激活"}</Link></li>
                  <li><Link href="/activate" className="text-sm text-foreground/70 hover:text-accent transition-colors">{"Grok 激活"}</Link></li>
                  <li><Link href="/activate/gpt" className="text-sm text-foreground/70 hover:text-accent transition-colors">{"ChatGPT 激活"}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">{"帮助"}</h3>
                <ul className="space-y-2">
                  <li><Link href="/guide" className="text-sm text-foreground/70 hover:text-accent transition-colors">{"使用指南"}</Link></li>
                  <li><Link href="/order-lookup" className="text-sm text-foreground/70 hover:text-accent transition-colors">{"订单查询"}</Link></li>
                  <li><Link href="/blog" className="text-sm text-foreground/70 hover:text-accent transition-colors">{"博客"}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">{"法律"}</h3>
                <ul className="space-y-2">
                  {legalLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-foreground/70 hover:text-accent transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-6 border-t border-border flex items-center justify-between">
            <p className="text-sm text-foreground/60">
              &copy; {currentYear} {"小黑丸. All rights reserved."}
            </p>
            <div className="flex items-center gap-6">
              <Link 
                href="https://github.com/xiaoheiwa/upgrade-xiaoheiwan-com" 
                target="_blank"
                className="text-sm text-foreground/60 hover:text-accent transition-colors"
              >
                GitHub
              </Link>
              <Link 
                href="https://t.me/jialiao2025" 
                target="_blank"
                className="text-sm text-foreground/60 hover:text-accent transition-colors"
              >
                Telegram
              </Link>
              <Link 
                href="https://upgrade.xiaoheiwan.com/blog"
                className="text-sm text-foreground/60 hover:text-accent transition-colors"
              >
                {"官方博客"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
