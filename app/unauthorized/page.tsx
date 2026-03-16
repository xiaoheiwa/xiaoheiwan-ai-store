"use client"

import { AlertTriangle, Mail, MessageCircle, ShieldX } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-12 h-12 text-destructive" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">域名未授权</h1>
          <p className="text-muted-foreground">
            当前域名未获得使用授权，请联系开发者获取授权码
          </p>
        </div>

        {/* Warning Box */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400">授权说明</p>
              <p className="text-muted-foreground mt-1">
                本系统需要授权才能使用。购买授权后，您将获得一个唯一的授权码，
                配置到环境变量 <code className="bg-muted px-1 py-0.5 rounded text-xs">LICENSE_KEY</code> 即可激活。
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">联系开发者购买授权：</p>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:contact@example.com"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>contact@example.com</span>
            </a>
            <a
              href="https://t.me/your_telegram"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Telegram 联系</span>
            </a>
          </div>
        </div>

        {/* Features Preview */}
        <div className="border border-border rounded-xl p-4 text-left">
          <p className="font-medium text-sm mb-3">授权后可享受：</p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              完整的电商系统功能
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              多种支付方式支持
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              自动/人工发货模式
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Telegram 订单通知
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              终身免费更新
            </li>
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          Powered by AI Shop System
        </p>
      </div>
    </div>
  )
}
