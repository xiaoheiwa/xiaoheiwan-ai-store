import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

// Check if blob store is private (set BLOB_PRIVATE=true in env if using private store)
const isPrivateStore = process.env.BLOB_PRIVATE === 'true'

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

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: '文件大小不能超过 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `product-details/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    // Try public first, fallback to private if it fails
    try {
      const blob = await put(filename, file, {
        access: isPrivateStore ? 'private' : 'public',
      })

      if (isPrivateStore) {
        // For private store, return the pathname for use with /api/file route
        return NextResponse.json({ url: `/api/file?pathname=${encodeURIComponent(blob.pathname)}` })
      }
      
      // For public store, return direct URL
      return NextResponse.json({ url: blob.url })
    } catch (putError: any) {
      // If public access fails with store type mismatch, try private
      if (putError?.message?.includes('store') || putError?.message?.includes('access')) {
        const blob = await put(filename, file, {
          access: 'private',
        })
        return NextResponse.json({ url: `/api/file?pathname=${encodeURIComponent(blob.pathname)}` })
      }
      throw putError
    }
  } catch (error: any) {
    console.error('Upload error:', error?.message || error)
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }
}
