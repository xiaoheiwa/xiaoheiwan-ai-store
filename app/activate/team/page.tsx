"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Loader2, Search, Shield, Users, Key,
  CheckCircle, XCircle, Clock, Zap,
} from "lucide-react"
import ActivateLayout, { AlertMessage, ActivateInput, ActivateButton } from "@/components/activate-layout"

const BRAND = "#3B82F6"

type TabId = "redeem" | "query"
interface LogRecord { email: string; time: string }
interface Stats { percent_used: number; remaining: number }
interface SurvivalDay { date: string; rate: number; active: number; banned: number }

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

  // Stats & logs & survival
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentLogs, setRecentLogs] = useState<LogRecord[]>([])
  const [survivalData, setSurvivalData] = useState<SurvivalDay[]>([])

  const loadStats = useCallback(async () => {
    try { const r = await fetch("/api/team-activate?action=stats"); const d = await r.json(); setStats({ percent_used: d.percent_used || 0, remaining: d.remaining || 0 }) } catch {}
  }, [])

  const loadRecentLogs = useCallback(async () => {
    try { const r = await fetch("/api/team-activate?action=recent_success"); const d = await r.json(); if (d.records) setRecentLogs(d.records) } catch {}
  }, [])

  const loadSurvivalStats = useCallback(async () => {
    try { const r = await fetch("/api/team-activate?action=survival_stats"); const d = await r.json(); if (Array.isArray(d)) setSurvivalData(d) } catch {}
  }, [])

  useEffect(() => {
    loadStats(); loadRecentLogs(); loadSurvivalStats()
    const a = setInterval(loadStats, 45000); const b = setInterval(loadRecentLogs, 30000)
    return () => { clearInterval(a); clearInterval(b) }
  }, [loadStats, loadRecentLogs, loadSurvivalStats])

  function getProgressStyle(s: Stats) {
    if (s.remaining <= 5) return { bg: "bg-destructive", text: "text-destructive", hint: "邀请位即将用尽！请尽快兑换" }
    if (s.remaining <= 15) return { bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", hint: "邀请位不多，建议尽快兑换" }
    if (s.remaining <= 30) return { bg: "", text: "text-blue-600 dark:text-blue-400", hint: "邀请位较少，可正常兑换" }
    return { bg: "bg-accent", text: "text-accent", hint: "邀请位充足，可放心兑换" }
  }

  function getSurvivalLevel(rate: number) {
    if (rate >= 90) return "bg-emerald-500"
    if (rate >= 70) return "bg-amber-500"
    return "bg-destructive"
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

  function maskEmail(email: string) { const [local, domain] = email.split("@"); if (!domain) return email; return `${local[0]}${"*".repeat(Math.min(local.length - 1, 4))}@${domain}` }

  const tabItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "redeem", label: "兑换卡密", icon: <Key className="w-4 h-4" /> },
    { id: "query", label: "查询记录", icon: <Search className="w-4 h-4" /> },
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

      {/* Survival Health Grid */}
      {survivalData.length > 0 && (
        <div className="bg-secondary border border-border rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-muted-foreground text-center mb-3">近 7 日账户存活健康度</p>
          <div className="flex justify-center gap-2">
            {survivalData.map((day, i) => (
              <div key={i} className="group relative">
                <div
                  className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white text-[10px] font-medium cursor-pointer ${getSurvivalLevel(day.rate)}`}
                >
                  {day.date}
                </div>
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-foreground text-background text-[11px] px-2 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  存活率: {day.rate}%<br />
                  存活: {day.active} | 封号: {day.banned}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"></span> 90%+</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500"></span> 70-90%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive"></span> &lt;70%</span>
          </div>
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

      <style jsx>{`
        @keyframes scroll-up { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        .animate-scroll-up { animation: scroll-up 25s linear infinite; }
        .animate-scroll-up:hover { animation-play-state: paused; }
      `}</style>
    </ActivateLayout>
  )
}
