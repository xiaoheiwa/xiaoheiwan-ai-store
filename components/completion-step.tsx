"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircleIcon, AlertTriangleIcon, FlagIcon, RefreshCwIcon } from "lucide-react"

interface CompletionStepProps {
  data: any
  onReset: () => void
}

export function CompletionStep({ data, onReset }: CompletionStepProps) {
  const isSuccess = data.success || false

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlagIcon className="w-5 h-5" />
          操作完成
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`flex items-center p-4 rounded-lg border ${
            isSuccess ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}
        >
          {isSuccess ? (
            <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
          ) : (
            <AlertTriangleIcon className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
          )}
          <div>
            <h3 className={`font-semibold ${isSuccess ? "text-green-800" : "text-red-800"}`}>
              {isSuccess ? "操作成功！" : "操作失败"}
            </h3>
            <p className={`text-sm ${isSuccess ? "text-green-700" : "text-red-700"}`}>
              {isSuccess ? data.message || "充值已完成" : data.error || "未知错误"}
            </p>
          </div>
        </div>

        <details className="group">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800 text-sm font-medium">
            查看详细结果
          </summary>
          <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-auto mt-2 max-h-64 text-gray-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>

        <Button onClick={onReset} className="w-full">
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          重新开始
        </Button>
      </CardContent>
    </Card>
  )
}
