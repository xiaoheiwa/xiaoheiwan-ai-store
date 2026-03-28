"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Globe } from "lucide-react"

export default function TermsOfServicePage() {
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
            {lang === "zh" ? "服务条款" : "Terms of Service"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === "zh" ? "最后更新：2025年3月" : "Last Updated: March 2025"}
          </p>
        </div>

        <div className="space-y-6">
          {lang === "zh" ? (
            <>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"1. 服务说明"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"小黑丸提供数字产品销售服务，包括但不限于 AI 会员订阅激活码、软件许可证等虚拟商品。"}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"2. 使用资格"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"您必须年满18周岁或达到您所在司法管辖区的法定成年年龄方可使用本服务。"}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"3. 订单与支付"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"下单即表示您同意支付所列价格。支付完成后，订单将自动处理。所有价格均以人民币计价，除非另有说明。"}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"4. 数字产品交付"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"数字产品通常在付款确认后立即交付。如遇延迟，我们会及时通知您。"}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"5. 禁止行为"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"禁止转售、分享或滥用购买的产品。违反者将被终止服务且不予退款。"}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"6. 联系方式"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"如有问题，请联系 Telegram @jialiao2025"}</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"1. Service Description"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"Xiaoheiwan provides digital product sales services, including but not limited to AI subscription activation codes, software licenses, and other virtual goods."}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"2. Eligibility"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"You must be at least 18 years old or the legal age of majority in your jurisdiction to use this service."}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"3. Orders & Payment"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"By placing an order, you agree to pay the listed price. Orders are processed automatically upon payment confirmation. All prices are in CNY unless otherwise stated."}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"4. Digital Product Delivery"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"Digital products are typically delivered immediately after payment confirmation. If there are delays, we will notify you promptly."}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"5. Prohibited Conduct"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"Reselling, sharing, or abusing purchased products is prohibited. Violators will have their service terminated without refund."}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-3">{"6. Contact"}</h2>
                <p className="text-muted-foreground leading-relaxed">{"For inquiries, contact Telegram @jialiao2025"}</p>
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
            <Link href="/refund-policy" className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
              {lang === "zh" ? "退款政策" : "Refund Policy"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
