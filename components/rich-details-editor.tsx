"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, Loader2, Bold, Italic, List, ListOrdered, Heading1, Heading2, Undo, Redo, Link as LinkIcon } from "lucide-react"

export interface DetailBlock {
  id: string
  type: "text" | "image"
  content: string
  caption?: string
}

interface RichDetailsEditorProps {
  value: DetailBlock[]
  onChange: (blocks: DetailBlock[]) => void
}

export function RichDetailsEditor({ value, onChange }: RichDetailsEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)

  // Convert blocks to HTML for editing
  const blocksToHtml = useCallback((blocks: DetailBlock[]): string => {
    return blocks.map(block => {
      if (block.type === "text") {
        return block.content
      } else if (block.type === "image") {
        const caption = block.caption ? `<figcaption>${block.caption}</figcaption>` : ""
        return `<figure data-type="image"><img src="${block.content}" alt="${block.caption || "图片"}" />${caption}</figure>`
      }
      return ""
    }).join("")
  }, [])

  // Convert HTML to blocks for storage
  const htmlToBlocks = useCallback((html: string): DetailBlock[] => {
    const blocks: DetailBlock[] = []
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html

    const processNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        
        if (el.tagName === "FIGURE" && el.dataset.type === "image") {
          const img = el.querySelector("img")
          const figcaption = el.querySelector("figcaption")
          if (img?.src) {
            blocks.push({
              id: Math.random().toString(36).substring(2, 9),
              type: "image",
              content: img.src,
              caption: figcaption?.textContent || ""
            })
          }
          return
        }

        if (el.tagName === "IMG") {
          blocks.push({
            id: Math.random().toString(36).substring(2, 9),
            type: "image",
            content: el.getAttribute("src") || "",
            caption: el.getAttribute("alt") || ""
          })
          return
        }
      }

      if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !["FIGURE", "IMG"].includes((node as HTMLElement).tagName))) {
        const text = node.nodeType === Node.TEXT_NODE 
          ? node.textContent 
          : (node as HTMLElement).outerHTML
        if (text && text.trim()) {
          // Merge with previous text block if exists
          const lastBlock = blocks[blocks.length - 1]
          if (lastBlock?.type === "text") {
            lastBlock.content += text
          } else {
            blocks.push({
              id: Math.random().toString(36).substring(2, 9),
              type: "text",
              content: text
            })
          }
        }
      }
    }

    // Process all child nodes
    Array.from(tempDiv.childNodes).forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (el.tagName === "FIGURE" || el.tagName === "IMG") {
          processNode(node)
        } else {
          // For other elements, keep the HTML
          const html = el.outerHTML
          if (html && html.trim()) {
            const lastBlock = blocks[blocks.length - 1]
            if (lastBlock?.type === "text") {
              lastBlock.content += html
            } else {
              blocks.push({
                id: Math.random().toString(36).substring(2, 9),
                type: "text",
                content: html
              })
            }
          }
        }
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        const lastBlock = blocks[blocks.length - 1]
        if (lastBlock?.type === "text") {
          lastBlock.content += node.textContent
        } else {
          blocks.push({
            id: Math.random().toString(36).substring(2, 9),
            type: "text",
            content: node.textContent
          })
        }
      }
    })

    return blocks
  }, [])

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = blocksToHtml(value)
      setIsInitialized(true)
    }
  }, [value, blocksToHtml, isInitialized])

  // Reset when value is empty (new product form)
  useEffect(() => {
    if (value.length === 0 && editorRef.current && isInitialized) {
      editorRef.current.innerHTML = ""
    }
  }, [value, isInitialized])

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      const blocks = htmlToBlocks(html)
      onChange(blocks)
    }
  }, [htmlToBlocks, onChange])

  // Upload image to server
  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "上传失败")
      }

      return data.url
    } catch (error) {
      console.error("Upload error:", error)
      return null
    }
  }

  // Insert image at cursor position
  const insertImageAtCursor = useCallback((url: string, alt: string = "图片") => {
    if (!editorRef.current) return

    const figure = document.createElement("figure")
    figure.setAttribute("data-type", "image")
    figure.contentEditable = "false"
    figure.className = "my-4 relative group"
    
    const img = document.createElement("img")
    img.src = url
    img.alt = alt
    img.className = "max-w-full h-auto rounded-lg border border-border mx-auto cursor-pointer"
    
    figure.appendChild(img)
    
    // Insert at cursor or at end
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        range.deleteContents()
        range.insertNode(figure)
        range.setStartAfter(figure)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        editorRef.current.appendChild(figure)
      }
    } else {
      editorRef.current.appendChild(figure)
    }

    // Add a paragraph after for continued typing
    const p = document.createElement("p")
    p.innerHTML = "<br>"
    figure.after(p)

    handleInput()
  }, [handleInput])

  // Handle paste event
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          setUploading(true)
          setUploadProgress("正在上传粘贴的图片...")
          const url = await uploadImage(file)
          if (url) {
            insertImageAtCursor(url, file.name)
          }
          setUploading(false)
          setUploadProgress("")
        }
        return
      }
    }
  }, [insertImageAtCursor])

  // Handle drag and drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return

    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"))
    if (imageFiles.length === 0) return

    setUploading(true)
    setUploadProgress(`正在上传 ${imageFiles.length} 张图片...`)

    for (let i = 0; i < imageFiles.length; i++) {
      setUploadProgress(`正在上传第 ${i + 1}/${imageFiles.length} 张图片...`)
      const url = await uploadImage(imageFiles[i])
      if (url) {
        insertImageAtCursor(url, imageFiles[i].name)
      }
    }

    setUploading(false)
    setUploadProgress("")
  }, [insertImageAtCursor])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(`正在上传 ${files.length} 张图片...`)

    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`正在上传第 ${i + 1}/${files.length} 张图片...`)
      const url = await uploadImage(files[i])
      if (url) {
        insertImageAtCursor(url, files[i].name)
      }
    }

    setUploading(false)
    setUploadProgress("")
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Toolbar formatting commands
  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const formatBlock = (tag: string) => {
    document.execCommand("formatBlock", false, tag)
    editorRef.current?.focus()
    handleInput()
  }

  const insertLink = () => {
    const url = prompt("请输入链接地址:", "https://")
    if (url) {
      execCommand("createLink", url)
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("bold")}
          className="h-8 w-8 p-0"
          title="粗体 (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("italic")}
          className="h-8 w-8 p-0"
          title="斜体 (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock("h1")}
          className="h-8 w-8 p-0"
          title="大标题"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock("h2")}
          className="h-8 w-8 p-0"
          title="小标题"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertUnorderedList")}
          className="h-8 w-8 p-0"
          title="无序列表"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertOrderedList")}
          className="h-8 w-8 p-0"
          title="有序列表"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          className="h-8 w-8 p-0"
          title="插入链接"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-5 bg-border mx-1" />
        
        {/* Image upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-8 px-2 gap-1.5"
          title="上传图片"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          <span className="text-xs hidden sm:inline">插入图片</span>
        </Button>
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("undo")}
          className="h-8 w-8 p-0"
          title="撤销 (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("redo")}
          className="h-8 w-8 p-0"
          title="重做 (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </Button>
        
        {uploadProgress && (
          <span className="ml-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            {uploadProgress}
          </span>
        )}
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="min-h-[300px] max-h-[600px] overflow-y-auto p-4 focus:outline-none prose prose-sm max-w-none
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4
          [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3
          [&_p]:mb-2 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
          [&_li]:mb-1
          [&_a]:text-primary [&_a]:underline
          [&_figure]:my-4 [&_figure]:text-center
          [&_figure_img]:max-w-full [&_figure_img]:h-auto [&_figure_img]:rounded-lg [&_figure_img]:border [&_figure_img]:border-border [&_figure_img]:mx-auto
          [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground [&_figcaption]:mt-2 [&_figcaption]:italic
          [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:border [&_img]:border-border [&_img]:my-3"
        data-placeholder="在此编写产品详情...&#10;&#10;提示:&#10;- 直接输入文字即可&#10;- 粘贴或拖拽图片自动上传&#10;- 点击工具栏按钮格式化文本"
        suppressContentEditableWarning
      />

      {/* Placeholder styles */}
      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          white-space: pre-wrap;
        }
        [contenteditable] figure {
          position: relative;
        }
        [contenteditable] figure:hover::after {
          content: "点击图片可选中";
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}

// Helper function to parse old text-based details to blocks
export function parseDetailsToBlocks(details: string | null): DetailBlock[] {
  if (!details) return []
  
  // Check if it's already in JSON block format
  try {
    const parsed = JSON.parse(details)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
      return parsed
    }
  } catch {
    // Not JSON, convert from plain text
  }
  
  // Convert plain text to a single text block (wrap in paragraph)
  if (details.trim()) {
    return [{ id: Math.random().toString(36).substring(2, 9), type: "text", content: `<p>${details.replace(/\n/g, "</p><p>")}</p>` }]
  }
  
  return []
}

// Helper function to convert blocks to string for storage
export function blocksToString(blocks: DetailBlock[]): string {
  if (blocks.length === 0) return ""
  return JSON.stringify(blocks)
}
