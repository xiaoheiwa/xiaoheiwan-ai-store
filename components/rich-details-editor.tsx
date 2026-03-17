"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, GripVertical, Type, ImageIcon, ArrowUp, ArrowDown, Upload, Loader2, Link } from "lucide-react"

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "上传失败")
      }

      // Add image block with uploaded URL
      onChange([...value, { id: generateId(), type: "image", content: data.url, caption: "" }])
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
  }

  const updateBlock = (id: string, updates: Partial<DetailBlock>) => {
    onChange(value.map(block => block.id === id ? { ...block, ...updates } : block))
  }

  const removeBlock = (id: string) => {
    onChange(value.filter(block => block.id !== id))
  }

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === value.length - 1) return
    
    const newBlocks = [...value]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
    onChange(newBlocks)
  }

  return (
    <div className="space-y-3">
      {/* Block list */}
      {value.length > 0 && (
        <div className="space-y-3">
          {value.map((block, index) => (
            <div key={block.id} className="group relative border border-border rounded-lg bg-background">
              {/* Block header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  {block.type === "text" ? (
                    <>
                      <Type className="w-3 h-3" />
                      文本块
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3 h-3" />
                      图片块
                    </>
                  )}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(index, "up")}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
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
                  >
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlock(block.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Block content */}
              <div className="p-3">
                {block.type === "text" ? (
                  <textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="输入文本内容，支持多行..."
                    className="w-full min-h-[100px] p-2 border border-input bg-background text-sm rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <div className="space-y-2">
                    {block.content && (
                      <div className="relative">
                        <img
                          src={block.content}
                          alt={block.caption || "教程图片"}
                          className="max-w-full h-auto rounded-lg border border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect fill='%23f1f5f9' width='200' height='100'/%3E%3Ctext fill='%2394a3b8' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='14'%3E图片加载失败%3C/text%3E%3C/svg%3E"
                          }}
                        />
                      </div>
                    )}
                    <Input
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder="图片 URL"
                      className="text-xs"
                    />
                    <Input
                      value={block.caption || ""}
                      onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                      placeholder="图片说明（可选）"
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add block buttons */}
      <div className="space-y-2 p-3 border border-dashed border-border rounded-lg bg-muted/20">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTextBlock}
            className="flex-1"
          >
            <Type className="w-4 h-4 mr-2" />
            添加文本块
          </Button>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
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
            variant="ghost"
            size="sm"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="sm:w-auto"
          >
            <Link className="w-4 h-4 mr-2" />
            URL
          </Button>
        </div>
        
        {/* URL input (collapsible) */}
        {showUrlInput && (
          <div className="flex gap-2">
            <Input
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="输入图片 URL"
              className="flex-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addImageBlock()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImageBlock}
              disabled={!imageUrlInput.trim()}
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              添加
            </Button>
          </div>
        )}
        
        {/* Upload error message */}
        {uploadError && (
          <p className="text-xs text-destructive">{uploadError}</p>
        )}
      </div>

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          点击上方按钮添加文本或图片，构建图文教程
        </p>
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
