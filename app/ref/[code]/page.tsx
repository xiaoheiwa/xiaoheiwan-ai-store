"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function ReferralLinkPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [referrerName, setReferrerName] = useState("")
  const [discount, setDiscount] = useState("")

  useEffect(() => {
    async function validateReferrer() {
      try {
        // 验证推广码是否有效
        const res = await fetch(`/api/ref/validate?code=${encodeURIComponent(code)}`)
        const data = await res.json()
        
        if (data.success && data.data) {
          // 存储推广信息到 localStorage
          localStorage.setItem("referral_code", code.toUpperCase())
          localStorage.setItem("referral_info", JSON.stringify({
            referrer_id: data.data.referrer_id,
            referrer_name: data.data.referrer_name,
            discount_type: data.data.discount_type,
            discount_value: data.data.discount_value,
            coupon_id: data.data.coupon_id,
            coupon_code: data.data.coupon_code,
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天有效期
          }))
          
          setReferrerName(data.data.referrer_name)
          if (data.data.discount_type === "fixed") {
            setDiscount(`立减 ¥${data.data.discount_value}`)
          } else {
            setDiscount(`${data.data.discount_value}% 折扣`)
          }
          setStatus("success")
          
          // 2秒后跳转到首页
          setTimeout(() => {
            router.push("/")
          }, 2000)
        } else {
          setStatus("error")
          // 3秒后跳转到首页
          setTimeout(() => {
            router.push("/")
          }, 3000)
        }
      } catch {
        setStatus("error")
        setTimeout(() => {
          router.push("/")
        }, 3000)
      }
    }
    
    if (code) {
      validateReferrer()
    }
  }, [code, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto" />
            <p className="text-lg text-muted-foreground">正在验证推广链接...</p>
          </div>
        )}
        
        {status === "success" && (
          <div className="space-y-4 animate-fade-up">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">推广链接已激活</h1>
            <p className="text-muted-foreground">
              来自 <span className="text-accent font-medium">{referrerName}</span> 的推荐
            </p>
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4">
              <p className="text-accent font-medium">{discount}</p>
              <p className="text-sm text-muted-foreground mt-1">购买时将自动应用优惠</p>
            </div>
            <p className="text-sm text-muted-foreground">正在跳转到首页...</p>
          </div>
        )}
        
        {status === "error" && (
          <div className="space-y-4 animate-fade-up">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">推广链接无效</h1>
            <p className="text-muted-foreground">该推广链接已失效或不存在</p>
            <p className="text-sm text-muted-foreground">正在跳转到首页...</p>
          </div>
        )}
      </div>
    </div>
  )
}
