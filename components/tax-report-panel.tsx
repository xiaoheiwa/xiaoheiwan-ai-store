"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Calculator, Download, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TaxReportPanelProps {
  adminToken: string
}

interface TaxReportData {
  ok: boolean
  period: {
    from: string
    to: string
    timezone: string
  }
  rates: {
    vatRate: number
    surchargeRate: number
    incomeTaxRate: number
    vatExempt: boolean
  }
  summary: {
    orderCount: number
    totalQuantity: number
    totalRevenue: number
    taxExclusiveRevenue: number
    costReference: number
    profitBeforeIncomeTax: number
    estimatedVat: number
    estimatedSurcharge: number
    estimatedIncomeTax: number
    estimatedTotalTax: number
    averageOrderValue: number
    smallScaleExemptionReference: boolean
  }
  breakdown: {
    byProduct: {
      productId: string | null
      productName: string
      categoryName: string
      orderCount: number
      quantity: number
      revenue: number
    }[]
    byPayment: {
      paymentName: string
      orderCount: number
      revenue: number
    }[]
    byMonth: {
      month: string
      orderCount: number
      revenue: number
    }[]
  }
  purchaseBatches: {
    id: string | number
    batchName: string
    productName: string
    unitCost: number
    quantity: number
    totalCost: number
    supplier: string
    createdAtText: string
  }[]
  orders: {
    out_trade_no: string
    email: string | null
    status: string
    region_name: string | null
    selected_region: string | null
    reportDateText: string
    amount: number
    quantity: number
    productName: string
    categoryName: string
    paymentName: string
    deliveryName: string
  }[]
  notes: string[]
}

const CHINA_OFFSET_MS = 8 * 60 * 60 * 1000

function pad2(value: number) {
  return String(value).padStart(2, "0")
}

function chinaDateInput(date = new Date()) {
  const chinaDate = new Date(date.getTime() + CHINA_OFFSET_MS)
  return `${chinaDate.getUTCFullYear()}-${pad2(chinaDate.getUTCMonth() + 1)}-${pad2(chinaDate.getUTCDate())}`
}

function monthStart(dateValue: string) {
  return `${dateValue.slice(0, 8)}01`
}

