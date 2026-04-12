"use client"

import { useState } from "react"
import { ArrowLeft, Upload, Search, CheckCircle, XCircle, AlertTriangle, HelpCircle, Copy, Check, Trash2, Download } from "lucide-react"
import Link from "next/link"

type GmailStatus = "valid" | "invalid" | "risky" | "unknown"

interface CheckResult {
  email: string
  status: GmailStatus
  message: string
}

interface Stats {
  total: number
  valid: number
  invalid: number
  risky: number
  unknown: number
}

const STATUS_CONFIG = {
  valid: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "正常" },
  invalid: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "无效" },
  risky: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", label: "风险" },
  unknown: { icon: HelpCircle, color: "text-gray-400", bg: "bg-gray-500/10", label: "未知" },
}

export default function GmailCheckerPage() {
  const [input, setInput] = useState("")
  const [results, setResults] = useState<CheckResult[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState<GmailStatus | "all">("all")

  const handleCheck = async () => {
    const emails = input
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => e.length > 0)

    if (emails.length === 0) return

    setLoading(true)
    setResults([])
    setStats(null)

    try {
      const response = await fetch("/api/tools/check-gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      })

      const data = await response.json()
      if (data.results) {
        setResults(data.results)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyFiltered = async (status: GmailStatus) => {
    const filtered = results.filter(r => r.status === status).map(r => r.email).join("\n")
    await navigator.clipboard.writeText(filtered)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportResults = () => {
    const csv = [
      "邮箱,状态,说明",
      ...results.map(r => `${r.email},${STATUS_CONFIG[r.status].label},${r.message}`)
    ].join("\n")
    
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gmail-check-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredResults = filter === "all" ? results : results.filter(r => r.status === filter)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Gmail 状态检测</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Input */}
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入 Gmail 邮箱列表，每行一个或用逗号分隔（单次最多50个）..."
            className="w-full h-40 p-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleCheck}
              disabled={loading || !input.trim()}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>检测中...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>开始检测</span>
                </>
              )}
            </button>
            <button
              onClick={() => { setInput(""); setResults([]); setStats(null) }}
              className="px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: "total", label: "总计", value: stats.total, color: "text-foreground" },
              { key: "valid", label: "正常", value: stats.valid, color: "text-emerald-500" },
              { key: "invalid", label: "无效", value: stats.invalid, color: "text-red-500" },
              { key: "risky", label: "风险", value: stats.risky, color: "text-amber-500" },
              { key: "unknown", label: "未知", value: stats.unknown, color: "text-gray-400" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key === "total" ? "all" : item.key as GmailStatus)}
                className={`p-3 rounded-xl border transition-all ${
                  (filter === "all" && item.key === "total") || filter === item.key
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        {results.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => copyFiltered("valid")}
              className="px-3 py-1.5 rounded-lg text-sm border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              复制正常
            </button>
            <button
              onClick={() => copyFiltered("invalid")}
              className="px-3 py-1.5 rounded-lg text-sm border border-red-500/30 text-red-500 hover:bg-red-500/10 flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              复制无效
            </button>
            <button
              onClick={exportResults}
              className="px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              导出 CSV
            </button>
          </div>
        )}

        {/* Results */}
        {filteredResults.length > 0 && (
          <div className="space-y-2">
            {filteredResults.map((result, index) => {
              const config = STATUS_CONFIG[result.status]
              const Icon = config.icon
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-xl border border-border ${config.bg}`}
                >
                  <Icon className={`w-5 h-5 ${config.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm truncate">{result.email}</div>
                    <div className="text-xs text-muted-foreground">{result.message}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>输入 Gmail 邮箱列表开始检测</p>
            <p className="text-sm mt-1">支持批量检测，每行一个邮箱</p>
          </div>
        )}

        {/* Tips */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground space-y-1">
          <p><strong>状态说明：</strong></p>
          <p>• <span className="text-emerald-500">正常</span> - 邮箱格式正确，符合 Gmail 规则</p>
          <p>• <span className="text-red-500">无效</span> - 格式错误或不符合 Gmail 规则</p>
          <p>• <span className="text-amber-500">风险</span> - 可能存在风险（用户名过短/过长/纯数字）</p>
          <p>• <span className="text-gray-400">未知</span> - 无法判断状态</p>
        </div>
      </div>
    </div>
  )
}
