"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Clock, Mail, Package, DollarSign } from "lucide-react"
import { formatBeijingDateTime } from "@/lib/beijing-time"

interface PendingOrder {
  out_trade_no: string
  email: string
  amount: number
  quantity: number
  product_name?: string
  risk_reason?: string
  paid_at: string
  created_at: string
}

interface Props {
  adminToken: string
}

export function PendingReviewOrders({ adminToken }: Props) {
  const [orders, setOrders] = useState<PendingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/review?token=${adminToken}`)
      const data = await res.json()
      if (data.ok) {
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Failed to fetch pending orders:", error)
    } finally {
      setLoading(false)
    }
  }, [adminToken])

  useEffect(() => {
    fetchOrders()
    // 每30秒自动刷新
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleAction = async (orderNo: string, action: "approve" | "reject") => {
    setProcessing(orderNo)
    setMessage(null)
    
    try {
      const res = await fetch(`/api/admin/orders/review?token=${adminToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo, action }),
      })
      const data = await res.json()
      
      if (data.ok) {
        setMessage({
          text: action === "approve" ? "已发货！激活码已发送到用户邮箱" : "已拒绝！请在支付平台手动退款",
          type: "success",
        })
        // 移除已处理的订单
        setOrders(orders.filter(o => o.out_trade_no !== orderNo))
      } else {
        setMessage({ text: data.error || "操作失败", type: "error" })
      }
    } catch (error) {
      setMessage({ text: "网络错误", type: "error" })
    } finally {
      setProcessing(null)
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-foreground">待审核订单</h3>
          {orders.length > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {orders.length}
            </span>
          )}
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === "success" 
            ? "bg-green-500/10 text-green-500 border border-green-500/30" 
            : "bg-red-500/10 text-red-500 border border-red-500/30"
        }`}>
          {message.text}
        </div>
      )}

      {/* 空状态 */}
      {orders.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无待审核订单</p>
        </div>
      )}

      {/* 订单列表 */}
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.out_trade_no}
            className="bg-card border border-border rounded-xl p-4 space-y-3"
          >
            {/* 订单头部 */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm text-muted-foreground">{order.out_trade_no}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{order.email}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">¥{order.amount}</p>
                <p className="text-xs text-muted-foreground">x{order.quantity}</p>
              </div>
            </div>

            {/* 产品信息 */}
            {order.product_name && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span>{order.product_name}</span>
              </div>
            )}

            {/* 风险原因 - 红色高亮 */}
            {order.risk_reason && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs font-medium text-red-500 mb-1">风险原因:</p>
                <p className="text-sm text-red-400">{order.risk_reason}</p>
              </div>
            )}

            {/* 时间信息 */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>支付于 {formatBeijingDateTime(order.paid_at)}</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={() => handleAction(order.out_trade_no, "approve")}
                disabled={processing === order.out_trade_no}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                确认发货
              </button>
              <button
                onClick={() => handleAction(order.out_trade_no, "reject")}
                disabled={processing === order.out_trade_no}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                拒绝退款
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
