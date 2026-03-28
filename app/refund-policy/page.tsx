"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Globe } from "lucide-react"

export default function RefundPolicyPage() {
  const [lang, setLang] = useState<"zh" | "en">("zh")

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{"返回首页"}</span>
          </Link>
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm"
          >
            <Globe className="w-4 h-4" />
            <span>{lang === "zh" ? "EN" : "中文"}</span>
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {lang === "zh" ? "退款政策" : "Refund Policy"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === "zh" ? "最后更新：2025年3月" : "Last Updated: March 2025"}
          </p>
        </div>

        <div className="space-y-6">
          {lang === "zh" ? (
            <>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"1. 数字商品性质"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"本网站销售的产品为数字商品（激活码、会员服务等）。由于数字商品的特殊性，一经交付即视为已使用，通常不支持退款。"}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"2. 不予退款的情况"}</h2>
                <ul className="text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
                  <li>{"激活码已被使用或查看"}</li>
                  <li>{"会员服务已开通"}</li>
                  <li>{"订单已完成交付"}</li>
                  <li>{"因用户操作错误导致的问题"}</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"3. 可申请退款的情况"}</h2>
                <ul className="text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
                  <li>{"系统故障导致重复扣款"}</li>
                  <li>{"商品无法正常使用且无法解决"}</li>
                  <li>{"未交付且取消订单"}</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"4. 退款流程"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"如需申请退款，请联系 Telegram @jialiao2025 并提供订单号和具体情况说明。我们将在3个工作日内回复。"}</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"1. Nature of Digital Goods"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"Products sold on this website are digital goods (activation codes, membership services, etc.). Due to their nature, digital goods are considered used once delivered and are generally non-refundable."}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"2. Non-Refundable Cases"}</h2>
                <ul className="text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
                  <li>{"Activation code has been used or viewed"}</li>
                  <li>{"Membership service has been activated"}</li>
                  <li>{"Order has been delivered"}</li>
                  <li>{"Issues caused by user error"}</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"3. Refundable Cases"}</h2>
                <ul className="text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
                  <li>{"Duplicate charges due to system error"}</li>
                  <li>{"Product cannot be used and issue cannot be resolved"}</li>
                  <li>{"Undelivered order cancellation"}</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"4. Refund Process"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"To request a refund, please contact Telegram @jialiao2025 with your order number and details. We will respond within 3 business days."}</p>
              </section>
            </>
          )}
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">{lang === "zh" ? "相关文档" : "Related Documents"}</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/privacy-policy" className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
              {lang === "zh" ? "隐私政策" : "Privacy Policy"}
            </Link>
            <Link href="/terms-of-service" className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
              {lang === "zh" ? "服务条款" : "Terms of Service"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
