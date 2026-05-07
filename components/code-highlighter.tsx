"use client"

import { useEffect, useRef, useState } from "react"
import hljs from "highlight.js/lib/core"
import javascript from "highlight.js/lib/languages/javascript"
import typescript from "highlight.js/lib/languages/typescript"
import python from "highlight.js/lib/languages/python"
import bash from "highlight.js/lib/languages/bash"
import json from "highlight.js/lib/languages/json"
import css from "highlight.js/lib/languages/css"
import xml from "highlight.js/lib/languages/xml"
import sql from "highlight.js/lib/languages/sql"
import { Check, Copy } from "lucide-react"

// 注册常用语言
hljs.registerLanguage("javascript", javascript)
hljs.registerLanguage("js", javascript)
hljs.registerLanguage("typescript", typescript)
hljs.registerLanguage("ts", typescript)
hljs.registerLanguage("python", python)
hljs.registerLanguage("py", python)
hljs.registerLanguage("bash", bash)
hljs.registerLanguage("shell", bash)
hljs.registerLanguage("sh", bash)
hljs.registerLanguage("json", json)
hljs.registerLanguage("css", css)
hljs.registerLanguage("html", xml)
hljs.registerLanguage("xml", xml)
hljs.registerLanguage("sql", sql)

interface CodeHighlighterProps {
  html: string
  className?: string
}

export function CodeHighlighter({ html, className }: CodeHighlighterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (containerRef.current) {
      // 查找所有代码块
      const preBlocks = containerRef.current.querySelectorAll("pre")
      
      preBlocks.forEach((pre, index) => {
        // 检查是否已经添加过复制按钮
        if (pre.querySelector(".code-copy-btn")) return
        
        // 设置 pre 为相对定位
        pre.style.position = "relative"
        
        // 创建复制按钮
        const copyBtn = document.createElement("button")
        copyBtn.className = "code-copy-btn"
        copyBtn.setAttribute("data-index", String(index))
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`
        copyBtn.style.cssText = `
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 6px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: #8b949e;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        `
        
        // 鼠标悬停显示按钮
        pre.addEventListener("mouseenter", () => {
          copyBtn.style.opacity = "1"
        })
        pre.addEventListener("mouseleave", () => {
          copyBtn.style.opacity = "0"
        })
        
        // 点击复制
        copyBtn.addEventListener("click", async () => {
          const code = pre.querySelector("code")
          if (code) {
            const text = code.textContent || ""
            await navigator.clipboard.writeText(text)
            
            // 显示复制成功
            copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
            copyBtn.style.color = "#7ee787"
            copyBtn.style.background = "rgba(126, 231, 135, 0.1)"
            copyBtn.style.borderColor = "rgba(126, 231, 135, 0.3)"
            
            // 2秒后恢复
            setTimeout(() => {
              copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`
              copyBtn.style.color = "#8b949e"
              copyBtn.style.background = "rgba(255, 255, 255, 0.1)"
              copyBtn.style.borderColor = "rgba(255, 255, 255, 0.2)"
            }, 2000)
          }
        })
        
        pre.appendChild(copyBtn)
        
        // 高亮代码
        const codeBlock = pre.querySelector("code")
        if (codeBlock && !codeBlock.classList.contains("hljs")) {
          hljs.highlightElement(codeBlock as HTMLElement)
        }
      })
    }
  }, [html])

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
