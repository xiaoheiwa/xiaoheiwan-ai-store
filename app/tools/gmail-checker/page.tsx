"use client"

import { useState } from "react"
import { ArrowLeft, Search, CheckCircle, XCircle, AlertTriangle, HelpCircle, Copy, Check, Trash2, Download, Mail, Shield, Server } from "lucide-react"
import Link from "next/link"

type EmailStatus = "valid" | "invalid" | "risky" | "unknown"

interface CheckResult {
  email: string
  status: EmailStatus
  is_reachable: "safe" | "risky" | "invalid" | "unknown"
  message: string
  syntax: {
    is_valid: boolean
    username: string
    domain: string
  }
  mx: {
    accepts_mail: boolean
    records: string[]
  }
  misc: {
    is_disposable: boolean
    is_role_account: boolean
    is_free_provider: boolean
  }
}

interface Stats {
  total: number
  valid: number
  invalid: number
  risky: number
  unknown: number
  mode: "basic" | "smtp"
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
  const [filter, setFilter] = useState<EmailStatus | "all">("all")
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const handleCheck = async () => {
    const emails = input
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => e.length > 0)

    if (emails.length === 0) return

    setLoading(true)
    setResults([])
    setStats(null)
    setExpandedIndex(null)

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

  const copyFiltered = async (status: EmailStatus) => {
    const filtered = results.filter(r => r.status === status).map(r => r.email).join("\n")
    await navigator.clipboard.writeText(filtered)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportResults = () => {
    const csv = [
      "邮箱,状态,可达性,MX有效,一次性邮箱,角色账户,说明",
      ...results.map(r => 
        `${r.email},${STATUS_CONFIG[r.status].label},${r.is_reachable},${r.mx.accepts_mail ? "是" : "否"},${r.misc.is_disposable ? "是" : "否"},${r.misc.is_role_account ? "是" : "否"},"${r.message}"`
      )
    ].join("\n")
    
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `email-check-${new Date().toISOString().slice(0, 10)}.csv`
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
            <div>
              <h1 className="text-lg font-semibold">邮箱状态检测</h1>
              <p className="text-xs text-muted-foreground">支持 Gmail 及其他邮箱验证</p>
            </div>
          </div>
          {stats && (
            <span className={`text-xs px-2 py-1 rounded-full ${stats.mode === "smtp" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
              {stats.mode === "smtp" ? "SMTP 深度验证" : "基础验证"}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Input */}
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入邮箱列表，每行一个或用逗号分隔（单次最多50个）&#10;&#10;示例：&#10;test@gmail.com&#10;hello@example.com"
            className="w-full h-40 p-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 font-mono text-sm"
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
              title="清空"
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
                onClick={() => setFilter(item.key === "total" ? "all" : item.key as EmailStatus)}
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
              const isExpanded = expandedIndex === index
              
              return (
                <div
                  key={index}
                  className={`rounded-xl border border-border overflow-hidden transition-all ${config.bg}`}
                >
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    <Icon className={`w-5 h-5 ${config.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate">{result.email}</div>
                      <div className="text-xs text-muted-foreground">{result.message}</div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </button>
                  
                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t border-border/50 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/50">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">语法:</span>
                          <span className={result.syntax.is_valid ? "text-emerald-500" : "text-red-500"}>
                            {result.syntax.is_valid ? "正确" : "错误"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/50">
                          <Server className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">MX:</span>
                          <span className={result.mx.accepts_mail ? "text-emerald-500" : "text-red-500"}>
                            {result.mx.accepts_mail ? "有效" : "无效"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/50">
                          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">可达:</span>
                          <span className={
                            result.is_reachable === "safe" ? "text-emerald-500" :
                            result.is_reachable === "invalid" ? "text-red-500" :
                            result.is_reachable === "risky" ? "text-amber-500" : "text-gray-400"
                          }>
                            {result.is_reachable === "safe" ? "安全" :
                             result.is_reachable === "invalid" ? "不可达" :
                             result.is_reachable === "risky" ? "风险" : "未知"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {result.misc.is_disposable && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">一次性邮箱</span>
                        )}
                        {result.misc.is_role_account && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">角色账户</span>
                        )}
                        {result.misc.is_free_provider && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">免费邮箱</span>
                        )}
                      </div>
                      
                      {/* MX Records */}
                      {result.mx.records.length > 0 && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">MX 记录: </span>
                          <span className="font-mono text-foreground/70">
                            {result.mx.records.slice(0, 2).join(", ")}
                            {result.mx.records.length > 2 && ` +${result.mx.records.length - 2}`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>输入邮箱列表开始检测</p>
            <p className="text-sm mt-1">支持 Gmail、Outlook、QQ 邮箱等</p>
          </div>
        )}

        {/* Tips */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">检测项目说明：</p>
          <div className="grid sm:grid-cols-2 gap-2 text-xs">
            <div>
              <p><span className="text-emerald-500 font-medium">语法验证</span> - 检查邮箱格式是否正确</p>
              <p><span className="text-emerald-500 font-medium">MX 记录</span> - 验证域名是否有邮件服务器</p>
            </div>
            <div>
              <p><span className="text-amber-500 font-medium">一次性邮箱</span> - 检测临时邮箱提供商</p>
              <p><span className="text-amber-500 font-medium">角色账户</span> - 如 admin@、support@ 等</p>
            </div>
          </div>
          <p className="text-xs border-t border-border pt-2 mt-2">
            提示：Gmail 等大型邮件服务商会阻止 SMTP 验证，无法确认具体邮箱是否存在。
            如需 SMTP 深度验证，请配置 REACHER_API_KEY 环境变量。
          </p>
        </div>
      </div>
    </div>
  )
}
