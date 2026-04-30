"use client"

import { useState, useEffect } from "react"
import { X, Bell, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Notification {
  id: number
  title: string
  content: string
  updated_at: string
}

export default function NotificationBanner() {
  const [notification, setNotification] = useState<Notification | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    fetchNotification()
    // 每30秒轮询一次检查通知更新
    const interval = setInterval(fetchNotification, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotification = async () => {
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      
      if (data.success && data.notification) {
        const newNotification = data.notification
        
        // 检查是否是新通知或已更新的通知
        const dismissedId = localStorage.getItem("dismissed_notification_id")
        const dismissedTime = localStorage.getItem("dismissed_notification_time")
        
        // 如果是新通知或内容已更新，显示它
        if (
          !dismissedId ||
          dismissedId !== String(newNotification.id) ||
          (dismissedTime && new Date(newNotification.updated_at) > new Date(dismissedTime))
        ) {
          setNotification(newNotification)
          setIsVisible(true)
          setIsDismissed(false)
        }
      } else {
        setNotification(null)
        setIsVisible(false)
      }
    } catch (error) {
      console.error("Failed to fetch notification:", error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    if (notification) {
      localStorage.setItem("dismissed_notification_id", String(notification.id))
      localStorage.setItem("dismissed_notification_time", new Date().toISOString())
    }
  }

  if (!notification || !isVisible || isDismissed) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 z-50 max-w-sm animate-in slide-in-from-left-5 fade-in duration-300">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-white truncate">
                  {notification.title}
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/20 flex-shrink-0"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-white/90 mt-1 leading-relaxed">
                {notification.content}
              </p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-white/20">
          <div className="h-full bg-white/40 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
