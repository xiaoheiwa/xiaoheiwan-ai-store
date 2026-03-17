"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MessageCircle, Send, Loader2, ChevronDown, Clock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  sender: "user" | "admin" | "system"
  content: string
  created_at: string
}

// Business hours configuration (adjust as needed)
const BUSINESS_HOURS = {
  start: 9,  // 9 AM
  end: 24,   // 12 AM (midnight)
  timezone: "Asia/Shanghai"
}

// Check if currently within business hours
function isWithinBusinessHours(): boolean {
  const now = new Date()
  const hour = now.getHours()
  return hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end
}

// Format time for display
function getBusinessHoursText(): string {
  return `${BUSINESS_HOURS.start}:00 - ${BUSINESS_HOURS.end}:00`
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [sessionId, setSessionId] = useState<string>("")
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userTelegram, setUserTelegram] = useState("")
  const [userWechat, setUserWechat] = useState("")
  const [showNamePrompt, setShowNamePrompt] = useState(true)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [waitingForReply, setWaitingForReply] = useState(false)
  const [showEmailReminder, setShowEmailReminder] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastAdminCountRef = useRef(0)
  const lastUserMessageTimeRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Listen for lightbox open/close via body class
  useEffect(() => {
    const checkLightbox = () => {
      setIsLightboxOpen(document.body.classList.contains("lightbox-open"))
    }
    
    // Use MutationObserver to watch for class changes on body
    const observer = new MutationObserver(checkLightbox)
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] })
    
    return () => observer.disconnect()
  }, [])

  // Play notification sound using Web Audio API (more reliable)
  const playNotificationSound = useCallback(() => {
    try {
      // Create audio context on first use
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      
      // Create a simple beep sound
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.value = 800 // Hz
      oscillator.type = "sine"
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
    } catch (e) {
      console.log("[v0] Audio play failed:", e)
    }
  }, [])

  // Generate or get session ID
  useEffect(() => {
    let id = localStorage.getItem("chat_session_id")
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem("chat_session_id", id)
    }
    setSessionId(id)
    
    // Load saved name/email
    const savedName = localStorage.getItem("chat_user_name")
    const savedEmail = localStorage.getItem("chat_user_email")
    if (savedName) {
      setUserName(savedName)
      setShowNamePrompt(false)
    }
    if (savedEmail) setUserEmail(savedEmail)
  }, [])

  // Poll for new messages when chat is open
  useEffect(() => {
    if (isOpen && sessionId) {
      fetchMessages()
      pollIntervalRef.current = setInterval(fetchMessages, 3000)
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [isOpen, sessionId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Check if waiting for reply too long (2 minutes)
  useEffect(() => {
    if (waitingForReply && !showEmailReminder) {
      waitingTimerRef.current = setTimeout(() => {
        // Show email reminder if no admin reply after 2 minutes
        if (!userEmail) {
          setShowEmailReminder(true)
        }
      }, 2 * 60 * 1000) // 2 minutes
    }
    
    return () => {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current)
      }
    }
  }, [waitingForReply, showEmailReminder, userEmail])

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        const newMessages: Message[] = data.messages || []
        
        // Check for new admin messages using ref (not state)
        const newAdminCount = newMessages.filter((m) => m.sender === "admin").length
        
        if (newAdminCount > lastAdminCountRef.current && lastAdminCountRef.current > 0) {
          // New admin message received
          playNotificationSound()
          setWaitingForReply(false)
          setShowEmailReminder(false)
          if (!isOpen) {
            setHasNewMessage(true)
          }
        }
        
        lastAdminCountRef.current = newAdminCount
        setMessages(newMessages)
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    }
  }, [sessionId, isOpen, playNotificationSound])

  const sendMessage = async () => {
    if (!inputValue.trim() || sending) return
    
    // Save user info
    if (userName) localStorage.setItem("chat_user_name", userName)
    if (userEmail) localStorage.setItem("chat_user_email", userEmail)
    
    setSending(true)
    const content = inputValue.trim()
    setInputValue("")
    
    // Optimistically add message
    const tempMessage: Message = {
      id: "temp-" + Date.now(),
      sender: "user",
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMessage])
    
    try {
      setError("")
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          content,
          userName: userName || undefined,
          userEmail: userEmail || undefined,
        }),
      })
      
      if (res.ok) {
        setShowNamePrompt(false)
        fetchMessages()
        
        // Set waiting state and show auto-reply
        setWaitingForReply(true)
        lastUserMessageTimeRef.current = Date.now()
        
        // Add auto-reply message after a short delay
        setTimeout(() => {
          const isOnline = isWithinBusinessHours()
          const autoReply: Message = {
            id: "auto-" + Date.now(),
            sender: "system",
            content: isOnline 
              ? "感谢您的留言，客服正在赶来，请稍候..."
              : `当前为非工作时间（工作时间：${getBusinessHoursText()}），我们会尽快回复您。建议留下邮箱以便及时收到回复通知。`,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, autoReply])
        }, 500)
      } else if (res.status === 429) {
        // Rate limited
        setError("发送过于频繁，请稍后再试")
        // Remove the optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      } else {
        const data = await res.json()
        setError(data.error || "发送失败")
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      }
    } catch (err) {
      console.error("Failed to send message:", err)
      setError("网络错误，请重试")
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startNewChat = () => {
    const newId = crypto.randomUUID()
    localStorage.setItem("chat_session_id", newId)
    setSessionId(newId)
    setMessages([])
  }

  // Hide chat widget when lightbox is open
  if (isLightboxOpen) return null

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => { setIsOpen(true); setHasNewMessage(false) }}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:scale-105 transition-all flex items-center justify-center ${isOpen ? "hidden" : ""}`}
        aria-label="打开客服"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        {hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 sm:w-[380px] h-[70vh] max-h-[500px] sm:h-[520px] sm:max-h-[calc(100vh-100px)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-accent text-accent-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-foreground/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-medium text-sm">{"在线客服"}</h3>
                <p className="text-xs opacity-70">{"通常几分钟内回复"}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 hover:bg-accent-foreground/20 rounded-full transition-colors"
              aria-label="关闭"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-secondary/20">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-accent" />
                </div>
                <p className="font-medium text-sm">{"您好！有什么可以帮您的吗？"}</p>
                <p className="text-xs mt-1 opacity-70">{"发送消息开始对话"}</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : msg.sender === "system" ? "justify-center" : "justify-start"}`}
              >
                {msg.sender === "system" ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-accent text-accent-foreground rounded-br-sm"
                        : "bg-background border border-border text-foreground rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                )}
              </div>
            ))}
            
            {/* Contact reminder when waiting too long */}
            {showEmailReminder && !userEmail && !userTelegram && !userWechat && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">{"客服暂时离开"}</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  {"留下您的邮箱、Telegram 或微信，客服回复后我们会第一时间通知您"}
                </p>
                <div className="space-y-2">
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="邮箱"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <input
                    type="text"
                    value={userTelegram}
                    onChange={(e) => setUserTelegram(e.target.value)}
                    placeholder="Telegram 用户名"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <input
                    type="text"
                    value={userWechat}
                    onChange={(e) => setUserWechat(e.target.value)}
                    placeholder="微信号"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const hasContact = userEmail || userTelegram || userWechat
                      if (hasContact) {
                        if (userEmail) localStorage.setItem("chat_user_email", userEmail)
                        if (userTelegram) localStorage.setItem("chat_user_telegram", userTelegram)
                        if (userWechat) localStorage.setItem("chat_user_wechat", userWechat)
                        setShowEmailReminder(false)
                        // Notify server about contact info
                        const contactInfo = [
                          userEmail && `邮箱: ${userEmail}`,
                          userTelegram && `Telegram: ${userTelegram}`,
                          userWechat && `微信: ${userWechat}`,
                        ].filter(Boolean).join(", ")
                        fetch("/api/chat", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            sessionId,
                            content: `[用户留下联系方式: ${contactInfo}]`,
                            userName,
                            userEmail,
                          }),
                        })
                      }
                    }}
                    disabled={!userEmail && !userTelegram && !userWechat}
                  >
                    {"保存联系方式"}
                  </Button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Name Prompt (first time) */}
          {showNamePrompt && messages.length === 0 && (
            <div className="px-3 sm:px-4 py-3 border-t border-border bg-secondary/50 space-y-2">
              <p className="text-xs text-muted-foreground">{"可选：留下联系方式以便我们更好地为您服务"}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="您的称呼"
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="邮箱 (可选)"
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Input */}
          <div className="p-3 sm:p-3 border-t border-border bg-background" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入消息..."
                  className="w-full px-4 py-3 text-base bg-secondary border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 pr-12"
                  disabled={sending}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || sending}
                size="icon"
                className="rounded-full h-12 w-12 shrink-0 shadow-md"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
            <div className="flex items-center justify-center mt-3">
              <button
                onClick={startNewChat}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-full hover:bg-secondary"
              >
                {"开始新对话"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
