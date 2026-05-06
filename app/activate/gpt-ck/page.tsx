"use client"

import { useState, useRef } from "react"
import { Check, Loader2, ExternalLink, Key, Shield, Zap, CheckCircle, XCircle, Play, ChevronDown, User, Mail, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import ActivateLayout, { StepIndicator, AlertMessage, ActivateInput, ActivateButton, ActivateTextarea } from "@/components/activate-layout"

// CK渠道使用紫色主题，与CZ渠道的绿色区分
const BRAND = "#8B5CF6"

type Step = "input" | "confirm" | "result"
type MessageType = "success" | "error" | "info" | "warning"

interface VerifyResult {
  cdk: { code: string; status: string; expiresAt: string | null }
  platformResult: {
    platform: string
    data: {
      account: {
        email: string
        userId: string
        planType: string
        billingCycle: string
        willRenew: boolean
        renewDate: string
        hasActiveSubscription: boolean
        subscriptionExpiresAt: string
      }
    }
  }
}

// 使用 CK 渠道 API (ck.duolg.com)
function useGptApi() {
  const gptApi = async (action: string, params: Record<string, unknown> = {}) => {
    const res = await fetch("/api/gpt-activate-ck", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ action, ...params }) 
    })
    return res.json()
  }
  return gptApi
}

// 错误码本地化
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CDK_FORMAT: "CDK 格式无效",
  CDK_NOT_FOUND: "CDK 不存在",
  CDK_ALREADY_USED: "CDK 已使用",
  CDK_DISABLED: "CDK 已禁用",
  ACCOUNT_INVALID: "账号校验失败",
  ACCOUNT_VERIFICATION_FAILED: "账号校验服务异常",
  NO_AVAILABLE_CREDENTIAL: "暂无可用兑换资源",
  RECHARGE_FAILED: "兑换执行失败",
  CONFIRM_REQUIRED: "缺少确认标志",
  NETWORK_ERROR: "网络异常",
  TIMEOUT: "请求超时",
  UNKNOWN_ERROR: "未知错误",
}

function getErrorMessage(error: { code?: string; message?: string } | string): string {
  if (typeof error === "string") return error
  if (error.code && ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code]
  return error.message || "未知错误"
}

// 验证凭证 JSON
function validateCredential(jsonStr: string): { valid: boolean; error?: string; data?: any } {
  try {
    const parsed = JSON.parse(jsonStr)
    if (!parsed.user?.id) return { valid: false, error: "缺少 user.id 字段" }
    if (!parsed.user?.email) return { valid: false, error: "缺少 user.email 字段" }
    if (!parsed.account?.id) return { valid: false, error: "缺少 account.id 字段" }
    if (!parsed.account?.planType) return { valid: false, error: "缺少 account.planType 字段" }
    if (!parsed.accessToken) return { valid: false, error: "缺少 accessToken 字段" }
    return { valid: true, data: parsed }
  } catch {
    return { valid: false, error: "JSON 格式错误" }
  }
}

// 验证 CDK 格式
function validateCdk(cdk: string): boolean {
  if (!cdk || cdk.length < 36) return false
  // 检查是否包含 UUID4 片段
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  return uuidPattern.test(cdk)
}

// 构建 platformCredential
function buildPlatformCredential(data: any) {
  return {
    platform: "chatgpt",
    data: {
      user: data.user,
      account: data.account,
      accessToken: data.accessToken
    }
  }
}

