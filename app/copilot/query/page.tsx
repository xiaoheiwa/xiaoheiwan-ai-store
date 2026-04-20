"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Loader2, Github, Check, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface QueryResult {
  success: boolean
  message?: string
  data?: {
    code?: string
    status?: string
    created_at?: string
    used_at?: string
    github_username?: string
    recharge_status?: string
    product_type?: string
  }
}

export default function CopilotQueryPage() {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)

  const handleQuery = async () => {
    if (!code.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/copilot/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-code", card_code: code.toUpperCase() }),
      })
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setResult({ success: false, message: "网络错误，请重试" })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === "unused" || status === "未使用") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#3fb950]/10 text-[#3fb950] text-xs font-medium">
          <Check className="w-3 h-3" />
          {"未使用"}
        </span>
      )
    }
    if (status === "used" || status === "已使用" || status === "已充值") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#58a6ff]/10 text-[#58a6ff] text-xs font-medium">
          <Check className="w-3 h-3" />
          {"已充值"}
        </span>
      )
    }
    if (status === "pending" || status === "处理中") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#e3b341]/10 text-[#e3b341] text-xs font-medium">
          <Clock className="w-3 h-3" />
          {"处理中"}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#6e7681]/10 text-[#6e7681] text-xs font-medium">
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#010409]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#30363d] bg-[#0d1117]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/copilot">
              <Button variant="ghost" size="sm" className="gap-2 text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]">
                <ArrowLeft className="w-4 h-4" />
                {"返回充值"}
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e6edf3] flex items-center justify-center">
                <Github className="w-5 h-5 text-[#0d1117]" />
              </div>
              <span className="font-semibold text-[#e6edf3]">{"卡密查询"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#e6edf3] mb-2">{"卡密查询"}</h1>
          <p className="text-[#7d8590] text-sm">{"输入卡密查询使用状态和充值记录"}</p>
        </div>

        <Card className="bg-[#0d1117] border-[#30363d]">
          <CardHeader>
            <CardTitle className="text-[#e6edf3] flex items-center gap-2">
              <Search className="w-5 h-5" />
              {"查询卡密"}
            </CardTitle>
            <CardDescription className="text-[#7d8590]">
              {"输入您的激活码查询状态"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                placeholder="请输入卡密"
                className="flex-1 font-mono tracking-wider bg-[#010409] border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] focus:border-[#58a6ff]"
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              />
              <Button
                onClick={handleQuery}
                disabled={isLoading || !code.trim()}
                className="bg-[#238636] hover:bg-[#2ea043] text-white px-6"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "查询"}
              </Button>
            </div>

            {result && (
              <div className="mt-4">
                {result.success && result.data ? (
                  <div className="p-4 rounded-lg bg-[#010409] border border-[#30363d] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6e7681] uppercase tracking-wider">{"卡密状态"}</span>
                      {getStatusBadge(result.data.status || result.data.recharge_status || "unknown")}
                    </div>
                    
                    {result.data.github_username && (
                      <div>
                        <span className="text-xs text-[#6e7681] uppercase tracking-wider block mb-1">{"GitHub 用户"}</span>
                        <span className="text-[#e6edf3] font-medium">{result.data.github_username}</span>
                      </div>
                    )}

                    {result.data.product_type && (
                      <div>
                        <span className="text-xs text-[#6e7681] uppercase tracking-wider block mb-1">{"产品类型"}</span>
                        <span className="text-[#bc8cff]">{result.data.product_type}</span>
                      </div>
                    )}

                    {result.data.used_at && (
                      <div>
                        <span className="text-xs text-[#6e7681] uppercase tracking-wider block mb-1">{"充值时间"}</span>
                        <span className="text-[#7d8590] text-sm">{result.data.used_at}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 flex items-center gap-2">
                    <X className="w-4 h-4 text-[#f85149]" />
                    <span className="text-[#f85149] text-sm">{result.message || "卡密不存在或已失效"}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
