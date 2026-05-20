import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const CHINA_OFFSET_MS = 8 * 60 * 60 * 1000

type OrderRow = {
  out_trade_no: string
  email: string | null
  amount: number | string | null
  subject: string | null
  status: string
  pay_channel: string | null
  quantity: number | string | null
  delivery_type: string | null
  selected_region: string | null
  region_name: string | null
  created_at: string | Date | null
  paid_at: string | Date | null
  fulfilled_at: string | Date | null
  product_id: string | null
  product_name: string | null
  category_name: string | null
}

type PurchaseBatchRow = {
  id: number | string
  batch_name: string | null
  product_id: string | null
  product_name: string | null
  unit_cost: number | string | null
  quantity: number | string | null
  total_cost: number | string | null
  supplier: string | null
  notes: string | null
  created_at: string | Date | null
}

function pad2(value: number) {
  return String(value).padStart(2, "0")
}

function isDateOnly(value: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

function formatChinaDate(date: Date) {
  const chinaDate = new Date(date.getTime() + CHINA_OFFSET_MS)
  return `${chinaDate.getUTCFullYear()}-${pad2(chinaDate.getUTCMonth() + 1)}-${pad2(chinaDate.getUTCDate())}`
}

function formatChinaDateTime(date: Date | null) {
  if (!date) return ""
  const chinaDate = new Date(date.getTime() + CHINA_OFFSET_MS)
  return `${chinaDate.getUTCFullYear()}-${pad2(chinaDate.getUTCMonth() + 1)}-${pad2(chinaDate.getUTCDate())} ${pad2(chinaDate.getUTCHours())}:${pad2(chinaDate.getUTCMinutes())}:${pad2(chinaDate.getUTCSeconds())}`
}

function addDays(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split("-").map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`
}

function chinaDateStartToUtc(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day) - CHINA_OFFSET_MS)
}

function parseDbDate(value: string | Date | null | undefined) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const text = String(value).trim()
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(text)
    ? `${text.replace(" ", "T")}Z`
    : text
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseRate(value: string | null, fallback: number) {
  if (value === null || value === "") return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(100, Math.max(0, parsed))
}

function paymentLabel(value: string | null) {
  const channel = String(value || "").toLowerCase()
  if (channel.includes("alipay")) return "支付宝"
  if (channel.includes("wechat") || channel.includes("wxpay")) return "微信支付"
  if (channel.includes("usdt") || channel.includes("crypto")) return "USDT"
  return value || "未知"
}

function deliveryLabel(value: string | null) {
  return value === "manual" ? "人工发货" : "自动发货"
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return ""
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + getValue(item), 0)
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const url = new URL(request.url)
    const today = formatChinaDate(new Date())
    const monthStart = `${today.slice(0, 8)}01`
    const from = isDateOnly(url.searchParams.get("from")) ? url.searchParams.get("from")! : monthStart
    const to = isDateOnly(url.searchParams.get("to")) ? url.searchParams.get("to")! : today
    const startUtc = chinaDateStartToUtc(from)
    const endUtc = chinaDateStartToUtc(addDays(to, 1))
    const format = url.searchParams.get("format") || "json"

    const vatRate = parseRate(url.searchParams.get("vatRate"), 1)
    const surchargeRate = parseRate(url.searchParams.get("surchargeRate"), 12)
    const incomeTaxRate = parseRate(url.searchParams.get("incomeTaxRate"), 0)
    const vatExempt = url.searchParams.get("vatExempt") === "true"

    const [orderRows, purchaseBatchRows] = await Promise.all([
      sql`
        SELECT
          o.out_trade_no,
          o.email,
          o.amount,
          o.subject,
          o.status,
          o.pay_channel,
          COALESCE(o.quantity, 1) as quantity,
          COALESCE(o.delivery_type, 'auto') as delivery_type,
          o.selected_region,
          o.region_name,
          o.created_at,
          o.paid_at,
          o.fulfilled_at,
          o.product_id,
          p.name as product_name,
          pc.name as category_name
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE o.status = 'paid'
        ORDER BY COALESCE(o.paid_at, o.created_at) DESC
      `,
      sql`
        SELECT
          pb.id,
          pb.batch_name,
          pb.product_id,
          p.name as product_name,
          pb.unit_cost,
          pb.quantity,
          pb.total_cost,
          pb.supplier,
          pb.notes,
          pb.created_at
        FROM purchase_batches pb
        LEFT JOIN products p ON pb.product_id = p.id
        ORDER BY pb.created_at DESC
      `,
    ])

    const orders = (orderRows as OrderRow[])
      .map((order) => {
        const reportDate = parseDbDate(order.paid_at) || parseDbDate(order.created_at)
        const amount = numberValue(order.amount)
        const quantity = numberValue(order.quantity) || 1
        return {
          ...order,
          reportDate,
          reportDateText: formatChinaDateTime(reportDate),
          amount,
          quantity,
          productName: order.product_name || order.subject || "未命名商品",
          categoryName: order.category_name || "未分类",
          paymentName: paymentLabel(order.pay_channel),
          deliveryName: deliveryLabel(order.delivery_type),
        }
      })
      .filter((order) => order.reportDate && order.reportDate >= startUtc && order.reportDate < endUtc)

    const purchaseBatches = (purchaseBatchRows as PurchaseBatchRow[])
      .map((batch) => {
        const createdAt = parseDbDate(batch.created_at)
        return {
          id: batch.id,
          batchName: batch.batch_name || "未命名批次",
          productId: batch.product_id,
          productName: batch.product_name || "未关联商品",
          unitCost: numberValue(batch.unit_cost),
          quantity: numberValue(batch.quantity),
          totalCost: numberValue(batch.total_cost),
          supplier: batch.supplier || "",
          notes: batch.notes || "",
          createdAt,
          createdAtText: formatChinaDateTime(createdAt),
        }
      })
      .filter((batch) => batch.createdAt && batch.createdAt >= startUtc && batch.createdAt < endUtc)

    const totalRevenue = sumBy(orders, (order) => order.amount)
    const totalQuantity = sumBy(orders, (order) => order.quantity)
    const costReference = sumBy(purchaseBatches, (batch) => batch.totalCost)
    const vatRateDecimal = vatRate / 100
    const taxExclusiveRevenue = vatExempt || vatRateDecimal === 0
      ? totalRevenue
      : totalRevenue / (1 + vatRateDecimal)
    const estimatedVat = vatExempt ? 0 : totalRevenue - taxExclusiveRevenue
    const estimatedSurcharge = estimatedVat * (surchargeRate / 100)
    const profitBeforeIncomeTax = Math.max(0, taxExclusiveRevenue - costReference)
    const estimatedIncomeTax = profitBeforeIncomeTax * (incomeTaxRate / 100)
    const estimatedTotalTax = estimatedVat + estimatedSurcharge + estimatedIncomeTax

    const byProduct = Array.from(
      orders.reduce((map, order) => {
        const key = order.product_id || order.productName
        const current = map.get(key) || {
          productId: order.product_id,
          productName: order.productName,
          categoryName: order.categoryName,
          orderCount: 0,
          quantity: 0,
          revenue: 0,
        }
        current.orderCount += 1
        current.quantity += order.quantity
        current.revenue += order.amount
        map.set(key, current)
        return map
      }, new Map<string, { productId: string | null; productName: string; categoryName: string; orderCount: number; quantity: number; revenue: number }>())
        .values(),
    ).sort((a, b) => b.revenue - a.revenue)

    const byPayment = Array.from(
      orders.reduce((map, order) => {
        const key = order.paymentName
        const current = map.get(key) || { paymentName: key, orderCount: 0, revenue: 0 }
        current.orderCount += 1
        current.revenue += order.amount
        map.set(key, current)
        return map
      }, new Map<string, { paymentName: string; orderCount: number; revenue: number }>())
        .values(),
    ).sort((a, b) => b.revenue - a.revenue)

    const byMonth = Array.from(
      orders.reduce((map, order) => {
        const month = order.reportDate ? formatChinaDate(order.reportDate).slice(0, 7) : "未知"
        const current = map.get(month) || { month, orderCount: 0, revenue: 0 }
        current.orderCount += 1
        current.revenue += order.amount
        map.set(month, current)
        return map
      }, new Map<string, { month: string; orderCount: number; revenue: number }>())
        .values(),
    ).sort((a, b) => a.month.localeCompare(b.month))

    const coversSingleMonth = from.slice(0, 7) === to.slice(0, 7)
    const smallScaleExemptionReference = coversSingleMonth && totalRevenue <= 100000

    if (format === "csv") {
      const headers = [
        "收入确认时间(中国时间)",
        "订单号",
        "客户邮箱",
        "商品",
        "分类",
        "数量",
        "金额",
        "支付方式",
        "发货方式",
        "区域",
        "订单状态",
      ]
      const rows = orders.map((order) => [
        order.reportDateText,
        order.out_trade_no,
        order.email || "",
        order.productName,
        order.categoryName,
        order.quantity,
        order.amount.toFixed(2),
        order.paymentName,
        order.deliveryName,
        order.region_name || order.selected_region || "",
        order.status,
      ])
      const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n")}`

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="tax-report-${from}-to-${to}.csv"`,
          "Cache-Control": "no-store",
        },
      })
    }

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      period: {
        from,
        to,
        timezone: "Asia/Shanghai",
      },
      rates: {
        vatRate,
        surchargeRate,
        incomeTaxRate,
        vatExempt,
      },
      summary: {
        orderCount: orders.length,
        totalQuantity,
        totalRevenue,
        taxExclusiveRevenue,
        costReference,
        profitBeforeIncomeTax,
        estimatedVat,
        estimatedSurcharge,
        estimatedIncomeTax,
        estimatedTotalTax,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        smallScaleExemptionReference,
      },
      breakdown: {
        byProduct,
        byPayment,
        byMonth,
      },
      purchaseBatches,
      orders,
      notes: [
        "本功能只整理后台订单和成本记录，不代替纳税申报或会计判断。",
        "采购成本为后台批次记录参考，不等同于最终可税前扣除金额。",
        "税率、免征、附加税和所得税口径请按你的纳税身份、主管税务机关和会计确认。",
      ],
    })
  } catch (error: any) {
    console.error("[v0] Tax report API error:", error)
    return NextResponse.json({ ok: false, error: error.message || "生成报税资料失败" }, { status: 500 })
  }
}
