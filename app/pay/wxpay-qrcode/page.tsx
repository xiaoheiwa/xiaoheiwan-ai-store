"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Loader2, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

function WxPayQRCodeContent() {
  const searchParams = useSearchParams()
  const orderNo = searchParams.get("orderNo")
  const amount = searchParams.get("amount")
  const qrcode = searchParams.get("qrcode")
  
  const [checking, setChecking] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 定时检查支付状态
  useEffect(() => {
    if (!orderNo || paid) return

    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(`/api/order/${orderNo}/status`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === "paid" || data.status === "completed") {
            setPaid(true)
            // 跳转到成功页面
            setTimeout(() => {
              window.location.href = `/success?orderNo=${orderNo}`
            }, 1500)
          }
        }
      } catch (e) {
        console.error("Check payment status error:", e)
      }
    }

    // 每3秒检查一次
    const interval = setInterval(checkPaymentStatus, 3000)
    // 立即检查一次
    checkPaymentStatus()

    return () => clearInterval(interval)
  }, [orderNo, paid])

  const handleRefresh = async () => {
    setChecking(true)
    try {
      const res = await fetch(`/api/order/${orderNo}/status`)
      if (res.ok) {
        const data = await res.json()
        if (data.status === "paid" || data.status === "completed") {
          setPaid(true)
          setTimeout(() => {
            window.location.href = `/success?orderNo=${orderNo}`
          }, 1500)
        } else {
          setError("暂未检测到支付，请确认已完成支付")
          setTimeout(() => setError(null), 3000)
        }
      }
    } catch (e) {
      setError("检查支付状态失败")
    }
    setChecking(false)
  }

  if (!qrcode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{"支付二维码获取失败"}</p>
          <Link href="/purchase" className="text-accent hover:underline">
            {"返回重新下单"}
          </Link>
        </div>
      </div>
    )
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">{"支付成功！"}</p>
          <p className="text-muted-foreground">{"正在跳转..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#07C160] text-white px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/purchase" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-medium">{"微信支付"}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-card rounded-2xl shadow-lg p-6 text-center">
          {/* 金额 */}
          <div className="mb-6">
            <p className="text-muted-foreground text-sm mb-1">{"支付金额"}</p>
            <p className="text-3xl font-bold text-foreground">
              {"¥"}{amount || "0.00"}
            </p>
          </div>

          {/* 二维码 */}
          <div className="bg-white p-4 rounded-xl inline-block mb-4">
            <Image
              src={qrcode}
              alt="微信支付二维码"
              width={200}
              height={200}
              className="w-48 h-48"
              unoptimized
            />
          </div>

          {/* 提示 */}
          <div className="space-y-2 text-sm text-muted-foreground mb-6">
            <p className="font-medium text-foreground">{"请长按上方二维码"}</p>
            <p>{"选择「识别图中二维码」完成支付"}</p>
          </div>

          {/* 订单号 */}
          <div className="text-xs text-muted-foreground mb-4">
            <p>{"订单号: "}{orderNo}</p>
          </div>

          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full py-3 bg-[#07C160] text-white rounded-xl font-medium hover:bg-[#06AD56] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {"检查中..."}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {"我已完成支付"}
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-sm text-orange-500">{error}</p>
          )}

          {/* 备选方案 */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">
              {"如果无法识别二维码，请截图保存后使用微信扫一扫"}
            </p>
            <Link 
              href="/purchase" 
              className="text-xs text-accent hover:underline"
            >
              {"返回选择其他支付方式"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WxPayQRCodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    }>
      <WxPayQRCodeContent />
    </Suspense>
  )
}
