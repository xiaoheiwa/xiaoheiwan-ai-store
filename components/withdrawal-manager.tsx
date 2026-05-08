"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, Loader2, Check, X, Clock, DollarSign, Users } from "lucide-react"

interface Withdrawal {
  id: number
  referrer_id: number
  referrer_name: string
  referrer_email: string
  amount: number
  payment_method: string
  payment_account: string
  status: "pending" | "approved" | "rejected"
  admin_note: string | null
  created_at: string
  processed_at: string | null
}

const paymentMethods: Record<string, string> = {
  alipay: "支付宝",
  wechat: "微信",
  bank: "银行卡",
}

export function WithdrawalManager() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [processing, setProcessing] = useState(false)
  const [adminNote, setAdminNote] = useState("")

  const loadWithdrawals = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/withdrawals")
      const data = await res.json()
      if (data.success) {
        setWithdrawals(data.data)
      }
    } catch (err) {
      console.error("加载提现申请失败:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWithdrawals()
  }, [loadWithdrawals])

  // 处理提现申请
  async function handleProcess(action: "approved" | "rejected") {
    if (!selectedWithdrawal) return

    setProcessing(true)
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedWithdrawal.id,
          status: action,
          admin_note: adminNote.trim() || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setProcessDialogOpen(false)
        setSelectedWithdrawal(null)
        setAdminNote("")
        loadWithdrawals()
      } else {
        alert(data.error || "处理失败")
      }
    } catch (err) {
      console.error("处理提现申请失败:", err)
      alert("处理失败，请重试")
    } finally {
      setProcessing(false)
    }
  }

  // 打开处理对话框
  function openProcessDialog(withdrawal: Withdrawal) {
    setSelectedWithdrawal(withdrawal)
    setAdminNote("")
    setProcessDialogOpen(true)
  }

  // 筛选提现申请
  const filteredWithdrawals = activeTab === "all"
    ? withdrawals
    : withdrawals.filter(w => w.status === activeTab)

  // 统计数据
  const stats = {
    pending: withdrawals.filter(w => w.status === "pending").length,
    pendingAmount: withdrawals.filter(w => w.status === "pending").reduce((sum, w) => sum + w.amount, 0),
    approved: withdrawals.filter(w => w.status === "approved").length,
    approvedAmount: withdrawals.filter(w => w.status === "approved").reduce((sum, w) => sum + w.amount, 0),
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              提现管理
            </CardTitle>
            <CardDescription>处理推广用户的提现申请</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="w-4 h-4" />
              待处理
            </div>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              待处理金额
            </div>
            <div className="text-2xl font-bold">¥{stats.pendingAmount.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Check className="w-4 h-4" />
              已完成
            </div>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              已付金额
            </div>
            <div className="text-2xl font-bold">¥{stats.approvedAmount.toFixed(2)}</div>
          </div>
        </div>

        {/* 标签页筛选 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="pending">待处理 ({stats.pending})</TabsTrigger>
            <TabsTrigger value="approved">已完成</TabsTrigger>
            <TabsTrigger value="rejected">已拒绝</TabsTrigger>
            <TabsTrigger value="all">全部</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 提现列表 */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无提现申请</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>推广用户</TableHead>
                <TableHead>提现金额</TableHead>
                <TableHead>收款方式</TableHead>
                <TableHead>收款账号</TableHead>
                <TableHead>申请时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{withdrawal.referrer_name}</div>
                      <div className="text-xs text-muted-foreground">{withdrawal.referrer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-accent">
                    ¥{withdrawal.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {paymentMethods[withdrawal.payment_method] || withdrawal.payment_method}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={withdrawal.payment_account}>
                    {withdrawal.payment_account}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(withdrawal.created_at).toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    {withdrawal.status === "pending" && (
                      <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        待处理
                      </Badge>
                    )}
                    {withdrawal.status === "approved" && (
                      <Badge variant="outline" className="text-green-500 border-green-500/30">
                        <Check className="w-3 h-3 mr-1" />
                        已完成
                      </Badge>
                    )}
                    {withdrawal.status === "rejected" && (
                      <Badge variant="outline" className="text-destructive border-destructive/30">
                        <X className="w-3 h-3 mr-1" />
                        已拒绝
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {withdrawal.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openProcessDialog(withdrawal)}
                      >
                        处理
                      </Button>
                    )}
                    {withdrawal.admin_note && (
                      <span className="text-xs text-muted-foreground ml-2" title={withdrawal.admin_note}>
                        备注
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* 处理对话框 */}
        <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>处理提现申请</DialogTitle>
              <DialogDescription>
                确认处理 {selectedWithdrawal?.referrer_name} 的提现申请
              </DialogDescription>
            </DialogHeader>

            {selectedWithdrawal && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">提现金额</p>
                    <p className="text-xl font-bold text-accent">¥{selectedWithdrawal.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">收款方式</p>
                    <p className="font-medium">{paymentMethods[selectedWithdrawal.payment_method]}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">收款账号</p>
                    <p className="font-mono">{selectedWithdrawal.payment_account}</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">备注（可选）</label>
                  <Input
                    placeholder="添加处理备注..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleProcess("rejected")}
                disabled={processing}
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                <X className="w-4 h-4 mr-1" />
                拒绝
              </Button>
              <Button
                onClick={() => handleProcess("approved")}
                disabled={processing}
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                <Check className="w-4 h-4 mr-1" />
                批准并已打款
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
