"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AlertTriangle, Clock, CheckCircle, XCircle, Phone, Mail, Shield } from "lucide-react"
import QRCode from "qrcode"

interface OrderInfo {
  orderNo: string
  email: string
  amount: number
  subject: string
  status: string
  qrcode?: string
  paymentUrl?: string
  createdAt: string
  expiresAt: string
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const orderNo = params.orderNo as string
  
  const [order, setOrder] = useState<OrderInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("")
  const [timeLeft, setTimeLeft] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "expired" | "checking">("pending")

  // 获取订单信息
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/pay/info?orderNo=${orderNo}`)
        const data = await res.json()
        
        if (data.error) {
          setError(data.error)
          return
        }
        
        setOrder(data)
        
        // 生成二维码
        if (data.qrcode) {
          // 如果是URL，直接用；如果是二维码内容，生成图片
          if (data.qrcode.startsWith("http") || data.qrcode.startsWith("weixin://")) {
            const qrDataUrl = await QRCode.toDataURL(data.qrcode, {
              width: 280,
              margin: 2,
              color: { dark: "#000000", light: "#ffffff" }
            })
            setQrCodeDataUrl(qrDataUrl)
          } else {
            setQrCodeDataUrl(data.qrcode)
          }
        }
        
        // 计算剩余时间
        if (data.expiresAt) {
          const expires = new Date(data.expiresAt).getTime()
          const now = Date.now()
          setTimeLeft(Math.max(0, Math.floor((expires - now) / 1000)))
        }
        
        if (data.status === "paid") {
          setPaymentStatus("paid")
        }
      } catch (err) {
        setError("获取订单信息失败")
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrder()
  }, [orderNo])

  // 倒计时
  useEffect(() => {
    if (timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPaymentStatus("expired")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [timeLeft])

  // 轮询检查支付状态
  useEffect(() => {
    if (paymentStatus !== "pending") return
    
    const checkPayment = async () => {
      try {
        const res = await fetch(`/api/pay/status?orderNo=${orderNo}`)
        const data = await res.json()
        
        if (data.status === "paid") {
          setPaymentStatus("paid")
          // 3秒后跳转到成功页面
          setTimeout(() => {
            router.push(`/order/success?orderNo=${orderNo}`)
          }, 3000)
        }
      } catch (err) {
        // 忽略错误，继续轮询
      }
    }
    
    const interval = setInterval(checkPayment, 3000)
    return () => clearInterval(interval)
  }, [orderNo, paymentStatus, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">订单不存在</h1>
          <p className="text-gray-400">{error || "请检查订单号是否正确"}</p>
        </div>
      </div>
    )
  }

  if (paymentStatus === "paid") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="bg-green-500/10 border border-green-500/50 rounded-2xl p-6 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">支付成功</h1>
          <p className="text-gray-400 mb-4">激活码已发送到您的邮箱</p>
          <p className="text-sm text-gray-500">正在跳转...</p>
        </div>
      </div>
    )
  }

  if (paymentStatus === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-2xl p-6 max-w-md text-center">
          <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">订单已过期</h1>
          <p className="text-gray-400">请返回重新下单</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">
        
        {/* 反诈骗警告 - 最醒目位置 */}
        <div className="bg-red-600 rounded-2xl p-4 shadow-lg shadow-red-600/20">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">防诈骗提醒</h2>
              <ul className="text-sm text-white/90 space-y-1">
                <li>• 如果您是被他人要求扫码付款，这是诈骗！</li>
                <li>• 刷单返利、帮忙代付都是骗局！</li>
                <li>• 付款后商品只会发给下方邮箱，不会发给您！</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 收货信息 - 让付款人看到商品发给谁 */}
        <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-4">
          <div className="text-amber-500 text-sm font-bold mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            商品将发送至
          </div>
          <div className="bg-black/50 rounded-xl p-3">
            <p className="text-xl font-bold text-amber-400 break-all text-center">{order.email}</p>
          </div>
          <p className="text-xs text-amber-500/80 mt-2 text-center">
            如果这不是您的邮箱，请勿付款！
          </p>
        </div>

        {/* 订单信息 */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">订单号</span>
            <span className="text-white font-mono text-sm">{order.orderNo}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">商品</span>
            <span className="text-white text-sm">{order.subject}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">支付金额</span>
            <span className="text-2xl font-bold text-green-400">¥{order.amount}</span>
          </div>
        </div>

        {/* 二维码区域 */}
        <div className="bg-white rounded-2xl p-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
              <Clock className="w-4 h-4" />
              剩余 {formatTime(timeLeft)}
            </div>
          </div>
          
          {qrCodeDataUrl ? (
            <div className="flex justify-center">
              <img 
                src={qrCodeDataUrl} 
                alt="支付二维码" 
                className="w-64 h-64 rounded-lg"
              />
            </div>
          ) : order.paymentUrl ? (
            <div className="text-center">
              <a 
                href={order.paymentUrl}
                className="inline-block px-6 py-3 bg-green-500 text-white rounded-xl font-medium"
              >
                点击前往支付
              </a>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              二维码加载失败
            </div>
          )}
          
          <p className="text-center text-gray-500 text-sm mt-4">
            请使用微信扫码支付
          </p>
        </div>

        {/* 安全提示 */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Shield className="w-4 h-4" />
            安全提示
          </div>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• 请确认这是您本人的订单</li>
            <li>• 付款前请核实收货邮箱是否属于您</li>
            <li>• 如遇诈骗请立即报警：110 / 96110</li>
          </ul>
        </div>

        {/* 举报入口 */}
        <div className="text-center">
          <a 
            href="tel:96110" 
            className="inline-flex items-center gap-2 text-red-400 text-sm hover:text-red-300"
          >
            <Phone className="w-4 h-4" />
            发现诈骗？立即拨打反诈热线 96110
          </a>
        </div>
      </div>
    </div>
  )
}
