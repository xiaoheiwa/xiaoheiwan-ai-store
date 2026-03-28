"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function RefundPolicyPage() {
  const [lang, setLang] = useState<"en" | "zh">("zh")

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6 gap-2">
          <Button
            variant={lang === "zh" ? "default" : "outline"}
            size="sm"
            onClick={() => setLang("zh")}
          >
            中文
          </Button>
          <Button
            variant={lang === "en" ? "default" : "outline"}
            size="sm"
            onClick={() => setLang("en")}
          >
            English
          </Button>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {lang === "zh" ? (
            <>
              <h1>退款政策</h1>
              <p className="text-muted-foreground">最后更新：2025年3月</p>

              <h2>1. 数字商品性质</h2>
              <p>本网站销售的产品为数字商品（激活码、会员服务等）。由于数字商品的特殊性，一经交付即视为已使用，通常不支持退款。</p>

              <h2>2. 不予退款的情况</h2>
              <p>激活码已被使用或查看、会员服务已开通、订单已完成交付、因用户操作错误导致的问题、违反使用条款的订单。</p>

              <h2>3. 可申请退款的情况</h2>
              <p>系统故障导致重复扣款、商品无法正常使用且无法解决、未交付且取消订单。</p>

              <h2>4. 退款流程</h2>
              <p>如需申请退款，请联系 Telegram @jialiao2025，提供订单号和具体情况说明。我们将在3个工作日内回复。</p>

              <h2>5. 联系方式</h2>
              <p>Telegram @jialiao2025</p>
            </>
          ) : (
            <>
              <h1>Refund Policy</h1>
              <p className="text-muted-foreground">Last updated: March 2025</p>

              <h2>1. Nature of Digital Goods</h2>
              <p>Products sold on this website are digital goods (activation codes, membership services, etc.). Due to their nature, digital goods are considered used once delivered and are generally non-refundable.</p>

              <h2>2. Non-Refundable Cases</h2>
              <p>Activation code has been used or viewed, membership service has been activated, order has been delivered, issues caused by user error, orders violating terms of use.</p>

              <h2>3. Refundable Cases</h2>
              <p>Duplicate charges due to system error, product cannot be used and issue cannot be resolved, undelivered order cancellation.</p>

              <h2>4. Refund Process</h2>
              <p>To request a refund, contact Telegram @jialiao2025 with your order number and details. We will respond within 3 business days.</p>

              <h2>5. Contact</h2>
              <p>Telegram @jialiao2025</p>
            </>
          )}
        </article>
      </div>
    </main>
  )
}
