"use client"

import { useEffect, useRef } from "react"
import hljs from "highlight.js/lib/core"
import javascript from "highlight.js/lib/languages/javascript"
import typescript from "highlight.js/lib/languages/typescript"
import python from "highlight.js/lib/languages/python"
import bash from "highlight.js/lib/languages/bash"
import json from "highlight.js/lib/languages/json"
import css from "highlight.js/lib/languages/css"
import xml from "highlight.js/lib/languages/xml"
import sql from "highlight.js/lib/languages/sql"

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

  useEffect(() => {
    if (containerRef.current) {
      // 查找所有代码块并高亮
      const codeBlocks = containerRef.current.querySelectorAll("pre code")
      codeBlocks.forEach((block) => {
        // 检查是否已经高亮过
        if (!block.classList.contains("hljs")) {
          hljs.highlightElement(block as HTMLElement)
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
