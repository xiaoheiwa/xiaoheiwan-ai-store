"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { DetailBlock } from "./rich-details-editor"
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface RichDetailsDisplayProps {
  details: string | null
}

// Image lightbox component
function ImageLightbox({ 
  src, 
  alt, 
  onClose 
}: { 
  src: string
  alt: string
  onClose: () => void 
}) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "+" || e.key === "=") setScale(s => Math.min(s + 0.25, 4))
      if (e.key === "-") setScale(s => Math.max(s - 0.25, 0.5))
      if (e.key === "r" || e.key === "R") setRotation(r => r + 90)
      if (e.key === "0") { setScale(1); setRotation(0); setPosition({ x: 0, y: 0 }) }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(s => Math.max(0.5, Math.min(4, s + delta)))
  }, [])

  // Drag to move
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      })
    }
  }

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setScale(s => Math.min(s + 0.25, 4))}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="放大 (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="缩小 (-)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => setRotation(r => r + 90)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="旋转 (R)"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          title="关闭 (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 rounded-full text-white text-sm">
        {Math.round(scale * 100)}%
      </div>

      {/* Image container */}
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out"
          }}
          draggable={false}
        />
      </div>

      {/* Help text */}
      <div className="absolute bottom-4 right-4 text-white/50 text-xs hidden md:block">
        滚轮缩放 | 拖动移动 | R 旋转 | Esc 关闭
      </div>
    </div>
  )
}

export function RichDetailsDisplay({ details }: RichDetailsDisplayProps) {
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle image clicks in the rendered HTML
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "IMG") {
        const img = target as HTMLImageElement
        setLightboxImage({ src: img.src, alt: img.alt || "图片" })
      }
    }

    container.addEventListener("click", handleImageClick)
    return () => container.removeEventListener("click", handleImageClick)
  }, [details])

  if (!details) return null

  // Try to parse as JSON blocks
  let blocks: DetailBlock[] = []
  try {
    const parsed = JSON.parse(details)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
      blocks = parsed
    }
  } catch {
    // Not JSON, render as plain text
    return (
      <>
        <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
          {details}
        </div>
      </>
    )
  }

  if (blocks.length === 0) return null

  // Combine all blocks into HTML and render
  const htmlContent = blocks.map(block => {
    if (block.type === "text") {
      return block.content
    } else if (block.type === "image") {
      const caption = block.caption ? `<figcaption class="text-xs text-center text-muted-foreground mt-2 italic">${block.caption}</figcaption>` : ""
      return `<figure class="my-4 text-center"><img src="${block.content}" alt="${block.caption || "教程图片"}" class="max-w-full h-auto rounded-xl border border-border shadow-sm mx-auto cursor-pointer hover:shadow-md transition-shadow" loading="lazy" />${caption}</figure>`
    }
    return ""
  }).join("")

  return (
    <>
      <div 
        ref={containerRef}
        className="prose prose-sm max-w-none text-foreground
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-foreground
          [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-foreground
          [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-muted-foreground
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-muted-foreground
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:text-muted-foreground
          [&_li]:mb-1.5
          [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80
          [&_strong]:font-semibold [&_strong]:text-foreground
          [&_em]:italic
          [&_figure]:my-4 [&_figure]:text-center
          [&_img]:cursor-pointer [&_img]:hover:opacity-90 [&_img]:transition-opacity"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  )
}
