"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Github, Shield, Zap, Code, Search, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

const SOURCE_URL = "https://easygithub.com/index.php"

export default function CopilotPage() {
  const [showVideo, setShowVideo] = useState(false)

  const openSourceSite = () => {
    window.open(SOURCE_URL, "_blank")
  }

  return (
    <div className="min-h-screen bg-[#010409]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#30363d] bg-[#0d1117]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]">
                <ArrowLeft className="w-4 h-4" />
                {"返回"}
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e6edf3] flex items-center justify-center">
                <Github className="w-5 h-5 text-[#0d1117]" />
              </div>
              <span className="font-semibold text-[#e6edf3]">{"GitHub Copilot Activation"}</span>
            </div>
          </div>
          <Link href="/copilot/query" className="hidden md:flex items-center gap-1 text-sm text-[#7d8590] hover:text-[#e6edf3]">
            <Search className="w-4 h-4" />
            {"卡密查询"}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-mono text-[#7d8590] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
            {"OFFICIAL API"}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#e6edf3] mb-2">
            {"GitHub Copilot "}
            <span className="bg-gradient-to-r from-[#58a6ff] via-[#bc8cff] to-[#3fb950] bg-clip-text text-transparent">
              {"充值"}
            </span>
          </h1>
          <p className="text-[#7d8590] text-sm">
            {"通过官方 GraphQL API 安全充值，支持浏览器端 OAuth 授权"}
          </p>
        </div>

        {/* Video Tutorial - Collapsible */}
        <details className="mb-8 group" open={showVideo}>
          <summary 
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 cursor-pointer list-none hover:bg-[#1c2128] transition-colors"
            onClick={() => setShowVideo(!showVideo)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#238636]/20 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-[#3fb950]" />
                </div>
                <span className="text-sm font-medium text-[#e6edf3]">{"视频教程"}</span>
                <span className="text-xs text-[#7d8590]">{"- 点击展开观看完整操作流程"}</span>
              </div>
              <svg className="w-5 h-5 text-[#7d8590] transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="bg-[#161b22] border border-t-0 border-[#30363d] rounded-b-xl p-4 -mt-3">
            <video 
              controls 
              className="w-full rounded-lg border border-[#30363d]"
              preload="metadata"
            >
              <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tutorial-qDmPfcYqOGTMR0x0CMgMKQMkv9joKN.mp4" type="video/mp4" />
              {"您的浏览器不支持视频播放"}
            </video>
          </div>
        </details>

        {/* Main Action Card */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 mb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#58a6ff] to-[#bc8cff] mx-auto mb-4 flex items-center justify-center">
              <Github className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#e6edf3] mb-2">{"开始激活 GitHub Copilot"}</h2>
            <p className="text-[#7d8590] text-sm">{"点击下方按钮前往激活页面，按照提示完成操作"}</p>
          </div>

          <Button
            onClick={openSourceSite}
            className="w-full bg-[#238636] hover:bg-[#2ea043] text-white py-6 text-lg font-bold mb-4"
          >
            <Github className="w-5 h-5 mr-2" />
            {"前往激活页面"}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-center text-xs text-[#6e7681]">
            {"将在新窗口打开激活页面"}
          </p>
        </div>

        {/* Steps */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-[#e6edf3] mb-4">{"激活步骤"}</h3>
          <div className="space-y-4">
            {[
              { step: "01", title: "输入卡密", desc: "在激活页面输入您购买的激活码" },
              { step: "02", title: "拖动书签", desc: "将绿色按钮拖到浏览器书签栏" },
              { step: "03", title: "GitHub 授权", desc: "点击按钮打开 GitHub 授权页面，完成授权" },
              { step: "04", title: "获取 Token", desc: "授权完成后点击书签栏的按钮获取 Token" },
              { step: "05", title: "确认充值", desc: "返回页面确认信息并完成充值" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                  <span className="text-xs font-mono text-[#3fb950]">{item.step}</span>
                </div>
                <div>
                  <p className="text-[#e6edf3] font-medium">{item.title}</p>
                  <p className="text-sm text-[#7d8590]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Code, title: "官方 API", desc: "正版渠道", color: "#3fb950" },
            { icon: Shield, title: "OAuth 授权", desc: "不保存密码", color: "#58a6ff" },
            { icon: Zap, title: "即时生效", desc: "充值秒到", color: "#bc8cff" },
            { icon: Search, title: "可查记录", desc: "随时可查", color: "#e3b341" },
          ].map((f, i) => (
            <div key={i} className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#30363d]/80 transition-colors">
              <div className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center" style={{ backgroundColor: `${f.color}15` }}>
                <f.icon className="w-4 h-4" style={{ color: f.color }} />
              </div>
              <p className="text-sm font-medium text-[#e6edf3]">{f.title}</p>
              <p className="text-xs text-[#6e7681]">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile Button */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#0d1117]/95 backdrop-blur-xl border-t border-[#30363d]">
          <Button
            onClick={openSourceSite}
            className="w-full bg-[#238636] hover:bg-[#2ea043] text-white py-4 font-bold"
          >
            <Github className="w-5 h-5 mr-2" />
            {"前往激活页面"}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363d] py-6 mt-12 mb-20 md:mb-0">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm text-[#7d8590]">{"© 2026 GitHub Copilot Activation"}</p>
        </div>
      </footer>
    </div>
  )
}
