"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { contentStyles } from "./content-styles"

interface RichDetailsDisplayProps {
  details: string | null
}

// Image lightbox component - rendered via portal to ensure top-level rendering
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
  const [mounted, setMounted] = useState(false)
  const lastTouchDistance = useRef<number | null>(null)
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null)

  // Ensure portal is only rendered on client
  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Prevent body scroll and fix iOS Safari issues, hide other floating elements
  useEffect(() => {
    const scrollY = window.scrollY
    const body = document.body
    const html = document.documentElement
    
    // Save current scroll position and lock body
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.overflow = "hidden"
    html.style.overflow = "hidden"
    
    // Add a class to body to signal lightbox is open (for other components to hide)
    body.classList.add("lightbox-open")
    
    return () => {
      body.style.position = ""
      body.style.top = ""
      body.style.left = ""
      body.style.right = ""
      body.style.overflow = ""
      html.style.overflow = ""
      body.classList.remove("lightbox-open")
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(s => Math.max(0.5, Math.min(4, s + delta)))
  }, [])

  // Drag to move (mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
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

  // Touch events for mobile - support pinch to zoom and drag
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    
    if (e.touches.length === 2) {
      // Pinch start - calculate initial distance
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy)
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      }
    } else if (e.touches.length === 1 && scale > 1) {
      // Single finger drag when zoomed
      setIsDragging(true)
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      })
    }
  }

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const newDistance = Math.sqrt(dx * dx + dy * dy)
      const delta = (newDistance - lastTouchDistance.current) * 0.01
      setScale(s => Math.max(0.5, Math.min(4, s + delta)))
      lastTouchDistance.current = newDistance
    } else if (isDragging && e.touches.length === 1) {
      // Single finger drag
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastTouchDistance.current = null
      lastTouchCenter.current = null
    }
    if (e.touches.length === 0) {
      setIsDragging(false)
    }
  }

  // Double tap to zoom
  const lastTap = useRef<number>(0)
  const handleDoubleTap = (e: React.TouchEvent) => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      e.preventDefault()
      if (scale > 1) {
        setScale(1)
        setPosition({ x: 0, y: 0 })
      } else {
        setScale(2)
      }
    }
    lastTap.current = now
  }

  const lightboxContent = (
    <div 
      className="fixed inset-0 bg-black/95 flex items-center justify-center touch-none"
      style={{ 
        zIndex: 99999,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        WebkitOverflowScrolling: "touch"
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Controls - positioned at top */}
      <div 
        className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2"
        style={{ zIndex: 100000 }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.5, 4)) }}
          className="p-2.5 sm:p-2 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full text-white transition-colors"
          title="放大"
        >
          <ZoomIn className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(s - 0.5, 0.5)) }}
          className="p-2.5 sm:p-2 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full text-white transition-colors"
          title="缩小"
        >
          <ZoomOut className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setRotation(r => r + 90) }}
          className="p-2.5 sm:p-2 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full text-white transition-colors"
          title="旋转"
        >
          <RotateCw className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="p-2.5 sm:p-2 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full text-white transition-colors"
          title="关闭"
        >
          <X className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Scale indicator */}
      <div 
        className="absolute bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 rounded-full text-white text-sm"
        style={{ zIndex: 100000 }}
      >
        {Math.round(scale * 100)}%
      </div>

      {/* Mobile hint */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs text-center sm:hidden"
        style={{ zIndex: 100000 }}
      >
        双指缩放 | 双击放大/还原 | 点击空白关闭
      </div>

      {/* Image container */}
      <div 
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => { handleTouchStart(e); handleDoubleTap(e) }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[95vw] max-h-[85vh] sm:max-w-[90vw] sm:max-h-[90vh] object-contain select-none pointer-events-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out"
          }}
          draggable={false}
        />
      </div>

      {/* Desktop help text */}
      <div 
        className="absolute bottom-4 right-4 text-white/50 text-xs hidden md:block"
        style={{ zIndex: 100000 }}
      >
        滚轮缩放 | 拖动移动 | R 旋转 | Esc 关闭
      </div>
    </div>
  )

  // Use portal to render at document body level to avoid z-index issues
  if (!mounted) return null
  
  return createPortal(lightboxContent, document.body)
}

// Clean and normalize HTML content
function cleanHtml(html: string): string {
  return html
    // Remove inline styles that mess up layout
    .replace(/\s*style="[^"]*"/gi, '')
    // Remove class attributes from external sources
    .replace(/\s*class="[^"]*"/gi, '')
    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<p><br\s*\/?><\/p>/gi, '')
    .replace(/<p>&nbsp;<\/p>/gi, '')
    // Remove empty divs
    .replace(/<div>\s*<\/div>/gi, '')
    // Remove empty spans
    .replace(/<span>\s*<\/span>/gi, '')
    // Clean up multiple br tags
    .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>')
    // Replace nbsp with regular spaces
    .replace(/&nbsp;/gi, ' ')
    // Remove font tags
    .replace(/<\/?font[^>]*>/gi, '')
    // Convert b/i to strong/em
    .replace(/<b>(.*?)<\/b>/gi, '<strong>$1</strong>')
    .replace(/<i>(.*?)<\/i>/gi, '<em>$1</em>')
    // Remove empty strong/em
    .replace(/<strong>\s*<\/strong>/gi, '')
    .replace(/<em>\s*<\/em>/gi, '')
    // Remove data attributes
    .replace(/\s*data-[a-z-]+="[^"]*"/gi, '')
    .trim()
}

// Parse old block format or HTML
function parseDetailsContent(details: string): string {
  // Try to parse as JSON blocks (old format)
  try {
    const parsed = JSON.parse(details)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
      return parsed.map(block => {
        if (block.type === "text") {
          return `<p>${block.content.replace(/\n/g, '<br>')}</p>`
        } else if (block.type === "image") {
          const caption = block.caption ? `<figcaption>${block.caption}</figcaption>` : ""
          return `<figure><img src="${block.content}" alt="${block.caption || "图片"}" />${caption}</figure>`
        }
        return ""
      }).join("")
    }
  } catch {
    // Not JSON
  }

  // If already HTML, clean and return
  if (details.includes('<') && details.includes('>')) {
    return cleanHtml(details)
  }

  // Plain text - convert to HTML
  return `<p>${details.replace(/\n/g, '<br>')}</p>`
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
        e.preventDefault()
        e.stopPropagation()
        const img = target as HTMLImageElement
        setLightboxImage({ src: img.src, alt: img.alt || "图片" })
      }
    }

    container.addEventListener("click", handleImageClick)
    return () => container.removeEventListener("click", handleImageClick)
  }, [details])

  if (!details) return null

  const htmlContent = parseDetailsContent(details)

  return (
    <>
      <div 
        ref={containerRef}
        className={`max-w-none ${contentStyles}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Lightbox - rendered via portal */}
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
