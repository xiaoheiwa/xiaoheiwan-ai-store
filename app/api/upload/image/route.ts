import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Upload image request received')
    
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('[v0] No file in request')
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    console.log('[v0] File info:', { name: file.name, type: file.type, size: file.size })

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.log('[v0] Invalid file type:', file.type)
      return NextResponse.json({ error: '仅支持 JPG、PNG、GIF、WebP 格式' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      console.log('[v0] File too large:', file.size)
      return NextResponse.json({ error: '文件大小不能超过 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `product-details/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    console.log('[v0] Uploading to blob storage:', filename)

    const blob = await put(filename, file, {
      access: 'public',
    })

    console.log('[v0] Upload successful, blob url:', blob.url)

    // Return the public URL directly
    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }
}