export default function GptActivateCkPage() {
  const gptApi = useGptApi()
  const [step, setStep] = useState<Step>("input")
  
  // 输入状态
  const [cdk, setCdk] = useState("")
  const [credentialJson, setCredentialJson] = useState("")
  
  // 验证结果
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [credentialData, setCredentialData] = useState<any>(null)
  
  // UI 状态
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: MessageType } | null>(null)
  const [resultStatus, setResultStatus] = useState<"success" | "failed" | "idle">("idle")
  const [resultMessage, setResultMessage] = useState("")

  const [showVideo, setShowVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // 步骤1：验证 CDK 和凭证
  async function handleVerify() {
    setMessage(null)
    
    // 验证 CDK 格式
    const trimmedCdk = cdk.trim()
    if (!trimmedCdk) {
      setMessage({ text: "请输入 CDK", type: "error" })
      return
    }
    if (!validateCdk(trimmedCdk)) {
      setMessage({ text: "CDK 格式无效，请检查后重试", type: "error" })
      return
    }
    
    // 验证凭证 JSON
    const validation = validateCredential(credentialJson)
    if (!validation.valid) {
      setMessage({ text: validation.error || "凭证数据无效", type: "error" })
      return
    }
    
    // 检查是否为团队账户
    if (validation.data.account.planType === "team") {
      setMessage({ text: "不支持团队账户（Team），请使用个人账户", type: "error" })
      return
    }
    
    setLoading(true)
    
    try {
      const platformCredential = buildPlatformCredential(validation.data)
      const response = await gptApi("verify", {
        cdk: trimmedCdk,
        platformCredential
      })
      
      if (response.success && response.data) {
        setVerifyResult(response.data)
        setCredentialData(validation.data)
        setStep("confirm")
      } else {
        setMessage({ text: getErrorMessage(response.error || response.message || "验证失败"), type: "error" })
      }
    } catch {
      setMessage({ text: "网络异常，请重试", type: "error" })
    }
    
    setLoading(false)
  }

  // 步骤2：确认兑换
  async function handleConfirm() {
    if (!credentialData) return
    
    setLoading(true)
    setMessage(null)
    
    try {
      const platformCredential = buildPlatformCredential(credentialData)
      const response = await gptApi("confirm", {
        cdk: cdk.trim(),
        platformCredential
      })
      
      if (response.success) {
        setResultStatus("success")
        setResultMessage(response.data?.message || response.message || "兑换成功！ChatGPT Plus 已激活")
        setStep("result")
      } else {
        setResultStatus("failed")
        setResultMessage(getErrorMessage(response.error || response.message || "兑换失败"))
        setStep("result")
      }
    } catch {
      setResultStatus("failed")
      setResultMessage("网络异常，请重试")
      setStep("result")
    }
    
    setLoading(false)
  }

  // 重置
  function handleReset() {
    setStep("input")
    setCdk("")
    setCredentialJson("")
    setVerifyResult(null)
    setCredentialData(null)
    setMessage(null)
    setResultStatus("idle")
    setResultMessage("")
  }

  const msgTypeMap: Record<MessageType, "success" | "error" | "warning" | "info"> = { success: "success", error: "error", warning: "warning", info: "info" }

  return (
    <ActivateLayout
      brandColor={BRAND}
      icon={<svg viewBox="0 0 24 24" className="w-7 h-7" style={{ color: BRAND }} fill="currentColor"><path d="M22.2 8.59c.4-1.55.1-3.22-.85-4.43A5.2 5.2 0 0016.39 2a5.26 5.26 0 00-4.7 2.82A5.21 5.21 0 005.6 7.14a5.26 5.26 0 00-3.4 6.27c-.4 1.55-.1 3.22.85 4.43A5.2 5.2 0 008 19.98a5.26 5.26 0 004.7-2.82 5.21 5.21 0 006.1-2.32A5.26 5.26 0 0022.2 8.6z"/></svg>}
      title="ChatGPT Plus 充值"
      subtitle="CK渠道 - 安全快速的会员激活服务"
      features={[
        { icon: <Shield className="w-5 h-5" style={{ color: BRAND }} />, label: "非零元购" },
        { icon: <Zap className="w-5 h-5" style={{ color: BRAND }} />, label: "无需上号" },
        { icon: <Key className="w-5 h-5" style={{ color: BRAND }} />, label: "零风险" },
      ]}
    >
      <StepIndicator
        steps={[{ num: 1, label: "输入信息" }, { num: 2, label: "确认兑换" }, { num: 3, label: "完成" }]}
        currentStep={step === "input" ? 1 : step === "confirm" ? 2 : 3}
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
              <p className="text-sm font-medium text-foreground">充值教程</p>
              <p className="text-[11px] text-muted-foreground">观看视频了解完整操作流程</p>
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
              您的浏览器不支持视频播放
            </video>
          </div>
        )}
      </div>

      {/* Global message */}
      {message && <AlertMessage type={msgTypeMap[message.type]}>{message.text}</AlertMessage>}

      {/* Step: Input */}
      {step === "input" && (
        <div className="space-y-5">
          {/* CDK Input */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              <Key className="w-4 h-4 inline mr-1.5" style={{ color: BRAND }} />
              CDK 激活码
            </label>
            <ActivateInput
              type="text"
              value={cdk}
              onChange={(e) => { setCdk(e.target.value); setMessage(null) }}
              placeholder="请输入您的 CDK 激活码"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">购买后您将收到 CDK 激活码</p>
          </div>

          {/* Credential JSON Input */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              <User className="w-4 h-4 inline mr-1.5" style={{ color: BRAND }} />
              账号凭证 JSON
            </label>
            <ActivateTextarea
              value={credentialJson}
              onChange={(e) => { setCredentialJson(e.target.value); setMessage(null) }}
              placeholder={'请粘贴从 ChatGPT 获取的 JSON 数据...\n\n获取步骤：\n1. 登录 chatgpt.com\n2. 访问 chatgpt.com/api/auth/session\n3. 复制页面内容粘贴到此处'}
              rows={8}
            />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => window.open("https://chatgpt.com/api/auth/session", "_blank")}
              variant="outline"
              className="h-11 rounded-xl text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" /> 获取凭证
            </Button>
            <ActivateButton brandColor={BRAND} onClick={handleVerify} disabled={loading || !cdk.trim() || !credentialJson.trim()}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />验证中...</> : <><Check className="w-4 h-4" />验证并继续</>}
            </ActivateButton>
          </div>

          <div className="text-center">
            <a href="/activate/gpt" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {"或使用 "}
              <span className="text-emerald-500 hover:text-emerald-600 underline">CZ渠道</span>
              {" 进行激活"}
            </a>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && verifyResult && (
        <div className="space-y-5">
          <div className="bg-secondary/50 border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: BRAND }} />
              验证成功，请确认信息
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>账号邮箱：</span>
                <strong className="text-foreground">{verifyResult.platformResult?.data?.account?.email || "未知"}</strong>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                <span>当前订阅：</span>
                <strong className="text-foreground">{verifyResult.platformResult?.data?.account?.planType || "free"}</strong>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Key className="w-4 h-4" />
                <span>CDK 状态：</span>
                <strong className="text-foreground">{verifyResult.cdk?.status === "unused" ? "未使用" : verifyResult.cdk?.status}</strong>
              </div>
            </div>
          </div>

          <AlertMessage type="warning">
            确认后将为上述账号充值 ChatGPT Plus 会员，此操作不可撤销。
          </AlertMessage>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setStep("input")} variant="outline" className="h-11 rounded-xl text-sm">
              返回修改
            </Button>
            <ActivateButton brandColor={BRAND} onClick={handleConfirm} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />兑换中...</> : <><Check className="w-4 h-4" />确认兑换</>}
            </ActivateButton>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && (
        <div>
          {resultStatus === "success" && (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">兑换成功！</h3>
              <p className="text-sm text-muted-foreground mb-4">{resultMessage}</p>
              <div className="bg-secondary border border-border rounded-xl p-4 text-left space-y-2 mb-5">
                <p className="text-sm text-muted-foreground">
                  <Key className="w-3.5 h-3.5 inline mr-1.5" />
                  <strong className="text-foreground">CDK：</strong>{cdk}
                </p>
                {verifyResult?.platformResult?.data?.account?.email && (
                  <p className="text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 inline mr-1.5" />
                    <strong className="text-foreground">充值账号：</strong>{verifyResult.platformResult.data.account.email}
                  </p>
                )}
              </div>
              <a
                href="https://chatgpt.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: BRAND }}
              >
                前往 ChatGPT <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
          
          {resultStatus === "failed" && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-destructive mb-2">兑换失败</h3>
              <p className="text-sm text-muted-foreground mb-4">{resultMessage}</p>
              <Button onClick={handleReset} variant="outline" className="rounded-xl">
                重新尝试
              </Button>
            </div>
          )}
        </div>
      )}
    </ActivateLayout>
  )
}
