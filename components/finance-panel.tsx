"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Percent,
  RefreshCw,
  Loader2,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react"

interface FinancePanelProps {
  adminToken: string
}

interface FinanceData {
  summary: {
    totalCost: number
    totalRevenue: number
    totalProfit: number
    profitMargin: number
    totalSold: number
    totalStock: number
  }
  products: {
    id: string
    name: string
    salePrice: number
    deliveryType: string
    totalCost: number
    totalPurchased: number
    avgUnitCost: number
    soldCount: number
    availableCount: number
    pendingFulfillCount: number
    revenue: number
    profit: number
  }[]
  trend: {
    month: string
    cost: number
    revenue: number
    profit: number
  }[]
  batches: {
    id: string
    batch_name: string
    product_name: string | null
    unit_cost: number
    quantity: number
    total_cost: number
    supplier: string | null
    notes: string | null
    codes_count: number
    sold_count: number
    created_at: string
  }[]
}

function formatCurrency(v: number) {
  return v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function FinancePanel({ adminToken }: FinancePanelProps) {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingBatch, setEditingBatch] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ batchName: "", unitCost: "", quantity: "", supplier: "", notes: "" })
  const [saving, setSaving] = useState(false)
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/finance", {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      const json = await res.json()
      if (json.ok) setData(json)
    } catch (e) {
      console.error("Finance load error:", e)
    }
    setLoading(false)
  }, [adminToken])

  useEffect(() => { loadData() }, [loadData])

  const startEdit = (batch: FinanceData["batches"][0]) => {
    setEditingBatch(batch.id)
    setEditForm({
      batchName: batch.batch_name,
      unitCost: String(batch.unit_cost),
      quantity: String(batch.quantity),
      supplier: batch.supplier || "",
      notes: batch.notes || "",
    })
  }

  const cancelEdit = () => {
    setEditingBatch(null)
    setEditForm({ batchName: "", unitCost: "", quantity: "", supplier: "", notes: "" })
  }

  const handleSaveBatch = async () => {
    if (!editingBatch) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/batches", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          id: editingBatch,
          batchName: editForm.batchName,
          unitCost: Number(editForm.unitCost),
          quantity: Number(editForm.quantity),
          supplier: editForm.supplier || null,
          notes: editForm.notes || null,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setMessage("批次已更新")
        cancelEdit()
        loadData()
      } else {
        setMessage(json.error || "更新失败")
      }
    } catch {
      setMessage("更新失败")
    }
    setSaving(false)
    setTimeout(() => setMessage(""), 3000)
  }

  const handleDeleteBatch = async (id: string) => {
    setDeletingBatch(id)
    try {
      const res = await fetch("/api/admin/batches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (res.ok) {
        setMessage("批次已删除")
        loadData()
      } else {
        setMessage(json.error || "删除失败")
      }
    } catch {
      setMessage("删除失败")
    }
    setDeletingBatch(null)
    setTimeout(() => setMessage(""), 3000)
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {"加载财务数据失败"}
        <Button variant="outline" size="sm" className="ml-3" onClick={loadData}>{"重试"}</Button>
      </div>
    )
  }

  const { summary, products, trend, batches } = data

  const summaryCards = [
    { label: "总成本", value: formatCurrency(summary.totalCost), icon: DollarSign, color: "#ef4444" },
    { label: "总收入", value: formatCurrency(summary.totalRevenue), icon: ShoppingCart, color: "#3b82f6" },
    {
      label: "总利润",
      value: formatCurrency(summary.totalProfit),
      icon: summary.totalProfit >= 0 ? TrendingUp : TrendingDown,
      color: summary.totalProfit >= 0 ? "#22c55e" : "#ef4444",
    },
    { label: "利润率", value: `${summary.profitMargin.toFixed(1)}%`, icon: Percent, color: "#a855f7" },
    { label: "已售出", value: `${summary.totalSold}`, icon: ShoppingCart, color: "#f59e0b" },
    { label: "库存", value: `${summary.totalStock}`, icon: Package, color: "#6366f1" },
  ]

  // Compute colors in JS (not CSS variables) for Recharts
  const chartColors = {
    cost: "#ef4444",
    revenue: "#3b82f6",
    profit: "#22c55e",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          {"刷新"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: card.color }}>{card.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{"月度收支趋势"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              cost: { label: "成本", color: chartColors.cost },
              revenue: { label: "收入", color: chartColors.revenue },
              profit: { label: "利润", color: chartColors.profit },
            }}
            className="h-[280px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="cost" fill={chartColors.cost} name="成本" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill={chartColors.revenue} name="收入" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill={chartColors.profit} name="利润" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Per-product breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{"按产品进销存"}</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{"暂无产品数据"}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">{"产品"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{"采购数"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{"均价成本"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{"总成本"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{"售价"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{"已售"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{"库存"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{"收入"}</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">{"利润"}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{p.name}</span>
                          <Badge variant="outline" className={`text-[10px] px-1 py-0 ${p.deliveryType === "manual" ? "border-amber-500/50 text-amber-600" : "border-emerald-500/50 text-emerald-600"}`}>
                            {p.deliveryType === "manual" ? "人工" : "自动"}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-right">{p.totalPurchased}</td>
                      <td className="py-2.5 pr-4 text-right">{formatCurrency(p.avgUnitCost)}</td>
                      <td className="py-2.5 pr-4 text-right text-red-500">{formatCurrency(p.totalCost)}</td>
                      <td className="py-2.5 pr-4 text-right">{formatCurrency(p.salePrice)}</td>
                      <td className="py-2.5 pr-4 text-right">
                        {p.soldCount}
                        {p.pendingFulfillCount > 0 && (
                          <span className="text-orange-500 text-xs ml-1">(+{p.pendingFulfillCount}{"待发"})</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        {p.deliveryType === "manual" ? (
                          <Badge variant="secondary" className="text-xs">{"按需"}</Badge>
                        ) : (
                          <Badge variant={p.availableCount > 0 ? "secondary" : "destructive"} className="text-xs">
                            {p.availableCount}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-blue-500">{formatCurrency(p.revenue)}</td>
                      <td className={`py-2.5 text-right font-medium ${p.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {p.profit >= 0 ? "+" : ""}{formatCurrency(p.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Batches */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{"采购批次记录"}</CardTitle>
            {message && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent">{message}</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{"暂无采购记录，导入激活码时填写成本信息即可自动生成"}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">{"批次"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">{"产品"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{"单价"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{"数量"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{"总成本"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{"已售"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">{"供应商"}</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">{"日期"}</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">{"操作"}</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    editingBatch === b.id ? (
                      <tr key={b.id} className="border-b bg-secondary/30">
                        <td className="py-2 pr-2">
                          <input
                            value={editForm.batchName}
                            onChange={(e) => setEditForm({ ...editForm, batchName: e.target.value })}
                            className="w-full px-2 py-1 border border-input bg-background rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </td>
                        <td className="py-2 pr-2 text-muted-foreground text-xs">{b.product_name || "-"}</td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editForm.unitCost}
                            onChange={(e) => setEditForm({ ...editForm, unitCost: e.target.value })}
                            className="w-20 px-2 py-1 border border-input bg-background rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            min="1"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                            className="w-16 px-2 py-1 border border-input bg-background rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </td>
                        <td className="py-2 pr-2 text-right text-muted-foreground text-xs">
                          {editForm.unitCost && editForm.quantity
                            ? formatCurrency(Number(editForm.unitCost) * Number(editForm.quantity))
                            : "-"}
                        </td>
                        <td className="py-2 pr-2 text-right text-muted-foreground text-xs">
                          {b.sold_count}/{editForm.quantity || b.quantity}
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            value={editForm.supplier}
                            onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                            placeholder="-"
                            className="w-full px-2 py-1 border border-input bg-background rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </td>
                        <td className="py-2 pr-2 text-muted-foreground text-xs">
                          {new Date(b.created_at).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSaveBatch}
                              disabled={saving}
                              className="h-7 w-7 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                            >
                              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              disabled={saving}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={b.id} className="border-b last:border-0 group hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-4 font-medium">{b.batch_name}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{b.product_name || "-"}</td>
                        <td className="py-2.5 pr-4 text-right">{formatCurrency(Number(b.unit_cost))}</td>
                        <td className="py-2.5 pr-4 text-right">{b.quantity}</td>
                        <td className="py-2.5 pr-4 text-right text-red-500">{formatCurrency(Number(b.total_cost))}</td>
                        <td className="py-2.5 pr-4 text-right">
                          <span className={Number(b.sold_count) > 0 ? "text-green-500" : "text-muted-foreground"}>
                            {b.sold_count}/{b.quantity}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{b.supplier || "-"}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                          {new Date(b.created_at).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(b)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="编辑批次"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBatch(b.id)}
                              disabled={deletingBatch === b.id}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              title="删除批次"
                            >
                              {deletingBatch === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes input for editing batch */}
          {editingBatch && (
            <div className="mt-3 p-3 rounded-lg bg-secondary/30 border border-border">
              <Label className="text-xs text-muted-foreground">{"备注"}</Label>
              <input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="采购备注..."
                className="w-full mt-1 px-3 py-1.5 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
