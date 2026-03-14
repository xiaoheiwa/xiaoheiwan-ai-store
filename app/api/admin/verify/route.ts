import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const isValid = await verifyAdminRequest(request)
  if (!isValid) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({ authenticated: true })
}
