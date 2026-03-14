"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  UserIcon,
  MailIcon,
  InfoIcon,
  CodeIcon,
  RotateCcwIcon,
  EditIcon,
  ExternalLinkIcon,
  DownloadIcon,
} from "lucide-react"

interface UserInfoStepProps {
  verificationData: any
  onSuccess: (data: any) => void
  onError: (message: string) => void
}

export function UserInfoStep({ verificationData, onSuccess, onError }: UserInfoStepProps) {
  const [jsonToken, setJsonToken] = useState("")
  const [updateToken, setUpdateToken] = useState("")
  const [showUpdateSection, setShowUpdateSection] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGptLoggedIn, setIsGptLoggedIn] = useState(false)

  const isNewUser = verificationData.is_new
  const email = verificationData.email || "（无邮箱）"
  const status = verificationData.status || "未知"

  const handleGptLogin = () => {
    window.open("https://chat.openai.com/", "_blank")
    setIsGptLoggedIn(true)
  }

  const handleGetJsonToken = () => {
    window.open("https://chatgpt.com/api/auth/session", "_blank")
  }

  const handleSubmitJson = async () => {
    if (!jsonToken.trim()) {
      onError("请输入JSON Token")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/submit-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json_token: jsonToken,
          session: verificationData.session,
        }),
      })

      const data = await response.json()
      if (data.success) {
        onSuccess(data)
      } else {
        onError(data.error || "充值失败")
      }
    } catch (error) {
      onError("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReuseRecord = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/reuse-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: verificationData.session,
        }),
      })

      const data = await response.json()
      if (data.success) {
        onSuccess(data)
      } else {
        onError(data.error || "复用记录失败")
      }
    } catch (error) {
      onError("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateToken = async () => {
    if (!updateToken.trim()) {
      onError("请输入JSON Token")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/update-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json_token: updateToken,
          session: verificationData.session,
          activation_code: verificationData.activation_code,
        }),
      })

      const data = await response.json()
      if (data.success) {
        onSuccess(data)
      } else {
        onError(data.error || "更新Token失败")
      }
    } catch (error) {
      onError("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="w-5 h-5" />
          用户信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MailIcon className="w-4 h-4 text-gray-500" />
            <span className="text-gray-800">{email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <InfoIcon className="w-4 h-4 text-gray-500" />
            <span className="text-gray-800">状态：{status}</span>
          </div>
        </div>

        {isNewUser ? (
          <div className="space-y-4">
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">获取 ChatGPT Token 步骤：</h3>

              <Button
                onClick={handleGptLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                variant="default"
              >
                <ExternalLinkIcon className="w-4 h-4 mr-2" />
                1. 登录 ChatGPT
              </Button>

              <Button
                onClick={handleGetJsonToken}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                variant="default"
                disabled={!isGptLoggedIn}
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                2. 获取 JSON Token
              </Button>

              <p className="text-xs text-blue-700">
                请先点击"登录 ChatGPT"按钮，登录成功后再点击"获取 JSON Token"按钮查看详细步骤
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <CodeIcon className="w-4 h-4" />
                ChatGPT JSON Token
              </label>
              <Textarea
                rows={8}
                placeholder="粘贴从ChatGPT获取的JSON（含access_token等）"
                value={jsonToken}
                onChange={(e) => setJsonToken(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={handleSubmitJson} className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? "充值中..." : "开始充值"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm">
                <UserIcon className="w-4 h-4 mr-2" />
                检测到已使用的激活码
              </div>
            </div>

            <Button
              onClick={handleReuseRecord}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              disabled={isLoading}
            >
              <RotateCcwIcon className="w-4 h-4 mr-2" />
              {isLoading ? "处理中..." : "复用充值记录"}
            </Button>

            <div className="text-center">
              <span className="text-gray-500 text-sm">或者</span>
            </div>

            {showUpdateSection ? (
              <div className="space-y-4">
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">更新 Token 步骤：</h3>

                  <Button
                    onClick={handleGptLogin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    variant="default"
                  >
                    <ExternalLinkIcon className="w-4 h-4 mr-2" />
                    1. 登录 ChatGPT
                  </Button>

                  <Button
                    onClick={handleGetJsonToken}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    variant="default"
                    disabled={!isGptLoggedIn}
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    2. 获取 JSON Token
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <CodeIcon className="w-4 h-4" />
                    更新 ChatGPT JSON Token
                  </label>
                  <Textarea
                    rows={8}
                    placeholder="粘贴新的ChatGPT JSON Token"
                    value={updateToken}
                    onChange={(e) => setUpdateToken(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateToken}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "更新中..." : "更新Token"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowUpdateSection(false)
                      setUpdateToken("")
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowUpdateSection(true)} variant="outline" className="w-full">
                <EditIcon className="w-4 h-4 mr-2" />
                更新Token
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
