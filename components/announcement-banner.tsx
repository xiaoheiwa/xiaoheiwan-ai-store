"use client"

import { useState, useEffect } from "react"
import { X, Megaphone } from "lucide-react"

interface Notification {
  id: number
  title: string
  content: string
}

export default function AnnouncementBanner() {
  const [notification, setNotification] = useState<Notification | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 检查本地存储是否已关闭此通知
    const dismissedId = localStorage.getItem("dismissed_notification_id")
    
    const fetchNotification = async () => {
      try {
        const res = await fetch("/api/notifications")
        if (res.ok) {
          const data = await res.json()
          if (data.notification) {
            // 如果是新通知或没有关闭过，则显示
            if (dismissedId !== String(data.notification.id)) {
              setNotification(data.notification)
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch notification:", error)
      }
    }

    fetchNotification()
  }, [])

  const handleDismiss = () => {
    if (notification) {
      localStorage.setItem("dismissed_notification_id", String(notification.id))
    }
    setDismissed(true)
  }

  if (!notification || dismissed) return null

  return (
    <div className="relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
      
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-center gap-3">
          {/* 图标 */}
          <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-accent/15">
            <Megaphone className="w-3.5 h-3.5 text-accent" />
          </div>
          
          {/* 内容 */}
          <div className="flex items-center gap-2 text-sm">
            {notification.title && (
              <span className="font-medium text-foreground">{notification.title}</span>
            )}
            {notification.title && notification.content && (
              <span className="text-muted-foreground/50">|</span>
            )}
            <span className="text-muted-foreground">{notification.content}</span>
          </div>
          
          {/* 关闭按钮 */}
          <button
            onClick={handleDismiss}
            className="shrink-0 ml-2 p-1 rounded-full hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="关闭通知"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
