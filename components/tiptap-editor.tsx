"use client"

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { useCallback, useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo,
  Quote, Code, Minus, Loader2, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Subscript as SubIcon, Superscript as SuperIcon, Palette, Type, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { editorStyles } from './content-styles'

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

// 预设颜色
const COLORS = [
  { name: '默认', value: '' },
  { name: '红色', value: '#ef4444' },
  { name: '橙色', value: '#f97316' },
  { name: '黄色', value: '#eab308' },
  { name: '绿色', value: '#22c55e' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '紫色', value: '#8b5cf6' },
  { name: '粉色', value: '#ec4899' },
  { name: '灰色', value: '#6b7280' },
]

const HIGHLIGHT_COLORS = [
  { name: '无', value: '' },
  { name: '黄色', value: '#fef08a' },
  { name: '绿色', value: '#bbf7d0' },
  { name: '蓝色', value: '#bfdbfe' },
  { name: '紫色', value: '#ddd6fe' },
  { name: '粉色', value: '#fbcfe8' },
  { name: '橙色', value: '#fed7aa' },
]

// 上传图片到服务器
async function uploadImage(file: File): Promise<string | null> {
  const maxSize = 4 * 1024 * 1024
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

// 下拉菜单按钮
function DropdownButton({ 
  children, 
  title,
  menuContent,
  active
}: { 
  children: React.ReactNode
  title?: string
  menuContent: React.ReactNode
  active?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={title}
        className={cn(
          "p-1.5 rounded hover:bg-accent transition-colors flex items-center gap-0.5",
          active && "bg-accent text-accent-foreground"
        )}
      >
        {children}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 p-1 bg-popover border border-border rounded-md shadow-lg z-20 min-w-[120px]">
          {menuContent}
        </div>
      )}
    </div>
  )
}

