"use client"

import { useState, useRef } from "react"
import { ArrowLeft, Check, Loader2, ExternalLink, Key, Shield, Zap, AlertTriangle, CheckCircle, XCircle, RefreshCw, Play, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import ActivateLayout, { StepIndicator, AlertMessage, ActivateInput, ActivateButton, ActivateTextarea } from "@/components/activate-layout"

const BRAND = "#10A37F"

type Step = 1 | 2 | 3
type MessageType = "success" | "error" | "info" | "warning"

interface CardInfo { is_new: boolean; email?: string; [key: string]: any }
interface RechargeResult { status: "idle" | "processing" | "success" | "failed"; message: string }

async function gptApi(action: string, params: Record<string, string> = {}) {
  const res = await fetch("/api/gpt-activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...params }) })
  return res.json()
}

export default function GptActivatePage() {
  const [step, setStep] = useState<Step>(1)
  const [cardCode, setCardCode] = useState("")
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null)
  const [userData, setUserData] = useState("")
  const [boundEmail, setBoundEmail] = useState("")

  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [message, setMessage] = useState<{ text: string; type: MessageType } | null>(null)
  const [result, setResult] = useState<RechargeResult>({ status: "idle", message: "" })

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")

  const [showUpdateToken, setShowUpdateToken] = useState(false)
  const [newTokenData, setNewTokenData] = useState("")
  const [updatingToken, setUpdatingToken] = useState(false)

  function getEmailFromToken(token: string): string {
    try {
      if (!token) return "unknown@example.com"
      const parts = token.split(".")
      if (parts.length < 2) return "unknown@example.com"
      const payload = JSON.parse(atob(parts[1]))
      return payload?.["https://api.openai.com/profile"]?.email || "unknown@example.com"
    } catch { return "unknown@example.com" }
  }

  async function handleVerifyCard() {
    if (!cardCode.trim()) { setMessage({ text: "请输入激活码", type: "error" }); return }
    setVerifying(true); setMessage(null); setResult({ status: "idle", message: "" })
    try {
      const data = await gptApi("verify_code", { activation_code: cardCode.trim().toUpperCase() })
      if (data.success) {
        setMessage({ text: "激活码验证成功", type: "success" }); setCardInfo(data); setStep(2)
        if (!data.is_new && data.email) setBoundEmail(data.email)
      } else { setMessage({ text: data.error || data.message || "激活码无效，请检查后重试", type: "error" }) }
    } catch { setMessage({ text: "网络错误，请重试", type: "error" }) }
    setVerifying(false)
  }

  async function handleSubmitJson(jsonStr: string) {
    try {
      const parsed = JSON.parse(jsonStr)
      if (!parsed.user?.id || !parsed.account?.id || !parsed.accessToken) { setMessage({ text: "用户数据缺少必要字段（user.id, account.id, accessToken）", type: "error" }); return }
      if (parsed.account?.planType === "team") { setMessage({ text: "不支持团队账户（Team），请使用个人账户", type: "error" }); return }
      if (parsed.account?.planType === "pro") { setMessage({ text: "您的账户未到期，请到期后再充值", type: "warning" }); return }
      const email = getEmailFromToken(parsed.accessToken)
      if (!email || email === "unknown@example.com") { setMessage({ text: "无法解析账户邮箱，请确认已在个人账号登录后获取数据", type: "error" }); return }
      setConfirmEmail(email); setShowConfirmModal(true)
    } catch { setMessage({ text: "JSON 格式错误，请检查数据", type: "error" }) }
  }

  async function confirmRecharge() {
    setShowConfirmModal(false); setSubmitting(true); setMessage(null); setResult({ status: "processing", message: "正在处理充值..." })
    try {
      const data = await gptApi("submit_json", { json_token: userData })
      if (data.success) { setResult({ status: "success", message: data.message || "充值成功！ChatGPT Plus 已激活" }); setStep(3) }
      else { setResult({ status: "failed", message: data.message || data.error || "充值失败，请重试" }) }
    } catch { setResult({ status: "failed", message: "网络错误，请重试" }) }
    setSubmitting(false)
  }

  async function handleReuseRecord() {
    setSubmitting(true); setMessage(null); setResult({ status: "processing", message: "正在使用已有记录充值..." })
    try {
      const data = await gptApi("reuse_record")
      if (data.success) { setResult({ status: "success", message: data.message || "充值成功！ChatGPT Plus 已激活" }); setStep(3) }
      else { setResult({ status: "failed", message: data.message || data.error || "复用失败，请重试" }) }
    } catch { setResult({ status: "failed", message: "网络错误，请重试" }) }
    setSubmitting(false)
  }

  async function handleUpdateToken() {
    if (!newTokenData.trim()) { setMessage({ text: "请输入新的 JSON 数据", type: "error" }); return }
    try {
      const parsed = JSON.parse(newTokenData)
      if (!parsed.accessToken) { setMessage({ text: "JSON 中缺少 accessToken 字段", type: "error" }); return }
      if (parsed.account?.planType === "team") { setMessage({ text: "不支持团队账户（Team），请使用个人账户", type: "error" }); return }
    } catch { setMessage({ text: "JSON 格式错误", type: "error" }); return }

    setUpdatingToken(true); setMessage(null); setResult({ status: "processing", message: "正在更新 Token 并充值..." })
    try {
      const data = await gptApi("update_token", { json_token: newTokenData })
      if (data.success) { setShowUpdateToken(false); setNewTokenData(""); setResult({ status: "success", message: data.message || "更新成功，ChatGPT Plus 已激活" }); setStep(3) }
      else { setResult({ status: "failed", message: data.message || data.error || "更新失败，请重试" }) }
    } catch { setResult({ status: "failed", message: "网络错误，请重试" }) }
    setUpdatingToken(false)
  }

  function handleBack() {
    setStep(1); setCardInfo(null); setBoundEmail(""); setMessage(null); setResult({ status: "idle", message: "" }); setUserData(""); setCardCode(""); setShowUpdateToken(false)
  }

  const [showVideo, setShowVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const msgTypeMap: Record<MessageType, "success" | "error" | "warning" | "info"> = { success: "success", error: "error", warning: "warning", info: "info" }

  return (
    <ActivateLayout
      brandColor={BRAND}
      icon={<svg viewBox="0 0 24 24" className="w-7 h-7" style={{ color: BRAND }} fill="currentColor"><path d="M22.2 8.59c.4-1.55.1-3.22-.85-4.43A5.2 5.2 0 0016.39 2a5.26 5.26 0 00-4.7 2.82A5.21 5.21 0 005.6 7.14a5.26 5.26 0 00-3.4 6.27c-.4 1.55-.1 3.22.85 4.43A5.2 5.2 0 008 19.98a5.26 5.26 0 004.7-2.82 5.21 5.21 0 006.1-2.32A5.26 5.26 0 0022.2 8.6z"/></svg>}
      title="ChatGPT Plus 充值"
      subtitle="安全快速的 ChatGPT Plus 会员激活服务"
      features={[
        { icon: <Shield className="w-5 h-5" style={{ color: BRAND }} />, label: "非零元购" },
        { icon: <Zap className="w-5 h-5" style={{ color: BRAND }} />, label: "无需上号" },
        { icon: <Key className="w-5 h-5" style={{ color: BRAND }} />, label: "零风险" },
      ]}
    >
      <StepIndicator
        steps={[{ num: 1, label: "验证卡密" }, { num: 2, label: "提交数据" }, { num: 3, label: "充值完成" }]}
        currentStep={step}
        brandColor={BRAND}
      />

      {/* Video Tutorial */}
      <div className="mb-6">
        <button
          onClick={() => {
            setShowVideo(!showVideo)
            if (!showVideo && videoRef.current) {
              setTimeout(() => videoRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100)
            }
          }}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${BRAND}15` }}>
              <Play className="w-4 h-4" style={{ color: BRAND }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{"充值教程"}</p>
              <p className="text-[11px] text-muted-foreground">{"观看视频了解完整操作流程"}</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showVideo ? "rotate-180" : ""}`} />
        </button>

        {showVideo && (
          <div className="mt-3 rounded-xl overflow-hidden border border-border bg-black">
            <video
              ref={videoRef}
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9977%E6%95%99%E7%A8%8B-sBvMx3JNaOcmbMGhPRIusVCMpLzdUf.mp4"
              controls
              playsInline
              preload="metadata"
              className="w-full aspect-video"
              controlsList="nodownload"
            >
              {"您的浏览器不支持视频播放"}
            </video>
          </div>
        )}
      </div>

      {/* Global message */}
      {message && <AlertMessage type={msgTypeMap[message.type]}>{message.text}</AlertMessage>}

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">卡密</label>
            <ActivateInput
              type="text" value={cardCode}
              onChange={(e) => { setCardCode(e.target.value.toUpperCase()); setMessage(null) }}
              onKeyDown={(e) => { if (e.key === "Enter") handleVerifyCard() }}
              placeholder="请输入您的卡密"
            />
            <p className="mt-2 text-xs text-muted-foreground">购买后您将立即收到卡密激活码</p>
          </div>
          <ActivateButton brandColor={BRAND} onClick={handleVerifyCard} disabled={verifying}>
            {verifying ? <><Loader2 className="w-4 h-4 animate-spin" />{"验证中..."}</> : <><Check className="w-4 h-4" />{"立即验证"}</>}
          </ActivateButton>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Already bound account */}
          {cardInfo && !cardInfo.is_new && (
            <div className="space-y-4">
              <AlertMessage type="info">
                <span className="flex items-center gap-1.5 font-bold"><AlertTriangle className="w-4 h-4" /> 发现已绑定账户</span>
                {boundEmail && <p className="text-sm mt-1 ml-5.5 opacity-80">{"此激活码已使用，已绑定邮箱："}<strong className="text-foreground">{boundEmail}</strong></p>}
              </AlertMessage>
              <AlertMessage type="warning">此激活码已使用，只能复用已有记录</AlertMessage>

              <ActivateButton brandColor={BRAND} onClick={handleReuseRecord} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                使用已有记录充值
              </ActivateButton>
              <Button onClick={() => setShowUpdateToken(true)} variant="outline" className="w-full h-11 rounded-xl text-sm">
                更新 Token
              </Button>

              {showUpdateToken && (
                <div className="border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">更新 Token</h4>
                  <p className="text-[11px] text-muted-foreground">如果您的 Token 已过期，请获取最新 JSON 数据粘贴到下方更新。</p>
                  <ActivateTextarea value={newTokenData} onChange={(e) => setNewTokenData(e.target.value)} placeholder="请粘贴完整的 JSON 数据" rows={6} />
                  <div className="flex gap-2">
                    <Button onClick={() => window.open("https://chatgpt.com/api/auth/session", "_blank")} variant="outline" className="flex-1 h-10 rounded-xl text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" /> 获取数据
                    </Button>
                    <ActivateButton brandColor={BRAND} onClick={handleUpdateToken} disabled={updatingToken} className="flex-1 !h-10 !text-xs">
                      {updatingToken ? <Loader2 className="w-3 h-3 animate-spin" /> : null} 更新 Token
                    </ActivateButton>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New card */}
          {cardInfo && cardInfo.is_new && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">提交充值信息</h3>
                <button onClick={handleBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> 返回</button>
              </div>
              <ActivateTextarea value={userData} onChange={(e) => setUserData(e.target.value)} placeholder="请粘贴您的账户 JSON 数据..." rows={10} />
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => setShowLoginModal(true)} variant="outline" className="h-11 rounded-xl text-sm">
                  <ExternalLink className="w-4 h-4 mr-1.5" /> 登入帐号
                </Button>
                <ActivateButton brandColor={BRAND} onClick={() => handleSubmitJson(userData)} disabled={submitting || !userData.trim()} className="!text-sm">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />{"处理中..."}</> : "开始充值"}
                </ActivateButton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div>
          {result.status === "success" && (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-7 h-7 text-accent" /></div>
              <h3 className="text-lg font-bold text-foreground mb-2">充值成功！</h3>
              <p className="text-sm text-muted-foreground mb-4">{result.message}</p>
              <div className="bg-secondary border border-border rounded-xl p-4 text-left space-y-2 mb-5">
                <p className="text-sm text-muted-foreground"><Key className="w-3.5 h-3.5 inline mr-1.5" /><strong className="text-foreground">卡密：</strong>{cardCode}</p>
                {(confirmEmail || boundEmail) && <p className="text-sm text-muted-foreground"><span className="inline mr-1.5">@</span><strong className="text-foreground">充值账号：</strong>{confirmEmail || boundEmail}</p>}
              </div>
              <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: BRAND }}>
                {"前往 ChatGPT"} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
          {result.status === "failed" && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4"><XCircle className="w-7 h-7 text-destructive" /></div>
              <h3 className="text-lg font-bold text-destructive mb-2">充值失败</h3>
              <p className="text-sm text-muted-foreground mb-4">{result.message}</p>
              <Button onClick={handleBack} variant="outline" className="rounded-xl">重试</Button>
            </div>
          )}
          {result.status === "processing" && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: BRAND }} />
              <p className="text-sm text-muted-foreground">{result.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${BRAND}15` }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" style={{ color: BRAND }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">确认登录状态</h3>
              <p className="text-xs text-muted-foreground">请确认您已在 chatgpt.com 登录账户</p>
            </div>
            <div className="flex flex-col gap-2.5">
              <ActivateButton brandColor={BRAND} onClick={() => { setShowLoginModal(false); window.open("https://chatgpt.com/api/auth/session", "_blank") }}>
                <Check className="w-4 h-4" /> 已登录，获取数据
              </ActivateButton>
              <ActivateButton brandColor="#e17055" onClick={() => { setShowLoginModal(false); window.open("https://chatgpt.com/", "_blank") }}>
                <ExternalLink className="w-4 h-4" /> 前往登录
              </ActivateButton>
              <Button onClick={() => setShowLoginModal(false)} variant="outline" className="w-full h-12 rounded-xl text-sm">取消</Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">确认充值账户</h3>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border mb-2">
                <span className="text-sm text-muted-foreground">@</span>
                <span className="text-sm font-semibold text-foreground">{confirmEmail}</span>
              </div>
              <p className="text-xs text-amber-500 mt-2 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> 请确认邮箱地址正确，充值后无法更改
              </p>
            </div>
            <div className="flex gap-2.5">
              <Button onClick={() => setShowConfirmModal(false)} variant="outline" className="flex-1 h-11 rounded-xl text-sm">取消</Button>
              <ActivateButton brandColor={BRAND} onClick={confirmRecharge} className="flex-1 !h-11 !text-sm">
                <Check className="w-4 h-4" /> 确认充值
              </ActivateButton>
            </div>
          </div>
        </div>
      )}
    </ActivateLayout>
  )
}
