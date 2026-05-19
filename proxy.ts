import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 开源版本 - 无需域名授权验证
// 所有请求直接通过

export async function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
