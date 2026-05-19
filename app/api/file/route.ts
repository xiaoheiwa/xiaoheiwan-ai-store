import { type NextRequest, NextResponse } from 'next/server'
import { getStoredFileResponse } from '@/lib/object-storage'

export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.searchParams.get('pathname')

    if (!pathname) {
      return NextResponse.json({ error: 'Missing pathname' }, { status: 400 })
    }

    return await getStoredFileResponse(pathname, request.headers.get('if-none-match'))
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