// 颜色选择器
function ColorPicker({ 
  colors, 
  currentColor, 
  onSelect,
  title
}: { 
  colors: { name: string; value: string }[]
  currentColor?: string
  onSelect: (color: string) => void
  title: string
}) {
  return (
    <div className="p-2">
      <div className="text-xs text-muted-foreground mb-2">{title}</div>
      <div className="grid grid-cols-5 gap-1">
        {colors.map((color) => (
          <button
            key={color.value || 'default'}
            type="button"
            onClick={() => onSelect(color.value)}
            title={color.name}
            className={cn(
              "w-6 h-6 rounded border-2 transition-all hover:scale-110",
              currentColor === color.value ? "border-primary" : "border-transparent",
              !color.value && "bg-gradient-to-br from-gray-200 to-gray-400"
            )}
            style={color.value ? { backgroundColor: color.value } : undefined}
          />
        ))}
      </div>
    </div>
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
      
      {/* 上下标 */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        active={editor.isActive('superscript')}
        title="上标"
      >
        <SuperIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        active={editor.isActive('subscript')}
        title="下标"
      >
        <SubIcon className="w-4 h-4" />
      </ToolbarButton>
      
      <ToolbarDivider />
      
      {/* 文字颜色 */}
      <DropdownButton 
        title="文字颜色"
        active={!!editor.getAttributes('textStyle').color}
        menuContent={
          <ColorPicker
            colors={COLORS}
            currentColor={editor.getAttributes('textStyle').color}
            onSelect={(color) => {
              if (color) {
                editor.chain().focus().setColor(color).run()
              } else {
                editor.chain().focus().unsetColor().run()
              }
            }}
            title="文字颜色"
          />
        }
      >
        <Palette className="w-4 h-4" />
      </DropdownButton>
      
      {/* 高亮颜色 */}
      <DropdownButton 
        title="高亮"
        active={editor.isActive('highlight')}
        menuContent={
          <ColorPicker
            colors={HIGHLIGHT_COLORS}
            currentColor={editor.getAttributes('highlight').color}
            onSelect={(color) => {
              if (color) {
                editor.chain().focus().toggleHighlight({ color }).run()
              } else {
                editor.chain().focus().unsetHighlight().run()
              }
            }}
            title="高亮颜色"
          />
        }
      >
        <Highlighter className="w-4 h-4" />
      </DropdownButton>
      
      <ToolbarDivider />
      
      {/* 对齐方式 */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        title="左对齐"
      >
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        title="居中"
      >
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        title="右对齐"
      >
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        active={editor.isActive({ textAlign: 'justify' })}
        title="两端对齐"
      >
        <AlignJustify className="w-4 h-4" />
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
          <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-md shadow-lg z-20 flex gap-2">
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
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
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
        class: "max-w-none p-4 focus:outline-none min-h-[300px] " + editorStyles,
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
        className={cn(
          "[&_.ProseMirror]:min-h-[var(--editor-min-height,300px)] [&_.ProseMirror]:p-4 [&_.ProseMirror]:focus:outline-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          "[&_.ProseMirror]:text-foreground [&_.ProseMirror]:leading-[1.8] [&_.ProseMirror]:text-[15px]",
          "[&_.ProseMirror_h1]:text-[1.75rem] [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:tracking-tight [&_.ProseMirror_h1]:text-foreground [&_.ProseMirror_h1]:mt-8 [&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h1]:pb-2 [&_.ProseMirror_h1]:border-b-2 [&_.ProseMirror_h1]:border-accent/30",
          "[&_.ProseMirror_h2]:text-[1.375rem] [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:text-foreground [&_.ProseMirror_h2]:mt-7 [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:pl-3 [&_.ProseMirror_h2]:border-l-[3px] [&_.ProseMirror_h2]:border-accent",
          "[&_.ProseMirror_h3]:text-[1.125rem] [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-foreground [&_.ProseMirror_h3]:mt-6 [&_.ProseMirror_h3]:mb-2",
          "[&_.ProseMirror_p]:text-muted-foreground [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_p]:leading-[1.85]",
          "[&_.ProseMirror_a]:text-accent [&_.ProseMirror_a]:font-medium [&_.ProseMirror_a]:border-b [&_.ProseMirror_a]:border-accent/30",
          "[&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_strong]:text-foreground [&_.ProseMirror_em]:italic [&_.ProseMirror_u]:underline [&_.ProseMirror_u]:decoration-2 [&_.ProseMirror_u]:underline-offset-4 [&_.ProseMirror_s]:line-through [&_.ProseMirror_s]:opacity-60",
          "[&_.ProseMirror_ul]:my-4 [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:space-y-1 [&_.ProseMirror_ol]:my-4 [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:space-y-1 [&_.ProseMirror_li]:text-muted-foreground [&_.ProseMirror_li]:leading-[1.75] [&_.ProseMirror_li_p]:mb-0",
          "[&_.ProseMirror_blockquote]:my-5 [&_.ProseMirror_blockquote]:py-3 [&_.ProseMirror_blockquote]:px-4 [&_.ProseMirror_blockquote]:rounded-lg [&_.ProseMirror_blockquote]:bg-muted/40 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-accent [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote_p]:mb-0",
          "[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-accent [&_.ProseMirror_code]:border [&_.ProseMirror_code]:border-border/50",
          "[&_.ProseMirror_pre]:my-5 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-xl [&_.ProseMirror_pre]:bg-[#1a1b26] [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:border-none [&_.ProseMirror_pre_code]:text-[#a9b1d6] [&_.ProseMirror_pre_code]:p-0",
          "[&_.ProseMirror_hr]:my-8 [&_.ProseMirror_hr]:border-none [&_.ProseMirror_hr]:h-px [&_.ProseMirror_hr]:bg-gradient-to-r [&_.ProseMirror_hr]:from-transparent [&_.ProseMirror_hr]:via-border [&_.ProseMirror_hr]:to-transparent",
          "[&_.ProseMirror_img]:my-5 [&_.ProseMirror_img]:mx-auto [&_.ProseMirror_img]:block [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded-xl [&_.ProseMirror_img]:shadow-md",
          "[&_.ProseMirror_mark]:bg-yellow-200/70 [&_.ProseMirror_mark]:px-1 [&_.ProseMirror_mark]:rounded",
          "[&_.ProseMirror>*:first-child]:mt-0 [&_.ProseMirror>*:last-child]:mb-0"
        )}
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
