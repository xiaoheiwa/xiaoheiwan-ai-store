"use client"

import { useState, useEffect } from "react"
import { Loader2, CheckCircle, XCircle, Clock, Link2, AlertTriangle, Ticket, Copy, Check, RefreshCw, Trash2, HelpCircle, ChevronDown, ChevronUp, ExternalLink, Gift, Smartphone, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import ActivateLayout, { StepIndicator, AlertMessage, ActivateInput, ActivateButton } from "@/components/activate-layout"

const BRAND = "#8B5CF6" // 紫色主题，与 Pixel 品牌契合

type Step = 1 | 2 | 3
type MessageType = "success" | "error" | "info" | "warning"

interface CardVerifyResult {
  valid: boolean
  remaining: number
  total_count: number
  remaining_quota: string
  total_quota: string
  remaining_quota_units: number
  total_quota_units: number
  message: string
}

interface TaskAccount {
  id: number
  line_number: number
  email: string
  status: "pending" | "running" | "processing" | "success" | "failed" | "cancelled"
  message?: string
  result_link?: string
  queue_position?: number
  updated_at?: string
}

interface TaskResult {
  task_id: string
  status: "pending" | "running" | "processing" | "completed" | "partial"
  total_accounts: number
  accounts: TaskAccount[]
  created_at: string
}

export default function PixelActivatePage() {
  const [step, setStep] = useState<Step>(1)
  const [cardKey, setCardKey] = useState("")
  const [cardInfo, setCardInfo] = useState<CardVerifyResult | null>(null)
  const [accountsText, setAccountsText] = useState("")
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskToken, setTaskToken] = useState("")
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null)

  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [polling, setPolling] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [showOffers, setShowOffers] = useState(false)

  const [message, setMessage] = useState<{ text: string; type: MessageType } | null>(null)

  // 通过代理 API 调用，隐藏实际地址
  async function pixelApi(action: string, payload: Record<string, unknown>) {
    const res = await fetch("/api/pixel/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload })
    })
    return res.json()
  }

  // 验证卡密
  async function handleVerifyCard() {
    if (!cardKey.trim()) {
      setMessage({ text: "请输入卡密", type: "error" })
      return
    }
    setVerifying(true)
    setMessage(null)
    try {
      const data = await pixelApi("verify", { card_key: cardKey.trim() })
      if (data.valid) {
        setCardInfo(data)
        setMessage({ text: `卡密验证成功！剩余额度: ${data.remaining_quota_units} 个账号`, type: "success" })
        setStep(2)
      } else {
        setMessage({ text: data.message || "卡密无效", type: "error" })
      }
    } catch (error) {
      setMessage({ text: "验证失败，请稍后重试", type: "error" })
    }
    setVerifying(false)
  }

  // 提交任务
  async function handleSubmitTask() {
    const accounts = accountsText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (accounts.length === 0) {
      setMessage({ text: "请输入至少一个账号", type: "error" })
      return
    }

    if (cardInfo && accounts.length > cardInfo.remaining_quota_units) {
      setMessage({ text: `账号数量(${accounts.length})超过剩余额度(${cardInfo.remaining_quota_units})`, type: "error" })
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const data = await pixelApi("submit", {
        card_key: cardKey.trim(),
        accounts_text: accounts.join("\n"),
      })
      if (data.task_id && data.task_token) {
        setTaskId(data.task_id)
        setTaskToken(data.task_token)
        setMessage({ text: data.message || "任务提交成功，正在处理中...", type: "success" })
        setStep(3)
        pollTaskStatus(data.task_id, data.task_token)
      } else {
        const detail = Array.isArray(data.detail) ? data.detail.map((d: any) => d.msg).join("; ") : data.detail
        setMessage({ text: detail || data.message || data.error || "提交失败", type: "error" })
      }
    } catch (error) {
      setMessage({ text: "提交失败，请稍后重试", type: "error" })
    }
    setSubmitting(false)
  }

  // 轮询任务状态
  async function pollTaskStatus(tid: string, token: string) {
    setPolling(true)
    let consecutiveErrors = 0
    const poll = async () => {
      try {
        const data = await pixelApi("query", {
          task_id: tid,
          card_key: cardKey.trim(),
          task_token: token,
        })
        if (data.task_id) {
          consecutiveErrors = 0
          setTaskResult(data)
          const isActive = data.status === "pending" || data.status === "processing" || data.status === "running"
          if (isActive) {
            setTimeout(() => poll(), 3000)
          } else {
            setPolling(false)
            refreshCardInfo()
          }
        } else {
          throw new Error("查询任务返回无效数据")
        }
      } catch (error) {
        consecutiveErrors += 1
        if (consecutiveErrors >= 5) {
          setPolling(false)
          setMessage({ text: "查询任务多次失败，请稍后手动刷新", type: "error" })
          return
        }
        setTimeout(() => poll(), 5000)
      }
    }
    poll()
  }

  // 刷新卡密信息
  async function refreshCardInfo() {
    try {
      const data = await pixelApi("verify", { card_key: cardKey.trim() })
      if (data.valid) {
        setCardInfo(data)
      }
    } catch (error) {
      console.error("刷新卡密信息失败", error)
    }
  }

  // 取消账号
  async function handleCancelAccount(accountId: number) {
    if (!taskId) return
    try {
      const data = await pixelApi("cancel", {
        task_id: taskId,
        account_id: accountId,
        card_key: cardKey.trim(),
        task_token: taskToken,
      })
      if (data.success || data.message) {
        setMessage({ text: data.message || "已取消该账号，额度已回补", type: "success" })
        pollTaskStatus(taskId, taskToken)
      } else {
        setMessage({ text: data.detail || data.error || "取消失败", type: "error" })
      }
    } catch (error) {
      setMessage({ text: "取消失败，请稍后重试", type: "error" })
    }
  }

  // 复制链接
  function handleCopy(text: string, index: number) {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // 获取状态图标
  function getStatusIcon(status: string) {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "processing":
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-400" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  // 获取状态文本
  function getStatusText(status: string) {
    switch (status) {
      case "success": return "成功"
      case "failed": return "失败"
      case "processing":
      case "running": return "处理中"
      case "cancelled": return "已取消"
      default: return "排队中"
    }
  }

  const icon = (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1" fill={BRAND} />
      <rect x="14" y="3" width="7" height="7" rx="1" fill={BRAND} opacity="0.7" />
      <rect x="3" y="14" width="7" height="7" rx="1" fill={BRAND} opacity="0.7" />
      <rect x="14" y="14" width="7" height="7" rx="1" fill={BRAND} opacity="0.5" />
    </svg>
  )

  return (
    <ActivateLayout
      brandColor={BRAND}
      icon={icon}
      title="Pixel 优惠链接提取"
      subtitle="自助提取 Google Play 优惠链接"
      features={[
        { icon: <Ticket className="w-5 h-5 text-violet-500" />, label: "自动处理" },
        { icon: <Link2 className="w-5 h-5 text-violet-500" />, label: "快速提取" },
        { icon: <CheckCircle className="w-5 h-5 text-violet-500" />, label: "实时状态" },
      ]}
      helpItems={[
        {
          q: "Pixel 是什么？",
          a: "Pixel 是 Google 手机优惠链接提取系统，可自动获取 Google Play 的 Pixel 专属优惠。",
        },
        {
          q: "账号格式是什么？",
          a: (
            <>
              格式：<code className="bg-secondary px-1 rounded text-xs">邮箱----密码----辅助邮箱----2FA密钥</code>
              <br />
              <span className="text-amber-500 text-xs">注意：分隔符是4个英文短横线 ----</span>
            </>
          ),
        },
        {
          q: "2FA密钥怎么获取？",
          a: "购买的账号卖家会提供。自己的账号：Google账号 → 安全性 → 身份验证器 → 获取密钥",
        },
        {
          q: "可以取消吗？",
          a: "排队中(pending)的账号可取消，取消后额度自动回补。",
        },
      ]}
    >
      {/* 详细使用说明折叠区域 */}
      <div className="mb-6">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-violet-500" />
            <span className="font-medium text-foreground">查看详细使用说明</span>
          </div>
          {showGuide ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        
        {showGuide && (
          <div className="mt-3 p-5 rounded-xl bg-card border border-border space-y-5 text-sm">
            {/* 前置条件 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">1</span>
                前置条件
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-8">
                <li>需要有效的卡密（向管理员购买）</li>
                <li>需要可正常登录的 Google 账号</li>
                <li>账号需要开启两步验证并获取 2FA 密钥</li>
              </ul>
            </div>

            {/* 账号格式 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">2</span>
                账号格式说明
              </h4>
              <div className="ml-8 space-y-2">
                <p className="text-muted-foreground">每行一个账号，使用 <code className="bg-secondary px-1.5 py-0.5 rounded text-violet-500 font-mono">----</code>（4个短横线）分隔：</p>
                <div className="bg-secondary/50 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                  <p className="text-foreground">邮箱----密码----辅助邮箱----2FA密钥</p>
                  <p className="text-muted-foreground mt-2">示例：</p>
                  <p className="text-green-500">example@gmail.com----Password123----backup@outlook.com----JBSWY3DPEHPK3PXP</p>
                </div>
                <p className="text-amber-500 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  注意：分隔符是4个英文短横线，不是中文横线
                </p>
              </div>
            </div>

            {/* 获取2FA密钥 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">3</span>
                如何获取 2FA 密钥
              </h4>
              <div className="ml-8 space-y-2 text-muted-foreground">
                <p>如果是购买的账号，卖家通常会提供 2FA 密钥，直接使用即可。</p>
                <p>如果是自己的账号，按以下步骤获取：</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>登录 Google 账号，点击头像 → <span className="text-blue-500">管理 Google 账号</span></li>
                  <li>点击左侧 <span className="text-foreground">安全性</span> → 找到 <span className="text-foreground">身份验证器</span></li>
                  <li>点击 <span className="text-foreground">更改身份验证器</span> 或 <span className="text-foreground">添加身份验证器</span></li>
                  <li>选择 <span className="text-foreground">无法扫描？</span> 获取密钥文本</li>
                  <li>复制显示的密钥（一串字母数字组合）</li>
                </ol>
                <p className="text-xs text-amber-500 flex items-center gap-1 mt-2">
                  <AlertTriangle className="w-3 h-3" />
                  重要：获取密钥后需要完成验证器设置，否则账号会失去两步验证
                </p>
              </div>
            </div>

            {/* 状态说明 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">4</span>
                任务状态说明
              </h4>
              <div className="ml-8 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded bg-secondary/50">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span><span className="text-foreground">排队中</span> - 等待处理</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-secondary/50">
                  <Loader2 className="w-4 h-4 text-blue-500" />
                  <span><span className="text-foreground">处理中</span> - 正在提取</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-secondary/50">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span><span className="text-foreground">成功</span> - 已获取链接</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-secondary/50">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span><span className="text-foreground">失败</span> - 查看错误信息</span>
                </div>
              </div>
            </div>

            {/* 外部链接 */}
            <div className="pt-3 border-t border-border">
              <a
                href="https://my.feishu.cn/wiki/KR7hwOFmmiIq0bk7vb4cQZ7MnJb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-violet-500 hover:text-violet-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>查看完整图文教程（飞书文档）</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Pixel 优惠详情折叠区域 */}
      <div className="mb-6">
        <button
          onClick={() => setShowOffers(!showOffers)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-500" />
            <span className="font-medium text-foreground">Pixel 专属优惠详情</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">官方福利</span>
          </div>
          {showOffers ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        
        {showOffers && (
          <div className="mt-3 p-5 rounded-xl bg-card border border-border space-y-5 text-sm">
            {/* 优惠说明 */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
              <p className="text-muted-foreground">
                购买 Pixel 手机后，可获得 <span className="text-green-500 font-semibold">Google One</span> 或 <span className="text-blue-500 font-semibold">Google AI Pro</span> 专属优惠。
                本系统可自动提取这些优惠链接，让您无需拥有 Pixel 手机也能享受福利。
              </p>
            </div>

            {/* Pixel 10 Pro 系列 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-500" />
                Pixel 10 Pro / Pro XL / Pro Fold
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">热门</span>
              </h4>
              <div className="ml-7 space-y-2">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium">Google AI Pro 方案 - 12个月免费</p>
                    <ul className="text-muted-foreground text-xs mt-1 space-y-0.5">
                      <li>• 2TB 云端存储空间 (Google 相册/云端硬盘/Gmail)</li>
                      <li>• Gemini Advanced (最强版 Gemini)</li>
                      <li>• NotebookLM Plus</li>
                      <li>• Gmail、Google 文档等产品中的 Gemini 功能</li>
                    </ul>
                    <p className="text-green-500 text-xs mt-1">价值约 ¥1,680/年</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pixel 10 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-violet-500" />
                Pixel 10
              </h4>
              <div className="ml-7 space-y-2">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium">Google AI Pro 方案 - 6个月免费</p>
                    <ul className="text-muted-foreground text-xs mt-1 space-y-0.5">
                      <li>• 2TB 云端存储空间</li>
                      <li>• Gemini Advanced</li>
                      <li>• NotebookLM Plus</li>
                    </ul>
                    <p className="text-green-500 text-xs mt-1">价值约 ¥840/半年</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pixel 9 Pro 系列 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-orange-500" />
                Pixel 9 Pro / Pro XL / Pro Fold
              </h4>
              <div className="ml-7 space-y-2">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium">Google AI Pro 方案 - 12个月免费</p>
                    <ul className="text-muted-foreground text-xs mt-1 space-y-0.5">
                      <li>• 2TB 云端存储空间</li>
                      <li>• Gemini Advanced</li>
                      <li>• Gmail、文档中的 Gemini 功能</li>
                    </ul>
                    <p className="text-green-500 text-xs mt-1">价值约 ¥1,680/年</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pixel 9 / 9a / 10a */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-gray-500" />
                Pixel 9 / 9a / 10a
              </h4>
              <div className="ml-7 space-y-2">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium">Google One 高级版/基本版 - 3-6个月免费</p>
                    <ul className="text-muted-foreground text-xs mt-1 space-y-0.5">
                      <li>• Pixel 9: 2TB 高级版 6个月</li>
                      <li>• Pixel 9a/10a: 100GB 基本版 3个月</li>
                      <li>• Google 相册、云端硬盘、Gmail 共享存储</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 适用地区 */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-500 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>适用地区：</strong>美国、英国、德国、法国、日本、新加坡、台湾、澳大利亚等30+国家/地区。
                  <br />
                  <strong>资格要求：</strong>仅限 Google One 新会员或未订阅 AI Pro 的现有会员。
                </span>
              </p>
            </div>

            {/* 外部链接 */}
            <div className="pt-3 border-t border-border">
              <a
                href="https://support.google.com/pixelphone/answer/13529884?hl=zh-Hans"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>查看 Google 官方优惠页面</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 步骤指示器 */}
      <StepIndicator
        currentStep={step}
        steps={[
          { num: 1, label: "验证卡密" },
          { num: 2, label: "填写账号" },
          { num: 3, label: "查看结果" },
        ]}
        brandColor={BRAND}
      />

      {/* 提示消息 */}
      {message && <AlertMessage type={message.type}>{message.text}</AlertMessage>}

      {/* 步骤 1: 验证卡密 */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">卡密</label>
            <ActivateInput
              placeholder="请输入卡密"
              value={cardKey}
              onChange={(e) => setCardKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyCard()}
            />
          </div>
          <ActivateButton
            onClick={handleVerifyCard}
            disabled={verifying}
            brandColor={BRAND}
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {verifying ? "验证中..." : "验证卡密"}
          </ActivateButton>
        </div>
      )}

      {/* 步骤 2: 填写账号 */}
      {step === 2 && cardInfo && (
        <div className="space-y-4">
          {/* 额度信息 */}
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">剩余额度</span>
              <span className="text-lg font-bold text-violet-500">
                {cardInfo.remaining_quota_units} / {cardInfo.total_quota_units}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              账号列表 <span className="text-xs text-muted-foreground">（每行一个）</span>
            </label>
            <Textarea
              placeholder={`格式：邮箱----密码----辅助邮箱----2FA密钥\n例如：\ntest@gmail.com----password123----backup@gmail.com----ABCD1234`}
              value={accountsText}
              onChange={(e) => setAccountsText(e.target.value)}
              rows={8}
              className="font-mono text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              已填写 {accountsText.split("\n").filter(l => l.trim()).length} 个账号
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              上一步
            </Button>
            <ActivateButton
              onClick={handleSubmitTask}
              disabled={submitting}
              brandColor={BRAND}
              className="flex-1"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? "提交中..." : "提交任务"}
            </ActivateButton>
          </div>
        </div>
      )}

      {/* 步骤 3: 查看结果 */}
      {step === 3 && (
        <div className="space-y-4">
          {/* 任务状态 */}
          {taskResult && (
            <>
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">任务状态</span>
                  <div className="flex items-center gap-2">
                    {polling ? (
                      <span className="flex items-center gap-1.5 text-sm text-blue-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        处理中...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-green-500">
                        <CheckCircle className="w-4 h-4" />
                        已完成
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => taskId && taskToken && pollTaskStatus(taskId, taskToken)}
                      disabled={polling}
                    >
                      <RefreshCw className={`w-4 h-4 ${polling ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  任务ID: {taskResult.task_id}
                </div>
              </div>

              {/* 账号列表 */}
              <div className="space-y-2">
                {taskResult.accounts.map((acc, index) => (
                  <div
                    key={acc.id ?? index}
                    className="p-3 rounded-lg bg-card border border-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(acc.status)}
                          <span className="text-sm font-medium truncate">
                            {acc.email}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            acc.status === "success" ? "bg-green-500/10 text-green-500" :
                            acc.status === "failed" ? "bg-red-500/10 text-red-500" :
                            acc.status === "processing" || acc.status === "running" ? "bg-blue-500/10 text-blue-500" :
                            acc.status === "cancelled" ? "bg-gray-500/10 text-gray-500" :
                            "bg-yellow-500/10 text-yellow-500"
                          }`}>
                            {getStatusText(acc.status)}
                          </span>
                          {acc.status === "pending" && typeof acc.queue_position === "number" && acc.queue_position > 0 && (
                            <span className="text-xs text-muted-foreground">#{acc.queue_position}</span>
                          )}
                        </div>
                        {acc.result_link && (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              readOnly
                              value={acc.result_link}
                              className="flex-1 text-xs bg-secondary/50 border border-border rounded px-2 py-1 font-mono truncate"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(acc.result_link!, index)}
                              className="shrink-0"
                            >
                              {copiedIndex === index ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                        {acc.status === "failed" && acc.message && (
                          <p className="text-xs text-red-500 mt-1">{acc.message}</p>
                        )}
                      </div>
                      {acc.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelAccount(acc.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 剩余额度 */}
          {cardInfo && (
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">剩余额度</span>
                <span className="text-lg font-bold text-violet-500">
                  {cardInfo.remaining_quota_units} / {cardInfo.total_quota_units}
                </span>
              </div>
            </div>
          )}

          {/* 继续提交 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep(2)
                setAccountsText("")
                setTaskId(null)
                setTaskResult(null)
              }}
              className="flex-1"
            >
              继续提交
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep(1)
                setCardKey("")
                setCardInfo(null)
                setAccountsText("")
                setTaskId(null)
                setTaskResult(null)
              }}
              className="flex-1"
            >
              更换卡密
            </Button>
          </div>
        </div>
      )}
    </ActivateLayout>
  )
}
