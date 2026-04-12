"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Plus, Trash2, Copy, Check, Clock } from "lucide-react"
import Link from "next/link"

interface TOTPAccount {
  id: string
  name: string
  secret: string
}

// Base32 解码
function base32Decode(encoded: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  const cleanedInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "")
  for (const char of cleanedInput) {
    const val = alphabet.indexOf(char)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, "0")
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8))
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2)
  }
  return bytes
}

// HMAC-SHA1
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message)
  return new Uint8Array(signature)
}

// 生成 TOTP
async function generateTOTP(secret: string): Promise<string> {
  try {
    const key = base32Decode(secret)
    const time = Math.floor(Date.now() / 1000 / 30)
    const timeBuffer = new Uint8Array(8)
    let t = time
    for (let i = 7; i >= 0; i--) {
      timeBuffer[i] = t & 0xff
      t = Math.floor(t / 256)
    }
    const hmac = await hmacSha1(key, timeBuffer)
    const offset = hmac[hmac.length - 1] & 0x0f
    const code = ((hmac[offset] & 0x7f) << 24 | (hmac[offset + 1] & 0xff) << 16 | (hmac[offset + 2] & 0xff) << 8 | (hmac[offset + 3] & 0xff)) % 1000000
    return code.toString().padStart(6, "0")
  } catch {
    return "------"
  }
}

// 单个验证码卡片
function CodeCard({ account, onDelete }: { account: TOTPAccount; onDelete: () => void }) {
  const [code, setCode] = useState("------")
  const [timeLeft, setTimeLeft] = useState(30)
  const [copied, setCopied] = useState(false)

  const updateCode = useCallback(async () => {
    setCode(await generateTOTP(account.secret))
  }, [account.secret])

  useEffect(() => {
    updateCode()
    const interval = setInterval(() => {
      const remaining = 30 - (Math.floor(Date.now() / 1000) % 30)
      setTimeLeft(remaining)
      if (remaining === 30) updateCode()
    }, 1000)
    return () => clearInterval(interval)
  }, [updateCode])

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
      <button onClick={copyCode} className="flex-1 flex items-center gap-3 group">
        <span className="text-2xl font-mono font-bold tracking-wider text-foreground">{code.slice(0, 3)} {code.slice(3)}</span>
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />}
      </button>
      <span className="text-sm text-muted-foreground truncate max-w-24">{account.name}</span>
      <div className="flex items-center gap-1 text-xs text-muted-foreground w-10">
        <Clock className="w-3 h-3" />
        <span>{timeLeft}s</span>
      </div>
      <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
    </div>
  )
}

export default function TwoFactorAuthPage() {
  const [accounts, setAccounts] = useState<TOTPAccount[]>([])
  const [input, setInput] = useState("")
  const [name, setName] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("totp_accounts")
    if (saved) try { setAccounts(JSON.parse(saved)) } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem("totp_accounts", JSON.stringify(accounts))
  }, [accounts])

  const addAccount = async () => {
    let secret = input.trim().toUpperCase().replace(/\s/g, "")
    let accountName = name.trim()
    
    // 解析 otpauth:// URI
    if (input.startsWith("otpauth://")) {
      try {
        const url = new URL(input)
        secret = url.searchParams.get("secret")?.toUpperCase() || ""
        accountName = accountName || decodeURIComponent(url.pathname.slice(7)).split(":").pop() || "未命名"
      } catch {}
    }
    
    if (!secret || !accountName) return
    
    const testCode = await generateTOTP(secret)
    if (testCode === "------") return
    
    setAccounts([...accounts, { id: crypto.randomUUID(), name: accountName, secret }])
    setInput("")
    setName("")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold">2FA 验证器</h1>
        </div>

        {/* 添加表单 */}
        <div className="mb-4 p-3 bg-muted/30 rounded-xl space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="账户名称"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="密钥或 otpauth:// URI"
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono"
            />
            <button onClick={addAccount} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 验证码列表 */}
        <div className="space-y-2">
          {accounts.map((account) => (
            <CodeCard key={account.id} account={account} onDelete={() => setAccounts(accounts.filter(a => a.id !== account.id))} />
          ))}
        </div>

        {accounts.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">添加账户后，验证码会在这里显示</p>
        )}
      </div>
    </div>
  )
}
