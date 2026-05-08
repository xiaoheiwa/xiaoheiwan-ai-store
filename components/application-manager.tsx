"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, CheckCircle, XCircle, Clock, Eye, Copy, Check, Users } from "lucide-react"

interface Application {
  id: number
  username: string
  email: string
  phone: string | null
  reason: string | null
  promotion_channels: string | null
  expected_monthly_orders: number | null
  status: "pending" | "approved" | "rejected"
  admin_note: string | null
  reviewed_at: string | null
  created_at: string
}

interface ApprovalResult {
  email: string
  password: string
  referral_code: string
  commission_rate: number
}

export function ApplicationManager() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")

  const [approveForm, setApproveForm] = useState({
    commission_rate: "10",
    admin_note: "",
  })
  const [rejectNote, setRejectNote] = useState("")

  const loadApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/applications")
      const data = await res.json()
      if (data.success) {
        setApplications(data.data || [])
      }
    } catch (error) {
      console.error("加载申请列表失败:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  const handleApprove = async () => {
    if (!selectedApp) return
    setProcessing(selectedApp.id)
    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedApp.id,
          action: "approve",
          commission_rate: parseFloat(approveForm.commission_rate),
          admin_note: approveForm.admin_note || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setApprovalResult(data.data)
        setApproveOpen(false)
        setResultOpen(true)
        loadApplications()
      } else {
        alert(data.error || "操作失败")
      }
    } catch {
      alert("操作失败，请重试")
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async () => {
    if (!selectedApp) return
    setProcessing(selectedApp.id)
    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedApp.id,
          action: "reject",
          admin_note: rejectNote || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setRejectOpen(false)
        setRejectNote("")
        loadApplications()
      } else {
        alert(data.error || "操作失败")
      }
    } catch {
      alert("操作失败，请重试")
    } finally {
      setProcessing(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />待审核</Badge>
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />已通过</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />已拒绝</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredApplications = applications.filter(app => {
    if (activeTab === "all") return true
    return app.status === activeTab
  })

  const pendingCount = applications.filter(a => a.status === "pending").length

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">待审核</p>
                <p className="text-2xl font-bold">{applications.filter(a => a.status === "pending").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已通过</p>
                <p className="text-2xl font-bold">{applications.filter(a => a.status === "approved").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已拒绝</p>
                <p className="text-2xl font-bold">{applications.filter(a => a.status === "rejected").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-xl">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总申请</p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 申请列表 */}
      <Card>
        <CardHeader>
          <CardTitle>推广员申请</CardTitle>
          <CardDescription>审核用户的推广员申请，批准后将自动创建推广员账户</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="relative">
                待审核
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">已通过</TabsTrigger>
              <TabsTrigger value="rejected">已拒绝</TabsTrigger>
              <TabsTrigger value="all">全部</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  暂无{activeTab === "pending" ? "待审核的" : activeTab === "approved" ? "已通过的" : activeTab === "rejected" ? "已拒绝的" : ""}申请
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>申请人</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>推广渠道</TableHead>
                      <TableHead>预计月订单</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>申请时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.username}</TableCell>
                        <TableCell>{app.email}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{app.promotion_channels || "-"}</TableCell>
                        <TableCell>{app.expected_monthly_orders || "-"}</TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>{new Date(app.created_at).toLocaleDateString("zh-CN")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedApp(app)
                                setDetailOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {app.status === "pending" && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApp(app)
                                    setApproveForm({ commission_rate: "10", admin_note: "" })
                                    setApproveOpen(true)
                                  }}
                                >
                                  通过
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApp(app)
                                    setRejectNote("")
                                    setRejectOpen(true)
                                  }}
                                >
                                  拒绝
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>申请详情</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">申请人</p>
                  <p className="font-medium">{selectedApp.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  {getStatusBadge(selectedApp.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">邮箱</p>
                  <p className="font-medium">{selectedApp.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">电话</p>
                  <p className="font-medium">{selectedApp.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">预计月订单</p>
                  <p className="font-medium">{selectedApp.expected_monthly_orders || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">申请时间</p>
                  <p className="font-medium">{new Date(selectedApp.created_at).toLocaleString("zh-CN")}</p>
                </div>
              </div>
              {selectedApp.promotion_channels && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">推广渠道</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedApp.promotion_channels}</p>
                </div>
              )}
              {selectedApp.reason && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">申请理由</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedApp.reason}</p>
                </div>
              )}
              {selectedApp.admin_note && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">管理员备注</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedApp.admin_note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 批准弹窗 */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批准申请</DialogTitle>
            <DialogDescription>
              批准后将自动创建推广员账户，并生成登录密码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>佣金比例 (%)</Label>
              <Input
                type="number"
                value={approveForm.commission_rate}
                onChange={(e) => setApproveForm({ ...approveForm, commission_rate: e.target.value })}
                min="1"
                max="50"
              />
            </div>
            <div className="space-y-2">
              <Label>备注（选填）</Label>
              <Textarea
                value={approveForm.admin_note}
                onChange={(e) => setApproveForm({ ...approveForm, admin_note: e.target.value })}
                placeholder="内部备注，不会显示给申请人"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>取消</Button>
            <Button onClick={handleApprove} disabled={processing !== null}>
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              确认批准
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝弹窗 */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝申请</DialogTitle>
            <DialogDescription>
              请填写拒绝理由（可选）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="拒绝理由，可用于通知申请人"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing !== null}>
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              确认拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批准成功结果弹窗 */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              申请已批准
            </DialogTitle>
            <DialogDescription>
              推广员账户已创建，请将以下信息发送给申请人
            </DialogDescription>
          </DialogHeader>
          {approvalResult && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">邮箱</span>
                  <span className="font-medium">{approvalResult.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">初始密码</span>
                  <code className="font-mono bg-accent/10 px-2 py-1 rounded">{approvalResult.password}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">推广码</span>
                  <code className="font-mono bg-accent/10 px-2 py-1 rounded">{approvalResult.referral_code}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">佣金比例</span>
                  <span className="font-medium">{approvalResult.commission_rate}%</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  const text = `您的推广员申请已通过！\n\n登录邮箱: ${approvalResult.email}\n初始密码: ${approvalResult.password}\n推广码: ${approvalResult.referral_code}\n佣金比例: ${approvalResult.commission_rate}%\n\n请登录推广员面板查看详情: ${typeof window !== "undefined" ? window.location.origin : ""}/referrer`
                  copyToClipboard(text)
                }}
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "已复制" : "复制全部信息"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
