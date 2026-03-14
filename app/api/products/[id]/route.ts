import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const product = await Database.getProduct(id)
    if (!product || product.status !== "active") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // For manual delivery products, stock is not tracked in activation_codes
    // Return a high number so frontend doesn't show "out of stock"
    let stockCount: number
    if (product.delivery_type === "manual") {
      stockCount = 999
    } else {
      stockCount = await Database.getAvailableCodesCountByProduct(id)
    }

    return NextResponse.json({ ...product, stock_count: stockCount })
  } catch (error) {
    console.error("[v0] Failed to get product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}
