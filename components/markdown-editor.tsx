"use client"

import { useRef, useState } from "react"
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Code, Link2, ImagePlus, Eye, EyeOff } from "lucide-react"
import { renderPreview } from "@/lib/markdown"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

function insertMarkdown(
  textarea: HTMLTextAreaElement,
  setValue: (value: string) => void,
  config: { before: string; after: string; placeholder: string; block?: boolean }
) {
  const { before, after, placeholder, block } = config
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const selected = value.substring(start, end)
  const text = selected || placeholder

  let insert: string
  let cursorStart: number
  let cursorEnd: number

  if (block) {
    const prefix = start > 0 && value[start - 1] !== "\n" ? "\n" : ""
    const suffix = end < value.length && value[end] !== "\n" ? "\n" : ""
    insert = `${prefix}${before}${text}${after}${suffix}`
    cursorStart = start + prefix.length + before.length
    cursorEnd = cursorStart + text.length
  } else {
    insert = `${before}${text}${after}`
    cursorStart = start + before.length
    cursorEnd = cursorStart + text.length
  }

  const newValue = value.substring(0, start) + insert + value.substring(end)
  setValue(newValue)

  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(cursorStart, selected ? cursorStart : cursorEnd)
  })
}

const toolbarActions = [
  { icon: Bold, label: "粗体", shortcut: "B", action: () => ({ before: "**", after: "**", placeholder: "粗体文字" }) },
  { icon: Italic, label: "斜体", shortcut: "I", action: () => ({ before: "*", after: "*", placeholder: "斜体文字" }) },
  { icon: Heading2, label: "标题2", action: () => ({ before: "## ", after: "", placeholder: "二级标题", block: true }) },
  { icon: Heading3, label: "标题3", action: () => ({ before: "### ", after: "", placeholder: "三级标题", block: true }) },
  { icon: List, label: "无序列表", action: () => ({ before: "- ", after: "", placeholder: "列表项", block: true }) },
  { icon: ListOrdered, label: "有序列表", action: () => ({ before: "1. ", after: "", placeholder: "列表项", block: true }) },
  { icon: Quote, label: "引用", action: () => ({ before: "> ", after: "", placeholder: "引用内容", block: true }) },
  { icon: Code, label: "代码", shortcut: "E", action: () => ({ before: "`", after: "`", placeholder: "code" }) },
  { icon: Link2, label: "链接", shortcut: "K", action: () => ({ before: "[", after: "](https://)", placeholder: "链接文字" }) },
  { icon: ImagePlus, label: "图片", action: () => ({ before: "![", after: "](https://)", placeholder: "图片描述", block: true }) },
]

export function MarkdownEditor({ value, onChange, placeholder, minHeight = "200px" }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showPreview, setShowPreview] = useState(false)

  const doInsert = (config: { before: string; after: string; placeholder: string; block?: boolean }) => {
    if (!textareaRef.current) return
    insertMarkdown(textareaRef.current, onChange, config)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return
    const key = e.key.toLowerCase()
    const found = toolbarActions.find(a => a.shortcut && a.shortcut.toLowerCase() === key)
    if (found && textareaRef.current) {
      e.preventDefault()
      doInsert(found.action())
    }
  }

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const val = ta.value
      const newVal = val.substring(0, start) + "  " + val.substring(end)
      onChange(newVal)
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(start + 2, start + 2)
      })
    }
  }

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-2 py-1.5 bg-muted/30">
        <div className="flex items-center flex-wrap gap-0.5">
          {toolbarActions.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="contents">
                {(i === 2 || i === 4 || i === 7 || i === 9) && <div className="w-px h-4 bg-border mx-1" />}
                <button
                  type="button"
                  onClick={() => doInsert(item.action())}
                  title={`${item.label}${item.shortcut ? ` (Ctrl+${item.shortcut})` : ""}`}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          title={showPreview ? "隐藏预览" : "显示预览"}
          className={`p-1.5 rounded transition-colors ${showPreview ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Editor + Preview */}
      <div className={showPreview ? "grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border" : ""}>
        <div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={(e) => { handleKeyDown(e); handleTab(e) }}
            placeholder={placeholder || "支持 Markdown 语法..."}
            className="w-full bg-transparent px-3 py-2.5 text-sm font-mono leading-relaxed focus:outline-none resize-y"
            style={{ minHeight }}
          />
        </div>
        {showPreview && (
          <div className="p-3 overflow-auto bg-background/50" style={{ maxHeight: "400px" }}>
            <div className="text-[10px] text-muted-foreground/50 mb-2 font-medium uppercase tracking-wider">{"预览"}</div>
            {value ? (
              <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderPreview(value) }} />
            ) : (
              <p className="text-sm text-muted-foreground/40 italic">{"输入内容后显示预览..."}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