function currency(value: number) {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function numberText(value: number) {
  return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
}

export function TaxReportPanel({ adminToken }: TaxReportPanelProps) {
  const today = chinaDateInput()
  const [from, setFrom] = useState(monthStart(today))
  const [to, setTo] = useState(today)
  const [vatRate, setVatRate] = useState("1")
  const [surchargeRate, setSurchargeRate] = useState("12")
  const [incomeTaxRate, setIncomeTaxRate] = useState("0")
  const [vatExempt, setVatExempt] = useState(false)
  const [data, setData] = useState<TaxReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [message, setMessage] = useState("")

  const buildParams = useCallback((format?: "json" | "csv") => {
    const params = new URLSearchParams({
      from,
      to,
      vatRate,
      surchargeRate,
      incomeTaxRate,
      vatExempt: String(vatExempt),
    })
    if (format) params.set("format", format)
    return params
  }, [from, to, vatRate, surchargeRate, incomeTaxRate, vatExempt])

  const loadReport = useCallback(async () => {
    setLoading(true)
    setMessage("")
    try {
      const res = await fetch(`/api/admin/tax-report?${buildParams("json").toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "加载失败")
      }
      setData(json)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载失败")
    }
    setLoading(false)
  }, [adminToken, buildParams])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const downloadCsv = async () => {
    setDownloading(true)
    setMessage("")
    try {
      const res = await fetch(`/api/admin/tax-report?${buildParams("csv").toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      if (!res.ok) throw new Error("导出失败")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `报税订单明细-${from}-至-${to}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setMessage("CSV 明细已下载")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导出失败")
    }
    setDownloading(false)
  }

  const summaryCards = data ? [
    { label: "已支付收入", value: currency(data.summary.totalRevenue), helper: "按支付完成时间统计" },
    { label: "订单数量", value: `${data.summary.orderCount}`, helper: `商品数量 ${numberText(data.summary.totalQuantity)}` },
    { label: "成本参考", value: currency(data.summary.costReference), helper: "来自后台采购批次" },
    { label: "不含税收入估算", value: currency(data.summary.taxExclusiveRevenue), helper: "按当前税率倒算" },
    { label: "增值税估算", value: currency(data.summary.estimatedVat), helper: vatExempt ? "已按免征估算" : `税率 ${data.rates.vatRate}%` },
    { label: "税费合计估算", value: currency(data.summary.estimatedTotalTax), helper: "含附加和所得税估算" },
  ] : []

  return (
    <div className="space-y-6">
      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {"这里做的是报税资料整理和税费辅助估算，不是自动申报。税率、免征和所得税口径，请按你的纳税身份和当地电子税务局要求确认。"}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5" />
            {"报税期间和估算参数"}
          </CardTitle>
          <CardDescription>{"建议每月或每季度导出一次，作为申报前给会计核对的底稿。"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax-from">{"开始日期"}</Label>
              <Input id="tax-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-to">{"结束日期"}</Label>
              <Input id="tax-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat-rate">{"增值税率 %"}</Label>
              <Input id="vat-rate" type="number" min="0" step="0.1" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surcharge-rate">{"附加税率 %"}</Label>
              <Input id="surcharge-rate" type="number" min="0" step="0.1" value={surchargeRate} onChange={(e) => setSurchargeRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-tax-rate">{"所得税估算 %"}</Label>
              <Input id="income-tax-rate" type="number" min="0" step="0.1" value={incomeTaxRate} onChange={(e) => setIncomeTaxRate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={vatExempt}
                onChange={(e) => setVatExempt(e.target.checked)}
                className="mt-1 rounded"
              />
              <span>{"按小规模免征增值税估算。只有确认自己符合条件时再勾选。"}</span>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadReport} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {"刷新"}
              </Button>
              <Button onClick={downloadCsv} disabled={downloading || loading}>
                {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {"导出明细"}
              </Button>
            </div>
          </div>

          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
            {summaryCards.map((card) => (
              <Card key={card.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-xl font-bold">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.helper}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.summary.smallScaleExemptionReference && !vatExempt && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {"当前选择的是单月期间，收入未超过 10 万。若你确认为小规模纳税人，可能需要按免征口径估算；建议交给会计确认后再勾选。"}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{"按商品汇总"}</CardTitle>
                <CardDescription>{"用于核对不同商品的销售额和数量。"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b text-muted-foreground">
                      <tr>
                        <th className="py-2 text-left font-medium">{"商品"}</th>
                        <th className="py-2 text-right font-medium">{"订单"}</th>
                        <th className="py-2 text-right font-medium">{"数量"}</th>
                        <th className="py-2 text-right font-medium">{"收入"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.breakdown.byProduct.map((item) => (
                        <tr key={item.productId || item.productName}>
                          <td className="py-3 pr-3">
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-xs text-muted-foreground">{item.categoryName}</div>
                          </td>
                          <td className="py-3 text-right">{item.orderCount}</td>
                          <td className="py-3 text-right">{numberText(item.quantity)}</td>
                          <td className="py-3 text-right font-medium">{currency(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{"按支付方式汇总"}</CardTitle>
                <CardDescription>{"用于核对支付宝、微信、USDT 等收款渠道。"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.breakdown.byPayment.map((item) => (
                    <div key={item.paymentName} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{item.paymentName}</p>
                        <p className="text-xs text-muted-foreground">{item.orderCount} {"笔订单"}</p>
                      </div>
                      <p className="font-semibold">{currency(item.revenue)}</p>
                    </div>
                  ))}
                  {data.breakdown.byPayment.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">{"这个期间暂无已支付订单"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="h-5 w-5" />
                {"订单明细预览"}
              </CardTitle>
              <CardDescription>{"页面只预览最近 80 条；完整明细请点击“导出明细”。"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left font-medium">{"时间"}</th>
                      <th className="p-3 text-left font-medium">{"订单"}</th>
                      <th className="p-3 text-left font-medium">{"商品"}</th>
                      <th className="p-3 text-right font-medium">{"数量"}</th>
                      <th className="p-3 text-right font-medium">{"金额"}</th>
                      <th className="p-3 text-left font-medium">{"支付"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.orders.slice(0, 80).map((order) => (
                      <tr key={order.out_trade_no}>
                        <td className="p-3 whitespace-nowrap text-muted-foreground">{order.reportDateText}</td>
                        <td className="p-3">
                          <div className="font-mono text-xs">{order.out_trade_no}</div>
                          <div className="text-xs text-muted-foreground">{order.email || "无邮箱"}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{order.productName}</div>
                          <div className="mt-1 flex gap-1">
                            <Badge variant="secondary">{order.deliveryName}</Badge>
                            {(order.region_name || order.selected_region) && (
                              <Badge variant="outline">{order.region_name || order.selected_region}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">{numberText(order.quantity)}</td>
                        <td className="p-3 text-right font-medium">{currency(order.amount)}</td>
                        <td className="p-3">{order.paymentName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.orders.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">{"这个期间暂无已支付订单"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{"采购成本参考"}</CardTitle>
              <CardDescription>{"这里显示本期间录入的采购批次，方便会计核对成本底稿。"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left font-medium">{"时间"}</th>
                      <th className="p-3 text-left font-medium">{"批次"}</th>
                      <th className="p-3 text-left font-medium">{"商品"}</th>
                      <th className="p-3 text-right font-medium">{"数量"}</th>
                      <th className="p-3 text-right font-medium">{"总成本"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.purchaseBatches.slice(0, 50).map((batch) => (
                      <tr key={batch.id}>
                        <td className="p-3 whitespace-nowrap text-muted-foreground">{batch.createdAtText}</td>
                        <td className="p-3">{batch.batchName}</td>
                        <td className="p-3">{batch.productName}</td>
                        <td className="p-3 text-right">{numberText(batch.quantity)}</td>
                        <td className="p-3 text-right font-medium">{currency(batch.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.purchaseBatches.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">{"这个期间暂无采购批次记录"}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {"报税资料加载失败，请刷新重试。"}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
