"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Loader2, Search, Shield, ShieldCheck, Users, Key,
  CheckCircle, XCircle, Clock, Zap,
} from "lucide-react"
import ActivateLayout, { AlertMessage, ActivateInput, ActivateButton } from "@/components/activate-layout"

const BRAND = "#3B82F6"

type TabId = "redeem" | "query" | "verify"
interface LogRecord { email: string; time: string }
interface Stats { percent_used: number; remaining: number }

export default function TeamActivatePage() {
  const [activeTab, setActiveTab] = useState<TabId>("redeem")

  // Redeem
  const [redeemCode, setRedeemCode] = useState("")
  const [redeemEmail, setRedeemEmail] = useState("")
  const [redeemEmailConfirm, setRedeemEmailConfirm] = useState("")
  const [redeeming, setRedeeming] = useState(false)
  const [redeemResult, setRedeemResult] = useState<{ type: "ok" | "err"; html: string } | null>(null)

  // Query
  const [queryCode, setQueryCode] = useState("")
  const [querying, setQuerying] = useState(false)
  const [queryResult, setQueryResult] = useState<{ type: "ok" | "err" | "info"; html: string } | null>(null)

  // Verify
  const [verifyStep, setVerifyStep] = useState<1 | 2>(1)
  const [activationCode, setActivationCode] = useState("")
  const [verifyType, setVerifyType] = useState<"dabi" | "student">("dabi")
  const [verifyInput, setVerifyInput] = useState("")
  const [activating, setActivating] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [activationMsg, setActivationMsg] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null)
  const [verifyMessages, setVerifyMessages] = useState<{ type: "ok" | "err" | "info"; text: string }[]>([])
  const verifyResultRef = useRef<HTMLDivElement>(null)

  // Stats & logs
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentLogs, setRecentLogs] = useState<LogRecord[]>([])

  const loadStats = useCallback(async () => {
    try { const r = await fetch("/api/team-activate?action=stats"); const d = await r.json(); setStats({ percent_used: d.percent_used || 0, remaining: d.remaining || 0 }) } catch {}
  }, [])

  const loadRecentLogs = useCallback(async () => {
    try { const r = await fetch("/api/team-activate?action=recent_success"); const d = await r.json(); if (d.records) setRecentLogs(d.records) } catch {}
  }, [])

  useEffect(() => {
    loadStats(); loadRecentLogs()
    const a = setInterval(loadStats, 45000); const b = setInterval(loadRecentLogs, 30000)
    return () => { clearInterval(a); clearInterval(b) }
  }, [loadStats, loadRecentLogs])

  useEffect(() => { if (verifyResultRef.current) verifyResultRef.current.scrollTop = verifyResultRef.current.scrollHeight }, [verifyMessages])

  function getProgressStyle(s: Stats) {
    if (s.remaining <= 5) return { bg: "bg-destructive", text: "text-destructive", hint: "邀请位即将用尽！请尽快兑换" }
    if (s.remaining <= 15) return { bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", hint: "邀请位不多，建议尽快兑换" }
    if (s.remaining <= 30) return { bg: "", text: "text-blue-600 dark:text-blue-400", hint: "邀请位较少，可正常兑换" }
    return { bg: "bg-accent", text: "text-accent", hint: "邀请位充足，可放心兑换" }
  }

  // ===== REDEEM =====
  async function handleRedeem() {
    if (!redeemCode.trim()) { setRedeemResult({ type: "err", html: "请输入卡密" }); return }
    if (!redeemEmail.includes("@")) { setRedeemResult({ type: "err", html: "邮箱格式不正确" }); return }
    if (redeemEmail.toLowerCase() !== redeemEmailConfirm.toLowerCase()) { setRedeemResult({ type: "err", html: "两次输入的邮箱不一致，请重新确认" }); return }
    setRedeeming(true); setRedeemResult(null)
    try {
      const resp = await fetch("/api/team-activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "redeem", code: redeemCode, email: redeemEmail, email_confirm: redeemEmailConfirm }) })
      const data = await resp.json()
      if (data.ok) {
        setRedeemResult({ type: "ok", html: `兑换成功！\n邮箱：${redeemEmail}\n使用账户：${data.account_name || "未知"}\n状态：已自动邀请进 TEAM\n\n请检查邮箱（包括垃圾邮件），等待 OpenAI 邀请链接。\n兑换 ID: ${data.redemption_id || ""}` })
        setRedeemCode(""); setRedeemEmail(""); setRedeemEmailConfirm(""); setQueryCode(redeemCode); loadRecentLogs()
      } else { setRedeemResult({ type: "err", html: data.error || data.message || "兑换失败" }) }
    } catch (e: unknown) { setRedeemResult({ type: "err", html: `网络错误：${e instanceof Error ? e.message : "请刷新重试"}` }) }
    setRedeeming(false)
  }

  // ===== QUERY =====
  async function handleQuery() {
    if (!queryCode.trim()) { setQueryResult({ type: "err", html: "请输入卡密" }); return }
    setQuerying(true); setQueryResult(null)
    try {
      const resp = await fetch("/api/team-activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "query", code: queryCode }) })
      const data = await resp.json()
      if (data.found) {
        let statusText = ""; let type: "ok" | "err" | "info" = "info"
        if (data.invite_status === "success") { statusText = "已成功邀请进 TEAM"; type = "ok" }
        else if (data.invite_status === "failed") { statusText = "邀请失败"; type = "err" }
        else if (data.used === false) { statusText = "卡密有效，尚未兑换"; type = "info" }
        else { statusText = "处理中..."; type = "info" }
        setQueryResult({ type, html: `卡密：${data.code}\n邮箱：${data.email || "未兑换"}\n兑换时间：${data.used_at ? new Date(data.used_at).toLocaleString("zh-CN") : "未兑换"}\n状态：${statusText}${data.account_name ? `\n使用账户：${data.account_name}` : ""}${data.redemption_id ? `\n记录 ID: ${data.redemption_id}` : ""}` })
      } else { setQueryResult({ type: "err", html: "未找到该卡密的兑换记录\n可能原因：卡密无效、尚未兑换、输入错误" }) }
    } catch (e: unknown) { setQueryResult({ type: "err", html: `查询失败：${e instanceof Error ? e.message : "请重试"}` }) }
    setQuerying(false)
  }

  // ===== VERIFY STEP 1 =====
  async function handleActivation() {
    if (!activationCode.trim()) { setActivationMsg({ type: "err", text: "激活码不能为空" }); return }
    setActivating(true); setActivationMsg({ type: "info", text: "校验激活码中..." })
    try {
      const resp = await fetch("/api/team-activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_create", activation_code: activationCode, url_or_id: "dummy" }) })
      const data = await resp.json()
      if (data.ok) { setVerifyStep(2); setActivationMsg(null); setVerifyMessages([{ type: "ok", text: "激活码验证成功！现在可以输入链接进行认证（失败不消耗激活码）" }]) }
      else { setActivationMsg({ type: "err", text: data.error || "激活码无效" }) }
    } catch { setActivationMsg({ type: "err", text: "网络错误，请重试" }) }
    setActivating(false)
  }

  // ===== VERIFY STEP 2 =====
  async function handleVerify() {
    const rawInput = verifyInput.trim()
    if (!rawInput) { setVerifyMessages((p) => [...p, { type: "err", text: "请输入 Verification ID 或链接" }]); return }
    let cleaned = rawInput
    if (cleaned.toLowerCase().startsWith("bearer ")) cleaned = cleaned.substring(7).trim()
    else if (cleaned.toLowerCase().startsWith("bearer")) cleaned = cleaned.substring(6).trim()
    let verificationId = cleaned
    const idMatch = cleaned.match(/verificationId=([a-f0-9]{24})/i)
    if (idMatch) verificationId = idMatch[1]
    setVerifying(true)

    if (verifyType === "student") {
      if (!/^[a-f0-9]{24}$/i.test(verificationId)) { setVerifyMessages((p) => [...p, { type: "err", text: "无效的 Verification ID" }]); setVerifying(false); return }
      const qs = new URLSearchParams({ activation_code: activationCode, verificationId }).toString()
      const source = new EventSource(`/api/team-activate?action=student_verify_stream&${qs}`)
      let pollInterval: ReturnType<typeof setInterval> | null = null
      const terminateAll = () => { setVerifying(false); source.close(); if (pollInterval) clearInterval(pollInterval) }
      const startStatusPolling = (token: string) => { source.close(); pollInterval = setInterval(async () => { try { const r = await fetch("/api/team-activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "proxy_check_status", checkToken: token, activation_code: activationCode }) }); processData(await r.json(), true) } catch {} }, 5000) }
      const processData = (data: Record<string, unknown>, _fromPolling = false) => {
        if (!data) return
        const msg = (data.message || data.error || "处理中...") as string
        let type: "ok" | "err" | "info" = "info"
        if (data.currentStep === "success" || data.success === true) { type = "ok"; terminateAll() }
        else if (data.currentStep === "error" || data.error) { type = "err"; terminateAll() }
        setVerifyMessages((p) => [...p, { type, text: msg }])
        if (data.checkToken && !pollInterval) startStatusPolling(data.checkToken as string)
      }
      source.onmessage = (e) => { try { const raw = e.data.trim(); processData(JSON.parse(raw.startsWith("data:") ? raw.substring(5) : raw)) } catch {} }
      for (const evt of ["start", "progress", "result", "end"]) { source.addEventListener(evt, (e) => { try { processData(JSON.parse((e as MessageEvent).data)) } catch { processData({ message: (e as MessageEvent).data }) } }) }
      source.onerror = () => { if (source.readyState === EventSource.CLOSED) return; if (!pollInterval) { setVerifyMessages((p) => [...p, { type: "err", text: "连接异常，请检查网络" }]); terminateAll() } }
    } else {
      try {
        const createResp = await fetch("/api/team-activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_create", activation_code: activationCode, url_or_id: cleaned }) })
        const createData = await createResp.json()
        if (!createData.ok) throw new Error(createData.error || "创建任务失败")
        const taskId = createData.task_id
        setVerifyMessages((p) => [...p, { type: "info", text: `任务已提交（ID: ${taskId}），正在认证中...` }])
        let completed = false
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 3000))
          const statusResp = await fetch("/api/team-activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_status", task_id: taskId, activation_code: activationCode }) })
          const statusData = await statusResp.json()
          if (statusData.status === "completed" || statusData.status === "failed") {
            completed = true
            if (statusData.fraud_detected) { setVerifyMessages((p) => [...p, { type: "err", text: "认证被拒绝：当前 IP 被风控系统拒绝。请更换 IP（推荐住宅代理或手机热点），然后重新获取 Verification ID。激活码未消耗。" }]) }
            else { const res = statusData.result || {}; if (res.success) { setVerifyMessages((p) => [...p, { type: "ok", text: `认证成功！激活码已正常消耗。任务 ID: ${taskId}` }]) } else { const failMsg = res.message || res.error || "未知错误"; const extra = (failMsg.includes("quota not deducted") || failMsg.includes("Verification failed")) ? "系统已自动取消该认证任务，请重新获取新的 Verification ID 或完整注册链接后再次尝试。" : "激活码未消耗，可继续使用当前激活码重试。"; setVerifyMessages((p) => [...p, { type: "err", text: `认证失败：${failMsg}\n${extra}` }]) } }
            break
          } else { setVerifyMessages((p) => { const f = p.filter((m) => !m.text.startsWith("认证中...")); return [...f, { type: "info", text: `认证中... (${statusData.status || "processing"})` }] }) }
        }
        if (!completed) { setVerifyMessages((p) => [...p, { type: "err", text: "认证超时，请刷新页面重试" }]) }
      } catch (e: unknown) { setVerifyMessages((p) => [...p, { type: "err", text: `错误：${e instanceof Error ? e.message : "未知错误"}` }]) }
      setVerifying(false)
    }
  }

  function resetVerify() { setVerifyStep(1); setActivationCode(""); setVerifyInput(""); setActivationMsg(null); setVerifyMessages([]) }
  function maskEmail(email: string) { const [local, domain] = email.split("@"); if (!domain) return email; return `${local[0]}${"*".repeat(Math.min(local.length - 1, 4))}@${domain}` }

  const tabItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "redeem", label: "兑换卡密", icon: <Key className="w-4 h-4" /> },
    { id: "query", label: "查询记录", icon: <Search className="w-4 h-4" /> },
    { id: "verify", label: "大兵验证", icon: <ShieldCheck className="w-4 h-4" /> },
  ]

  const msgStyles = {
    ok: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    err: "bg-destructive/10 border-destructive/20 text-destructive",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
  }
  const msgIcons = {
    ok: <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
    err: <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />,
    info: <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
  }

  return (
    <ActivateLayout
      brandColor={BRAND}
      icon={<Users className="w-7 h-7" style={{ color: BRAND }} />}
      title="GPT Team 自动邀请"
      subtitle="安全稳定的 GPT Team 自动邀请系统"
      features={[
        { icon: <Shield className="w-5 h-5" style={{ color: BRAND }} />, label: "安全稳定" },
        { icon: <Zap className="w-5 h-5" style={{ color: BRAND }} />, label: "自动邀请" },
        { icon: <Users className="w-5 h-5" style={{ color: BRAND }} />, label: "即时到账" },
      ]}
    >
      {/* Progress Bar */}
      {stats && (
        <div className="bg-secondary border border-border rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-muted-foreground text-center mb-2.5">邀请位使用情况</p>
          <div className="bg-border/50 rounded-full h-5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-center text-[10px] font-bold text-white ${getProgressStyle(stats).bg}`}
              style={{ width: `${Math.max(stats.percent_used, 2)}%`, ...(!getProgressStyle(stats).bg ? { backgroundColor: BRAND } : {}) }}
            >
              {stats.percent_used > 15 && `${stats.percent_used}%`}
            </div>
          </div>
          <p className={`text-center text-xs mt-2 font-medium ${getProgressStyle(stats).text}`}>{getProgressStyle(stats).hint}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-secondary rounded-xl p-1 flex mb-6">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setRedeemResult(null); setQueryResult(null) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== REDEEM TAB ===== */}
      {activeTab === "redeem" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">卡密</label>
            <ActivateInput type="text" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} placeholder="请输入卡密" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">邮箱地址</label>
            <ActivateInput type="email" value={redeemEmail} onChange={(e) => setRedeemEmail(e.target.value)} placeholder="请输入邮箱地址" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">确认邮箱</label>
            <ActivateInput type="email" value={redeemEmailConfirm} onChange={(e) => setRedeemEmailConfirm(e.target.value)} placeholder="请再次输入邮箱地址" />
          </div>
          <ActivateButton brandColor={BRAND} onClick={handleRedeem} disabled={redeeming}>
            {redeeming ? <><Loader2 className="w-4 h-4 animate-spin" />{"兑换中..."}</> : "立即兑换"}
          </ActivateButton>

          {redeemResult && (
            <div className={`p-4 rounded-xl border text-sm leading-relaxed ${msgStyles[redeemResult.type]}`}>
              <div className="flex gap-2">{msgIcons[redeemResult.type]}<pre className="whitespace-pre-wrap font-sans flex-1">{redeemResult.html}</pre></div>
            </div>
          )}

          {/* Recent logs */}
          {recentLogs.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden mt-2">
              <div className="px-4 py-2.5 border-b border-border text-center"><p className="text-xs font-semibold text-muted-foreground">近期兑换成功</p></div>
              <div className="h-[200px] overflow-hidden relative">
                <div className="animate-scroll-up absolute w-full">
                  {[...recentLogs, ...recentLogs].map((log, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2 border-b border-dashed border-border last:border-0">
                      <span className="text-xs font-medium truncate max-w-[60%]" style={{ color: BRAND }}>{maskEmail(log.email)}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-3">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== QUERY TAB ===== */}
      {activeTab === "query" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">卡密查询</label>
            <ActivateInput type="text" value={queryCode} onChange={(e) => setQueryCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleQuery() }} placeholder="输入卡密查询兑换记录" />
          </div>
          <ActivateButton brandColor={BRAND} onClick={handleQuery} disabled={querying}>
            {querying ? <><Loader2 className="w-4 h-4 animate-spin" />{"查询中..."}</> : "查询记录"}
          </ActivateButton>
          {queryResult && (
            <div className={`p-4 rounded-xl border text-sm leading-relaxed ${msgStyles[queryResult.type]}`}>
              <div className="flex gap-2">{msgIcons[queryResult.type]}<pre className="whitespace-pre-wrap font-sans flex-1">{queryResult.html}</pre></div>
            </div>
          )}
        </div>
      )}

      {/* ===== VERIFY TAB ===== */}
      {activeTab === "verify" && (
        <div className="space-y-4">
          {verifyStep === 1 ? (
            <>
              <div className="flex items-center gap-2 mb-1"><Shield className="w-5 h-5" style={{ color: BRAND }} /><h3 className="font-semibold text-foreground">{"步骤 1：解锁认证功能"}</h3></div>
              <p className="text-xs text-muted-foreground">请输入管理员提供的激活码（可用于大兵/学生验证）</p>
              <ActivateInput type="text" value={activationCode} onChange={(e) => { setActivationCode(e.target.value); setActivationMsg(null) }} onKeyDown={(e) => { if (e.key === "Enter") handleActivation() }} placeholder="激活码（如 ACT-XXXXXX）" />
              <ActivateButton brandColor={BRAND} onClick={handleActivation} disabled={activating}>
                {activating ? <><Loader2 className="w-4 h-4 animate-spin" />{"验证中..."}</> : "解锁认证功能"}
              </ActivateButton>
              {activationMsg && (
                <div className={`p-4 rounded-xl border text-sm ${msgStyles[activationMsg.type]}`}>
                  <div className="flex gap-2">{msgIcons[activationMsg.type]}<span>{activationMsg.text}</span></div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-5 h-5" style={{ color: BRAND }} /><h3 className="font-semibold text-foreground">{"步骤 2：选择验证类型并输入链接"}</h3></div>
              <div className="flex gap-3 justify-center">
                {(["dabi", "student"] as const).map((t) => (
                  <button key={t} onClick={() => setVerifyType(t)} className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${verifyType === t ? "border-border bg-card text-foreground shadow-sm" : "border-transparent bg-secondary text-muted-foreground hover:text-foreground"}`} style={verifyType === t ? { borderColor: BRAND, color: BRAND } : undefined}>
                    {t === "dabi" ? "大兵验证" : "学生验证"}
                  </button>
                ))}
              </div>
              <div className="bg-secondary rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed">
                {verifyType === "dabi" ? <>{"支持以下任意一种格式："}<br/>{"Verification ID（24位）"}<br/>{"完整链接（含 verificationId=...）"}<br/>{"JWT accessToken（eyJ... 开头）"}<br/>{"完整 sessionToken JSON"}</> : <>{"请输入 SheerID 学生验证链接或 Verification ID"}<br/>{"示例：https://services.sheerid.com/verify/.../?verificationId=..."}<br/>{"或直接输入 24 位 verificationId"}</>}
              </div>
              <ActivateInput type="text" value={verifyInput} onChange={(e) => setVerifyInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleVerify() }} placeholder="Verification ID 或完整链接" />
              <ActivateButton brandColor={BRAND} onClick={handleVerify} disabled={verifying}>
                {verifying ? <><Loader2 className="w-4 h-4 animate-spin" />{"认证中..."}</> : "开始验证"}
              </ActivateButton>
              {verifyMessages.length > 0 && (
                <div ref={verifyResultRef} className="max-h-64 overflow-y-auto space-y-2">
                  {verifyMessages.map((msg, i) => (
                    <div key={i} className={`p-3 rounded-xl border text-sm ${msgStyles[msg.type]}`}>
                      <div className="flex gap-2">{msgIcons[msg.type]}<pre className="whitespace-pre-wrap font-sans flex-1 text-xs">{msg.text}</pre></div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={resetVerify} className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors">{"重新输入激活码（换一个）"}</button>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes scroll-up { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        .animate-scroll-up { animation: scroll-up 25s linear infinite; }
        .animate-scroll-up:hover { animation-play-state: paused; }
      `}</style>
    </ActivateLayout>
  )
}
