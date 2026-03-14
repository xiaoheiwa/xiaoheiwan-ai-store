"use client"

import { useState, useEffect } from "react"
import { X, Copy, ExternalLink } from "lucide-react"

export default function WeChatRedirect() {
  const [mounted, setMounted] = useState(false)
  const [isWeChat, setIsWeChat] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent.toLowerCase()
      const isWeChatBrowser = userAgent.includes("micromessenger")

      console.log("[v0] WeChat browser detected:", isWeChatBrowser)

      setIsWeChat(isWeChatBrowser)
      if (isWeChatBrowser) {
        setTimeout(() => {
          setShowModal(true)
        }, 100)
      }
    }
  }, [])

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      const textArea = document.createElement("textarea")
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!mounted || !isWeChat || !showModal) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setShowModal(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <ExternalLink className="h-8 w-8 text-blue-600" />
          </div>

          <h3 className="mb-2 text-xl font-semibold text-gray-900">请在浏览器中打开</h3>

          <p className="mb-6 text-sm text-gray-600">为了获得最佳体验，请复制链接并在浏览器中打开</p>

          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <p className="break-all text-xs text-gray-700">
              {typeof window !== "undefined" ? window.location.href : ""}
            </p>
          </div>

          <button
            onClick={copyUrl}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700"
          >
            <Copy className="h-4 w-4" />
            {copied ? "已复制!" : "一键复制链接"}
          </button>

          <div className="text-xs text-gray-500">
            <p className="mb-1">复制后请按以下步骤操作：</p>
            <p>1. 点击右上角 "..." 菜单</p>
            <p>2. 选择 "在浏览器中打开"</p>
            <p>3. 粘贴链接并访问</p>
          </div>
        </div>
      </div>
    </div>
  )
}
