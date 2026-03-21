"use client"

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo,
  Quote, Code, Minus, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

// 上传图片到服务器
async function uploadImage(file: File): Promise<string | null> {
  // Vercel has a 4.5MB body limit, check before upload
  const maxSize = 4 * 1024 * 1024 // 4MB to be safe
  if (file.size > maxSize) {
    alert(`图片太大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，请压缩到 4MB 以下`)
    return null
  }
  
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      let errorMsg = '上传失败'
      try {
        const error = await response.json()
        errorMsg = error.error || errorMsg
      } catch {
        if (response.status === 413) {
          errorMsg = '图片太大，请压缩后重试'
        }
      }
      alert(errorMsg)
      return null
    }
    
    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Upload failed:', error)
    alert('上传失败，请重试')
    return null
  }
}

// 工具栏按钮组件
function ToolbarButton({ 
  onClick, 
  active, 
  disabled,
  children,
  title
}: { 
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded hover:bg-accent transition-colors",
        active && "bg-accent text-accent-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  )
}

// 工具栏分隔线
function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />
}

// 工具栏组件
function Toolbar({ editor, uploading }: { editor: Editor | null, uploading: boolean }) {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  
  if (!editor) return null

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return
      
      for (const file of Array.from(files)) {
        const url = await uploadImage(file)
        if (url) {
          editor.chain().focus().setImage({ src: url }).run()
        }
      }
    }
    input.click()
  }

  return (
    <div className="border-b border-border p-2 flex flex-wrap items-center gap-0.5 bg-muted/30">
      {/* 撤销/重做 */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="撤销 (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="重做 (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>
      
      <ToolbarDivider />
      
      {/* 标题 */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="标题1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="标题2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="标题3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>
      
      <ToolbarDivider />
      
      {/* 文字格式 */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="粗体 (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="斜体 (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="下划线 (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="删除线"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="行内代码"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>
      
      <ToolbarDivider />
      
      {/* 列表 */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="无序列表"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="有序列表"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="引用"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="分隔线"
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>
      
      <ToolbarDivider />
      
      {/* 链接 */}
      <div className="relative">
        <ToolbarButton 
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run()
            } else {
              setShowLinkInput(!showLinkInput)
            }
          }}
          active={editor.isActive('link')}
          title="链接"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-md shadow-lg z-10 flex gap-2">
            <input
              type="url"
              placeholder="输入链接地址"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
              className="px-2 py-1 text-sm border border-input rounded bg-background w-48"
              autoFocus
            />
            <Button size="sm" onClick={addLink}>确定</Button>
          </div>
        )}
      </div>
      
      {/* 图片 */}
      <ToolbarButton 
        onClick={handleImageUpload}
        disabled={uploading}
        title="上传图片"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
      </ToolbarButton>
      
      {uploading && (
        <span className="text-xs text-muted-foreground ml-2">上传中...</span>
      )}
    </div>
  )
}

export function TiptapEditor({ value, onChange, placeholder = "开始编写产品详情...\n\n支持直接粘贴或拖拽图片", minHeight = "300px" }: TiptapEditorProps) {
  const [uploading, setUploading] = useState(false)
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const files = Array.from(event.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
          )
          
          if (files.length > 0) {
            event.preventDefault()
            setUploading(true)
            
            Promise.all(files.map(file => uploadImage(file))).then(urls => {
              urls.forEach(url => {
                if (url) {
                  editor?.chain().focus().setImage({ src: url }).run()
                }
              })
              setUploading(false)
            })
            
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false
        
        const imageItems = Array.from(items).filter(item => 
          item.type.startsWith('image/')
        )
        
        if (imageItems.length > 0) {
          event.preventDefault()
          setUploading(true)
          
          const files = imageItems.map(item => item.getAsFile()).filter(Boolean) as File[]
          
          Promise.all(files.map(file => uploadImage(file))).then(urls => {
            urls.forEach(url => {
              if (url) {
                editor?.chain().focus().setImage({ src: url }).run()
              }
            })
            setUploading(false)
          })
          
          return true
        }
        return false
      },
    },
  })

  // 同步外部值变化
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background">
      <Toolbar editor={editor} uploading={uploading} />
      <EditorContent 
        editor={editor} 
        style={{ '--editor-min-height': minHeight } as React.CSSProperties}
        className="[&_.ProseMirror]:min-h-[var(--editor-min-height,300px)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:opacity-50 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  )
}

// 导出解析函数以兼容旧数据
export function parseDetailsToHtml(details: string | null): string {
  if (!details) return ''
  
  // 如果是 JSON 格式（旧的块格式），转换为 HTML
  try {
    const parsed = JSON.parse(details)
    if (Array.isArray(parsed)) {
      return parsed.map(block => {
        if (block.type === 'text') {
          return `<p>${block.content.replace(/\n/g, '<br>')}</p>`
        } else if (block.type === 'image') {
          let html = `<img src="${block.url}" alt="${block.caption || ''}" />`
          if (block.caption) {
            html += `<p><em>${block.caption}</em></p>`
          }
          return html
        }
        return ''
      }).join('')
    }
  } catch {
    // 不是 JSON，可能是纯文本或 HTML
  }
  
  // 如果已经是 HTML，直接返回
  if (details.includes('<') && details.includes('>')) {
    return details
  }
  
  // 纯文本转 HTML
  return `<p>${details.replace(/\n/g, '<br>')}</p>`
}
