import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {

    const contentType = request.headers.get("content-type") || ""
    let codesText = ""
    let productId: string | null = null
    let batchName: string | null = null
    let unitCost: number | null = null
    let supplier: string | null = null
    let notes: string | null = null

    if (contentType.includes("application/json")) {
      const body = await request.json()
      codesText = body.codes || ""
      productId = body.productId || null
      batchName = body.batchName || null
      unitCost = body.unitCost != null ? Number(body.unitCost) : null
      supplier = body.supplier || null
      notes = body.notes || null
    } else {
      codesText = await request.text()
      const url = new URL(request.url)
      productId = url.searchParams.get("productId")
    }

    const codes = codesText
      .split("\n")
      .map((code: string) => code.trim())
      .filter((code: string) => code.length > 0)

    if (codes.length === 0) {
      return NextResponse.json({ error: "No valid codes" }, { status: 400 })
    }

    // Create purchase batch if cost info provided
    let batchId: string | null = null
    if (unitCost != null && unitCost > 0) {
      batchId = await Database.createPurchaseBatch({
        batchName: batchName || `${new Date().toLocaleDateString("zh-CN")} 导入`,
        productId,
        unitCost,
        quantity: codes.length,
        supplier,
        notes,
      })
    }

    let imported: number
    if (productId) {
      imported = await Database.addCodesForProduct(codes, productId, batchId)
    } else {
      imported = await Database.addCodes(codes, batchId)
    }

    return NextResponse.json({
      imported,
      batchId,
      message: `Successfully imported ${imported} codes`,
    })
  } catch (error) {
    console.error("[v0] Import codes failed:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
