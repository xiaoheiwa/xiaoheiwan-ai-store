"use client"

import { useState, useEffect } from "react"
import { X, Bell } from "lucide-react"

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
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    fetchNotification()
    const interval = setInterval(fetchNotification, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotification = async () => {
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      
      if (data.success && data.notification) {
        const newNotification = data.notification
        const dismissedId = localStorage.getItem("dismissed_notification_id")
        const dismissedTime = localStorage.getItem("dismissed_notification_time")
        
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
    <div 
      className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-right-5 fade-in duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative bg-card border border-border rounded-xl shadow-lg overflow-hidden backdrop-blur-sm">
        {/* 顶部装饰条 */}
        <div className="h-1 bg-gradient-to-r from-accent via-accent/80 to-accent/60" />
        
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* 图标 */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-accent" />
              </div>
            </div>
            
            {/* 内容 */}
            <div className="flex-1 min-w-0 pr-6">
              <h4 className="text-sm font-semibold text-foreground">
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {notification.content}
              </p>
            </div>
            
            {/* 关闭按钮 */}
            <button
              onClick={handleDismiss}
              className={`absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                isHovered 
                  ? "bg-muted text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* 底部微妙的渐变边框 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </div>
  )
}
