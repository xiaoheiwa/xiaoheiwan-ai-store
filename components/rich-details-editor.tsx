"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, GripVertical, Type, ImageIcon, ArrowUp, ArrowDown, Upload, Loader2, Link, Plus, X, Check, Copy } from "lucide-react"

export interface DetailBlock {
  id: string
  type: "text" | "image"
  content: string
  caption?: string // for images
}

interface RichDetailsEditorProps {
  value: DetailBlock[]
  onChange: (blocks: DetailBlock[]) => void
}

export function RichDetailsEditor({ value, onChange }: RichDetailsEditorProps) {
  const [imageUrlInput, setImageUrlInput] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadError("")

    try {
      // Support multiple file uploads
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "上传失败")
        }

        return { id: generateId(), type: "image" as const, content: data.url, caption: "" }
      })

      const newBlocks = await Promise.all(uploadPromises)
      onChange([...value, ...newBlocks])
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传失败")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const addTextBlock = () => {
    onChange([...value, { id: generateId(), type: "text", content: "" }])
  }

  const addImageBlock = () => {
    if (!imageUrlInput.trim()) return
    onChange([...value, { id: generateId(), type: "image", content: imageUrlInput.trim(), caption: "" }])
    setImageUrlInput("")
    setShowUrlInput(false)
  }

  const updateBlock = (id: string, updates: Partial<DetailBlock>) => {
    onChange(value.map(block => block.id === id ? { ...block, ...updates } : block))
  }

  const removeBlock = (id: string) => {
    onChange(value.filter(block => block.id !== id))
  }

  const duplicateBlock = (block: DetailBlock) => {
    const newBlock = { ...block, id: generateId() }
    const index = value.findIndex(b => b.id === block.id)
    const newBlocks = [...value]
    newBlocks.splice(index + 1, 0, newBlock)
    onChange(newBlocks)
    setCopiedId(block.id)
    setTimeout(() => setCopiedId(null), 1000)
  }

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === value.length - 1) return
    
    const newBlocks = [...value]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
    onChange(newBlocks)
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }, [draggedIndex])

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newBlocks = [...value]
      const [draggedBlock] = newBlocks.splice(draggedIndex, 1)
      newBlocks.splice(dragOverIndex, 0, draggedBlock)
      onChange(newBlocks)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Insert block at specific position
  const insertBlockAt = (index: number, type: "text" | "image") => {
    const newBlock: DetailBlock = {
      id: generateId(),
      type,
      content: "",
      ...(type === "image" ? { caption: "" } : {})
    }
    const newBlocks = [...value]
    newBlocks.splice(index, 0, newBlock)
    onChange(newBlocks)
  }

  return (
    <div className="space-y-2">
      {/* Block list */}
      {value.length > 0 && (
        <div className="space-y-1">
          {value.map((block, index) => (
            <div key={block.id}>
              {/* Insert indicator between blocks */}
              {index === 0 && (
                <div className="group/insert relative h-2 -mb-1">
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-transparent group-hover/insert:bg-primary/30 transition-colors rounded" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-0 group-hover/insert:opacity-100 transition-opacity flex gap-1">
                    <button
                      type="button"
                      onClick={() => insertBlockAt(index, "text")}
                      className="p-1 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                      title="插入文本块"
                    >
                      <Type className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertBlockAt(index, "image")}
                      className="p-1 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                      title="插入图片块"
                    >
                      <ImageIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <div
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group relative border rounded-lg transition-all duration-200 ${
                  draggedIndex === index
                    ? "opacity-50 border-primary bg-primary/5"
                    : dragOverIndex === index
                    ? "border-primary border-2 bg-primary/5"
                    : "border-border bg-background hover:border-muted-foreground/30"
                }`}
              >
                {/* Block header - more compact */}
                <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border bg-muted/30 rounded-t-lg">
                  <div className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    {block.type === "text" ? (
                      <>
                        <Type className="w-3 h-3" />
                        <span className="hidden sm:inline">文本</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">图片</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground/50 ml-1">#{index + 1}</span>
                  
                  <div className="ml-auto flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateBlock(block)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="复制块"
                    >
                      {copiedId === block.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(index, "up")}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                      title="上移"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(index, "down")}
                      disabled={index === value.length - 1}
                      className="h-6 w-6 p-0"
                      title="下移"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlock(block.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Block content */}
                <div className="p-2.5">
                  {block.type === "text" ? (
                    <textarea
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder="输入文本内容，支持多行..."
                      className="w-full min-h-[80px] p-2.5 border border-input bg-background text-sm rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring font-sans leading-relaxed"
                      rows={3}
                    />
                  ) : (
                    <div className="space-y-2">
                      {block.content ? (
                        <div className="relative group/img">
                          <img
                            src={block.content}
                            alt={block.caption || "教程图片"}
                            className="max-w-full max-h-[300px] object-contain rounded-lg border border-border mx-auto"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect fill='%23f1f5f9' width='200' height='100'/%3E%3Ctext fill='%2394a3b8' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='14'%3E图片加载失败%3C/text%3E%3C/svg%3E"
                            }}
                          />
                          {/* Quick actions overlay */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-7 text-xs shadow-md"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              替换
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">点击上传图片</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">或在下方输入图片 URL</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          placeholder="图片 URL"
                          className="text-xs h-8"
                        />
                        <Input
                          value={block.caption || ""}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                          placeholder="图片说明（可选）"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Insert indicator after block */}
              <div className="group/insert relative h-2 -mt-1">
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-transparent group-hover/insert:bg-primary/30 transition-colors rounded" />
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-0 group-hover/insert:opacity-100 transition-opacity flex gap-1 z-10">
                  <button
                    type="button"
                    onClick={() => insertBlockAt(index + 1, "text")}
                    className="p-1 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm"
                    title="插入文本块"
                  >
                    <Type className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlockAt(index + 1, "image")}
                    className="p-1 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm"
                    title="插入图片块"
                  >
                    <ImageIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add block area */}
      <div className="p-3 border border-dashed border-border rounded-lg bg-muted/10 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTextBlock}
            className="flex-1 min-w-[120px] h-9"
          >
            <Type className="w-4 h-4 mr-2" />
            添加文本
          </Button>
          
          {/* Hidden file input - support multiple */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileUpload}
            className="hidden"
            multiple
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 min-w-[120px] h-9"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                上传图片
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant={showUrlInput ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="h-9 px-3"
          >
            {showUrlInput ? <X className="w-4 h-4" /> : <Link className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* URL input (collapsible) */}
        {showUrlInput && (
          <div className="flex gap-2 pt-1">
            <Input
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="输入图片 URL，按回车添加"
              className="flex-1 h-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addImageBlock()
                }
                if (e.key === "Escape") {
                  setShowUrlInput(false)
                }
              }}
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={addImageBlock}
              disabled={!imageUrlInput.trim()}
              className="h-9"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加
            </Button>
          </div>
        )}
        
        {/* Upload error message */}
        {uploadError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-2 py-1.5 rounded">
            <X className="w-3 h-3" />
            {uploadError}
            <button 
              type="button"
              onClick={() => setUploadError("")}
              className="ml-auto hover:text-destructive/80"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {value.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <div className="flex justify-center gap-4 mb-3">
            <div className="p-3 rounded-full bg-muted">
              <Type className="w-5 h-5" />
            </div>
            <div className="p-3 rounded-full bg-muted">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm">点击上方按钮添加文本或图片</p>
          <p className="text-xs mt-1 text-muted-foreground/70">支持拖拽排序、多图上传</p>
        </div>
      )}
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
  
  // Convert plain text to a single text block
  if (details.trim()) {
    return [{ id: Math.random().toString(36).substring(2, 9), type: "text", content: details }]
  }
  
  return []
}

// Helper function to convert blocks to string for storage
export function blocksToString(blocks: DetailBlock[]): string {
  if (blocks.length === 0) return ""
  return JSON.stringify(blocks)
}
