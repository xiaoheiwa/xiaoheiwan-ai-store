import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '仅支持 JPG、PNG、GIF、WebP 格式' }, { status: 400 })
    }

    // Validate file size (max 4MB - Vercel has 4.5MB body limit)
    const maxSize = 4 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: '文件大小不能超过 4MB' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `product-details/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    // Try private access first (most common for v0 blob stores)
    try {
      const blob = await put(filename, file, {
        access: 'private',
      })
      return NextResponse.json({ url: `/api/file?pathname=${encodeURIComponent(blob.pathname)}` })
    } catch {
      // Try public access as fallback
      const blob = await put(filename, file, {
        access: 'public',
      })
      return NextResponse.json({ url: blob.url })
    }
  } catch (error: any) {
    console.error('Upload error:', error?.message || error)
    return NextResponse.json({ error: `上传失败: ${error?.message || '未知错误'}` }, { status: 500 })
  }
}
