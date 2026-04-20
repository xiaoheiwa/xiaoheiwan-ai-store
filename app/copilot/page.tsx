"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, ExternalLink, Shield, Zap, Clock, HelpCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CopilotPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 监听 iframe 加载完成
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {"返回首页"}
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6e40c9] to-[#238636] flex items-center justify-center">
                <svg viewBox="0 0 16 16" className="w-5 h-5 text-white" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold">{"GitHub Copilot 激活"}</h1>
              </div>
            </div>
          </div>
          <a 
            href="https://easygithub.com/index.php" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {"在新窗口打开"}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Features Banner */}
      <div className="border-b border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4 text-green-500" />
              <span>{"官方正版授权"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>{"即时激活生效"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{"24小时自动处理"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <HelpCircle className="w-4 h-4 text-purple-500" />
              <span>{"专业客服支持"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Iframe */}
      <main className="relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
              <p className="text-muted-foreground">{"正在加载充值平台..."}</p>
            </div>
          </div>
        )}
        
        {/* Iframe Container */}
        <div className="w-full" style={{ height: "calc(100vh - 120px)" }}>
          <iframe
            src="https://easygithub.com/index.php"
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            allow="payment"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="GitHub Copilot 激活平台"
          />
        </div>
      </main>

      {/* Mobile Notice */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <a 
          href="https://easygithub.com/index.php" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#6e40c9] to-[#238636] text-white font-medium"
        >
          {"在新窗口打开完整版"}
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
