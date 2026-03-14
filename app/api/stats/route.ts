export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import { sql } from "@/lib/db"

export async function GET() {
  try {
    const [o1, o2, s1, s2] = await Promise.all([
      sql /*sql*/`SELECT count(*)::int AS c FROM orders`,
      sql /*sql*/`SELECT count(*)::int AS c FROM orders WHERE status='PAID'`,
      sql /*sql*/`SELECT count(*)::int AS c FROM inventory WHERE used=false`,
      sql /*sql*/`SELECT count(*)::int AS c FROM inventory WHERE used=true`,
    ])

    return Response.json(
      {
        ok: true,
        orders_total: o1[0].c,
        orders_paid: o2[0].c,
        stock_free: s1[0].c,
        stock_used: s2[0].c,
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (e: any) {
    console.error("[stats]", e?.message, e)
    return Response.json(
      {
        ok: false,
        msg: e?.message || "server error",
      },
      { status: 500 },
    )
  }
}
