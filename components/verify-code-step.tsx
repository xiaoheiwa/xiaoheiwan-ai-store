"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyIcon, Sparkles } from "lucide-react"

interface VerifyCodeStepProps {
  onSuccess: (data: any) => void
  onError: (message: string) => void
}

export function VerifyCodeStep({ onSuccess, onError }: VerifyCodeStepProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code.trim()) {
      onError("请输入激活码")
      return
    }

    // Only check for basic requirements: not empty and reasonable length
    if (code.trim().length < 3 || code.trim().length > 50) {
      onError("激活码长度不正确")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activation_code: code }),
      })

      const data = await response.json()

      if (!data.success) {
        onError(data.error || "验证失败")
        return
      }

      onSuccess(data)
    } catch (error) {
      onError("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          第一步
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground text-balance">验证您的激活码</h2>
        <p className="text-sm sm:text-base text-muted-foreground text-pretty">请输入您购买的 ChatGPT Plus 激活码</p>
      </div>

      <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/95 hover:shadow-xl transition-all duration-300">
        <CardHeader className="text-center pb-3 sm:pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-base sm:text-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
              <KeyIcon className="w-4 h-4 text-primary" />
            </div>
            激活码验证
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">激活码</label>
              <Input
                type="text"
                placeholder="请输入激活码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-center text-base sm:text-lg h-12 sm:h-14 bg-input border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:border-primary/50"
                required
              />
              <p className="text-xs text-muted-foreground text-center">支持各种格式的激活码</p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 sm:h-14 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  验证中...
                </div>
              ) : (
                "开始验证"
              )}
            </Button>
          </form>

          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2 backdrop-blur-sm">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              温馨提示：
            </h4>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 leading-relaxed">
              <li>• 激活码支持多种格式，请按实际格式输入</li>
              <li>• 每个激活码只能使用一次</li>
              <li>• 如遇问题请联系客服支持</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
