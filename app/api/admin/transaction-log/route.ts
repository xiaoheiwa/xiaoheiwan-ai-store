import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {

    const url = new URL(request.url)
    const format = url.searchParams.get("format") || "json"
    const startDate = url.searchParams.get("start_date")
    const endDate = url.searchParams.get("end_date")

    console.log("[v0] Generating transaction log with parameters:", { format, startDate, endDate })

    // Build date filter
    let dateFilter = ""
    const params: any[] = []
    if (startDate && endDate) {
      dateFilter = "WHERE o.created_at >= $1 AND o.created_at <= $2"
      params.push(startDate, endDate)
    } else if (startDate) {
      dateFilter = "WHERE o.created_at >= $1"
      params.push(startDate)
    } else if (endDate) {
      dateFilter = "WHERE o.created_at <= $1"
      params.push(endDate)
    }

    const transactionData = await sql`
      SELECT 
        o.out_trade_no as transaction_id,
        o.email as customer_email,
        o.amount as transaction_amount,
        o.status as transaction_status,
        o.pay_channel as payment_method,
        o.code as activation_code,
        COALESCE(o.quantity, 1) as quantity,
        COALESCE(o.delivery_type, 'auto') as delivery_type,
        o.created_at as order_created,
        o.paid_at as payment_completed,
        o.fulfilled_at as fulfillment_completed,
        o.gateway_resp as gateway_response,
        o.subject as order_subject,
        CASE 
          WHEN o.status = 'paid' THEN 'SUCCESS'
          WHEN o.status = 'pending' THEN 'PENDING'
          WHEN o.status = 'failed' THEN 'FAILED'
          ELSE 'UNKNOWN'
        END as transaction_result
      FROM orders o
      ${dateFilter ? sql.unsafe(dateFilter) : sql``}
      ORDER BY o.created_at DESC
    `

    const summaryStats = await sql`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'paid' THEN amount END), 0) as average_transaction_value,
        MIN(created_at) as earliest_transaction,
        MAX(created_at) as latest_transaction
      FROM orders
      ${dateFilter ? sql.unsafe(dateFilter) : sql``}
    `

    const summary = summaryStats[0]

    const transactionLog = {
      generated_at: new Date().toISOString(),
      report_period: {
        start_date: startDate || "All time",
        end_date: endDate || "All time",
      },
      summary: {
        total_transactions: Number.parseInt(summary.total_transactions),
        successful_transactions: Number.parseInt(summary.successful_transactions),
        pending_transactions: Number.parseInt(summary.pending_transactions),
        failed_transactions: Number.parseInt(summary.failed_transactions),
        success_rate:
          summary.total_transactions > 0
            ? (
                (Number.parseInt(summary.successful_transactions) / Number.parseInt(summary.total_transactions)) *
                100
              ).toFixed(2) + "%"
            : "0%",
        total_revenue: Number.parseFloat(summary.total_revenue),
        average_transaction_value: Number.parseFloat(summary.average_transaction_value),
        earliest_transaction: summary.earliest_transaction,
        latest_transaction: summary.latest_transaction,
      },
      transactions: transactionData.map((tx) => ({
        transaction_id: tx.transaction_id,
        customer_email: tx.customer_email,
        amount: Number.parseFloat(tx.transaction_amount),
        quantity: Number.parseInt(tx.quantity),
        delivery_type: tx.delivery_type,
        status: tx.transaction_status,
        result: tx.transaction_result,
        payment_method: tx.payment_method,
        activation_code: tx.activation_code,
        order_subject: tx.order_subject,
        timestamps: {
          order_created: tx.order_created,
          payment_completed: tx.payment_completed,
          fulfillment_completed: tx.fulfillment_completed,
        },
        gateway_response: tx.gateway_response ? JSON.parse(tx.gateway_response) : null,
      })),
    }

    if (format === "csv") {
      const csvHeaders = [
        "Transaction ID",
        "Customer Email",
        "Amount",
        "Quantity",
        "Delivery Type",
        "Status",
        "Payment Method",
        "Activation Code",
        "Order Created",
        "Payment Completed",
        "Fulfillment Completed",
      ].join(",")

      const csvRows = transactionData.map((tx) =>
        [
          tx.transaction_id,
          tx.customer_email,
          tx.transaction_amount,
          tx.quantity,
          tx.delivery_type,
          tx.transaction_status,
          tx.payment_method,
          `"${(tx.activation_code || "").replace(/"/g, '""')}"`,
          tx.order_created,
          tx.payment_completed || "",
          tx.fulfillment_completed || "",
        ].join(","),
      )

      const csvContent = [csvHeaders, ...csvRows].join("\n")

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="transaction-log-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    console.log("[v0] Transaction log generated successfully:", {
      total_transactions: transactionLog.summary.total_transactions,
      successful_transactions: transactionLog.summary.successful_transactions,
      total_revenue: transactionLog.summary.total_revenue,
    })

    return NextResponse.json(transactionLog, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    })
  } catch (error: any) {
    console.error("[v0] Transaction log export error:", error)
    return NextResponse.json(
      {
        error: "生成交易日志失败",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
