type StoredFileAccess = "public" | "private"

type R2ObjectBodyLike = {
  body: ReadableStream
  etag?: string
  httpEtag?: string
  httpMetadata?: {
    contentType?: string
    cacheControl?: string
  }
  writeHttpMetadata?: (headers: Headers) => void
}

type R2BucketLike = {
  put: (
    key: string,
    value: ReadableStream | ArrayBuffer | Blob | string,
    options?: {
      httpMetadata?: {
        contentType?: string
        cacheControl?: string
      }
      customMetadata?: Record<string, string>
    },
  ) => Promise<unknown>
  get: (key: string) => Promise<R2ObjectBodyLike | null>
}

function encodePath(pathname: string): string {
  return pathname.split("/").map(encodeURIComponent).join("/")
}

function getPublicBaseUrl(): string {
  return (process.env.R2_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "")
}

function proxiedUrl(pathname: string): string {
  return `/api/file?pathname=${encodeURIComponent(pathname)}`
}

function normalizeEtag(etag: string): string {
  return etag.replace(/^W\//, "").replace(/^"|"$/g, "")
}

async function getUploadsBucket(): Promise<R2BucketLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare")
    const context = getCloudflareContext()
    return ((context.env as any).XHW_UPLOADS || null) as R2BucketLike | null
  } catch {
    return null
  }
}

export async function saveUploadedFile(
  filename: string,
  file: File,
  options: { access: StoredFileAccess },
): Promise<{ url: string; pathname: string }> {
  const bucket = await getUploadsBucket()

  if (bucket) {
    await bucket.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        originalName: file.name.slice(0, 255),
        uploadedAt: new Date().toISOString(),
      },
    })

    const publicBaseUrl = getPublicBaseUrl()
    const url = options.access === "public" && publicBaseUrl ? `${publicBaseUrl}/${encodePath(filename)}` : proxiedUrl(filename)
    return { url, pathname: filename }
  }

  const { put } = await import("@vercel/blob")

  try {
    const blob = await put(filename, file, { access: options.access })
    return {
      url: options.access === "private" ? proxiedUrl(blob.pathname) : blob.url,
      pathname: blob.pathname,
    }
  } catch (error) {
    if (options.access === "public") throw error

    const blob = await put(filename, file, { access: "public" })
    return { url: blob.url, pathname: blob.pathname }
  }
}

export async function getStoredFileResponse(pathname: string, ifNoneMatch?: string | null): Promise<Response> {
  const bucket = await getUploadsBucket()

  if (bucket) {
    const object = await bucket.get(pathname)
    if (!object) return new Response("Not found", { status: 404 })

    const etag = object.httpEtag || object.etag
    if (etag && ifNoneMatch && normalizeEtag(ifNoneMatch) === normalizeEtag(etag)) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    }

    const headers = new Headers()
    object.writeHttpMetadata?.(headers)
    headers.set("Content-Type", headers.get("Content-Type") || object.httpMetadata?.contentType || "application/octet-stream")
    if (etag) headers.set("ETag", etag)
    headers.set("Cache-Control", headers.get("Cache-Control") || "public, max-age=31536000, immutable")

    return new Response(object.body as BodyInit, { headers })
  }

  const { get } = await import("@vercel/blob")
  const result = await get(pathname, {
    access: "private",
    ifNoneMatch: ifNoneMatch ?? undefined,
  })

  if (!result) return new Response("Not found", { status: 404 })

  if (result.statusCode === 304) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: result.blob.etag,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  }

  return new Response(result.stream as BodyInit, {
    headers: {
      "Content-Type": result.blob.contentType,
      ETag: result.blob.etag,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
