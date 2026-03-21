import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Upload request received')
    
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('[v0] No file provided')
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    console.log('[v0] File:', file.name, file.type, file.size)

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

    console.log('[v0] Uploading to:', filename)
    console.log('[v0] BLOB_READ_WRITE_TOKEN exists:', !!process.env.BLOB_READ_WRITE_TOKEN)

    // Try private access first (most common for v0 blob stores)
    try {
      console.log('[v0] Trying private access...')
      const blob = await put(filename, file, {
        access: 'private',
      })
      console.log('[v0] Private upload success, pathname:', blob.pathname)
      return NextResponse.json({ url: `/api/file?pathname=${encodeURIComponent(blob.pathname)}` })
    } catch (privateError: any) {
      console.log('[v0] Private access failed:', privateError?.message)
      
      // Try public access as fallback
      try {
        console.log('[v0] Trying public access...')
        const blob = await put(filename, file, {
          access: 'public',
        })
        console.log('[v0] Public upload success, url:', blob.url)
        return NextResponse.json({ url: blob.url })
      } catch (publicError: any) {
        console.log('[v0] Public access also failed:', publicError?.message)
        throw publicError
      }
    }
  } catch (error: any) {
    console.error('[v0] Upload error:', error?.message || error)
    return NextResponse.json({ error: `上传失败: ${error?.message || '未知错误'}` }, { status: 500 })
  }
}
