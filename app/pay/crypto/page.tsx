"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy, CheckCircle, Clock, ExternalLink, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

function CryptoPaymentContent() {
  const searchParams = useSearchParams()
  const orderNo = searchParams.get("orderNo")
  const amount = searchParams.get("amount")
  const usdtAmount = searchParams.get("usdt")
  
  const [txHash, setTxHash] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [verified, setVerified] = useState(false)
  const [resultMessage, setResultMessage] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchWalletAddress()
  }, [])

  const fetchWalletAddress = async () => {
    try {
      const res = await fetch("/api/crypto/wallet")
      if (res.ok) {
        const data = await res.json()
        setWalletAddress(data.address)
      } else {
        setError("无法获取钱包地址")
      }
    } catch {
      setError("网络错误")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txHash.trim() || !orderNo) return

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/crypto/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo, txHash: txHash.trim() }),
      })

      const data = await res.json()
      
      if (res.ok) {
        setSubmitted(true)
        setVerified(data.verified || false)
        setResultMessage(data.message || "")
      } else {
        setError(data.error || "提交失败")
      }
    } catch (err) {
      setError("网络错误，请重试")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!orderNo || !amount || !usdtAmount) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">{"参数错误"}</h1>
          <p className="text-muted-foreground mb-4">{"订单信息不完整"}</p>
          <Link href="/purchase" className="text-accent hover:underline">{"返回购买页"}</Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background dark noise-overlay">
        <div className="fixed inset-0 bg-grid-subtle opacity-40" />
        <div className="relative z-10 max-w-lg mx-auto px-4 py-16">
          <div className="glass-card card-shadow rounded-3xl p-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${verified ? "bg-[#26A17B]/10" : "bg-amber-500/10"}`}>
              {verified ? (
                <CheckCircle className="w-8 h-8 text-[#26A17B]" />
              ) : (
                <Clock className="w-8 h-8 text-amber-500" />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-3">
              {verified ? "支付已确认" : "交易已提交"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {verified 
                ? resultMessage || "您的支付已自动验证成功，激活码已发送到您的邮箱！" 
                : resultMessage || "我们会在确认收款后处理您的订单，通常需要 10-30 分钟。届时激活码将发送到您的邮箱。"
              }
            </p>
            <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
              <div className="text-sm text-muted-foreground mb-1">{"订单号"}</div>
              <div className="font-mono text-sm text-foreground">{orderNo}</div>
            </div>
            <Link href={`/order/${orderNo}`}>
              <Button className={`w-full h-12 ${verified ? "bg-[#26A17B] hover:bg-[#1f8a68]" : ""}`}>
                {"查看订单状态"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark noise-overlay">
      <div className="fixed inset-0 bg-grid-subtle opacity-40" />
      <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-10">
        <Link
          href="/purchase"
          className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{"返回"}</span>
        </Link>

        <div className="glass-card card-shadow rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-6 h-6">
                <circle cx="16" cy="16" r="16" fill="#26A17B"/>
                <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117" fill="#fff"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">{"USDT 支付"}</h1>
              <p className="text-sm text-muted-foreground">{"TRC20 网络"}</p>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-secondary/50 rounded-2xl p-5 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{"订单号"}</span>
              <span className="font-mono text-sm text-foreground">{orderNo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{"人民币金额"}</span>
              <span className="text-base font-bold text-foreground">¥{amount}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">{"需支付 USDT"}</span>
              <span className="text-xl font-bold text-[#26A17B]">{usdtAmount} USDT</span>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-foreground mb-3 block">{"收款地址 (TRC20 网络)"}</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3.5 font-mono text-sm text-foreground break-all select-all leading-relaxed">
                {walletAddress || "加载中..."}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(walletAddress, "address")}
                className="shrink-0 h-12 w-12"
              >
                {copied === "address" ? <CheckCircle className="w-5 h-5 text-[#26A17B]" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
            {copied === "address" && <p className="text-xs text-[#26A17B] mt-2">{"地址已复制"}</p>}
          </div>

          {/* Amount to send */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-foreground mb-3 block">{"转账金额 (请精确转账)"}</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#26A17B]/10 border-2 border-[#26A17B]/40 rounded-xl px-4 py-4 font-mono text-xl text-[#26A17B] font-bold text-center select-all">
                {usdtAmount} USDT
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(usdtAmount || "", "amount")}
                className="shrink-0 h-14 w-14"
              >
                {copied === "amount" ? <CheckCircle className="w-5 h-5 text-[#26A17B]" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
            {copied === "amount" && <p className="text-xs text-[#26A17B] mt-2">{"金额已复制"}</p>}
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-600 dark:text-amber-400 mb-2">{"注意事项"}</p>
                <ul className="list-disc list-inside space-y-1.5 text-amber-700 dark:text-amber-300">
                  <li>{"请务必使用 TRC20 网络转账"}</li>
                  <li>{"转账金额必须与上方显示金额完全一致"}</li>
                  <li>{"转账完成后请提交交易哈希"}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit TX Hash */}
          <form onSubmit={handleSubmit}>
            <label className="text-sm font-semibold text-foreground mb-3 block">{"交易哈希 (TxID)"}</label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="转账完成后粘贴交易哈希..."
              className="w-full px-4 py-3.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#26A17B]/50 focus:border-[#26A17B] transition-all mb-4 font-mono text-sm"
              required
            />

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2 mb-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-[#26A17B] hover:bg-[#1f8a68] text-white" 
              disabled={submitting || !txHash.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {"提交中..."}
                </>
              ) : (
                "提交交易哈希"
              )}
            </Button>
          </form>

          {/* Help link */}
          <div className="mt-6 text-center">
            <a
              href="https://tronscan.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              {"在 TronScan 查询交易"}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Timer notice */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{"订单有效期 24 小时，请尽快完成支付"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CryptoPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    }>
      <CryptoPaymentContent />
    </Suspense>
  )
}
