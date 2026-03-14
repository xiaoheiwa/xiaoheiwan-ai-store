import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { Database } from "@/lib/database"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { id, batchName, productId, unitCost, quantity, supplier, notes } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "缺少批次ID" }, { status: 400 })
    }

    const success = await Database.updatePurchaseBatch(Number(id), {
      batchName,
      productId,
      unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      supplier,
      notes,
    })

    if (!success) {
      return NextResponse.json({ error: "更新失败" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: "批次已更新" })
  } catch (error: any) {
    console.error("[v0] Batch update error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "缺少批次ID" }, { status: 400 })
    }

    const success = await Database.deletePurchaseBatch(Number(id))

    if (!success) {
      return NextResponse.json({ error: "删除失败" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: "批次已删除" })
  } catch (error: any) {
    console.error("[v0] Batch delete error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
