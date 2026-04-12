"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Plus, Trash2, Copy, Check, Eye, EyeOff, QrCode, Key, Clock, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"

interface TOTPAccount {
  id: string
  name: string
  secret: string
  issuer?: string
  createdAt: number
}

// TOTP 生成算法
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

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message)
  return new Uint8Array(signature)
}

async function generateTOTP(secret: string, timeStep = 30, digits = 6): Promise<string> {
  try {
    const key = base32Decode(secret)
    const time = Math.floor(Date.now() / 1000 / timeStep)
    
    const timeBuffer = new Uint8Array(8)
    let t = time
    for (let i = 7; i >= 0; i--) {
      timeBuffer[i] = t & 0xff
      t = Math.floor(t / 256)
    }
    
    const hmac = await hmacSha1(key, timeBuffer)
    const offset = hmac[hmac.length - 1] & 0x0f
    const code = ((hmac[offset] & 0x7f) << 24 |
                  (hmac[offset + 1] & 0xff) << 16 |
                  (hmac[offset + 2] & 0xff) << 8 |
                  (hmac[offset + 3] & 0xff)) % Math.pow(10, digits)
    
    return code.toString().padStart(digits, "0")
  } catch {
    return "------"
  }
}

function TOTPCard({ account, onDelete }: { account: TOTPAccount; onDelete: () => void }) {
  const [code, setCode] = useState("------")
  const [timeLeft, setTimeLeft] = useState(30)
  const [copied, setCopied] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  const updateCode = useCallback(async () => {
    const newCode = await generateTOTP(account.secret)
    setCode(newCode)
  }, [account.secret])

  useEffect(() => {
    updateCode()
    
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = 30 - (now % 30)
      setTimeLeft(remaining)
      
      if (remaining === 30) {
        updateCode()
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [updateCode])

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const progress = (timeLeft / 30) * 100

  return (
    <div className="bg-card border border-border rounded-2xl p-5 transition-all hover:border-accent/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{account.name}</h3>
          {account.issuer && (
            <p className="text-sm text-muted-foreground truncate">{account.issuer}</p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={copyCode}
          className="flex-1 flex items-center justify-center gap-3 py-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors group"
        >
          <span className="text-3xl font-mono font-bold tracking-[0.3em] text-foreground">
            {code.slice(0, 3)} {code.slice(3)}
          </span>
          {copied ? (
            <Check className="w-5 h-5 text-emerald-500" />
          ) : (
            <Copy className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono w-6 text-center">{timeLeft}s</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <button
          onClick={() => setShowSecret(!showSecret)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showSecret ? "隐藏密钥" : "显示密钥"}</span>
        </button>
        {showSecret && (
          <p className="mt-2 text-xs font-mono text-muted-foreground break-all bg-muted/50 p-2 rounded">
            {account.secret}
          </p>
        )}
      </div>
    </div>
  )
}

export default function TwoFactorAuthPage() {
  const [accounts, setAccounts] = useState<TOTPAccount[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newSecret, setNewSecret] = useState("")
  const [newIssuer, setNewIssuer] = useState("")
  const [error, setError] = useState("")

  // 从 localStorage 加载账户
  useEffect(() => {
    const saved = localStorage.getItem("totp_accounts")
    if (saved) {
      try {
        setAccounts(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
  }, [])

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem("totp_accounts", JSON.stringify(accounts))
  }, [accounts])

  const parseOTPAuthURI = (uri: string): { name: string; secret: string; issuer?: string } | null => {
    try {
      if (!uri.startsWith("otpauth://totp/")) return null
      
      const url = new URL(uri)
      const label = decodeURIComponent(url.pathname.slice(7)) // Remove "/totp/"
      const secret = url.searchParams.get("secret")
      const issuer = url.searchParams.get("issuer")
      
      if (!secret) return null
      
      // Parse label for name and issuer
      let name = label
      let parsedIssuer = issuer || undefined
      
      if (label.includes(":")) {
        const [issuerPart, namePart] = label.split(":")
        parsedIssuer = parsedIssuer || issuerPart
        name = namePart
      }
      
      return { name, secret: secret.toUpperCase(), issuer: parsedIssuer }
    } catch {
      return null
    }
  }

  const addAccount = async () => {
    setError("")
    
    // 检查是否是 otpauth:// URI
    const parsed = parseOTPAuthURI(newSecret.trim())
    
    let name = newName.trim()
    let secret = newSecret.trim().toUpperCase().replace(/\s/g, "")
    let issuer = newIssuer.trim()
    
    if (parsed) {
      name = name || parsed.name
      secret = parsed.secret
      issuer = issuer || parsed.issuer || ""
    }
    
    if (!name) {
      setError("请输入账户名称")
      return
    }
    
    if (!secret) {
      setError("请输入密钥")
      return
    }
    
    // 验证密钥格式
    if (!/^[A-Z2-7]+=*$/.test(secret.replace(/\s/g, ""))) {
      // 尝试解码看是否有效
      try {
        const decoded = base32Decode(secret)
        if (decoded.length === 0) {
          setError("密钥格式无效，请检查是否为 Base32 编码")
          return
        }
      } catch {
        setError("密钥格式无效，请检查是否为 Base32 编码")
        return
      }
    }
    
    // 测试生成验证码
    const testCode = await generateTOTP(secret)
    if (testCode === "------") {
      setError("密钥无效，无法生成验证码")
      return
    }
    
    const newAccount: TOTPAccount = {
      id: crypto.randomUUID(),
      name,
      secret,
      issuer: issuer || undefined,
      createdAt: Date.now()
    }
    
    setAccounts([...accounts, newAccount])
    setNewName("")
    setNewSecret("")
    setNewIssuer("")
    setShowAddForm(false)
  }

  const deleteAccount = (id: string) => {
    if (confirm("确定要删除此账户吗？删除后将无法恢复。")) {
      setAccounts(accounts.filter(a => a.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">2FA 验证器</h1>
            <p className="text-sm text-muted-foreground">管理您的两步验证账户</p>
          </div>
        </div>

        {/* 安全提示 */}
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-400">
            <p className="font-medium mb-1">安全提示</p>
            <p className="text-amber-600 dark:text-amber-500">
              密钥仅保存在您的浏览器本地，清除浏览器数据会导致密钥丢失。建议同时使用其他验证器应用作为备份。
            </p>
          </div>
        </div>

        {/* 添加账户按钮/表单 */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-6 p-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>添加账户</span>
          </button>
        ) : (
          <div className="mb-6 p-5 bg-card border border-border rounded-2xl">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Key className="w-4 h-4" />
              添加新账户
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  账户名称 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如：Claude Pro"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  密钥或 URI <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                  placeholder="粘贴 Base32 密钥或 otpauth:// URI"
                  rows={3}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 font-mono text-sm"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  支持直接粘贴 otpauth:// 开头的 URI，会自动解析
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  服务商（可选）
                </label>
                <input
                  type="text"
                  value={newIssuer}
                  onChange={(e) => setNewIssuer(e.target.value)}
                  placeholder="例如：Anthropic"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewName("")
                    setNewSecret("")
                    setNewIssuer("")
                    setError("")
                  }}
                  className="flex-1 py-3 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={addAccount}
                  className="flex-1 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/90 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 账户列表 */}
        {accounts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">暂无账户</h3>
            <p className="text-sm text-muted-foreground mb-6">
              添加您的第一个 2FA 账户开始使用
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <TOTPCard
                key={account.id}
                account={account}
                onDelete={() => deleteAccount(account.id)}
              />
            ))}
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-8 p-5 bg-muted/30 rounded-2xl">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            如何使用
          </h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-medium text-foreground">1.</span>
              <span>在需要设置 2FA 的服务中，找到"设置验证器"或"添加身份验证器"选项</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">2.</span>
              <span>复制显示的密钥（通常是一串字母和数字），或者复制 otpauth:// 开头的 URI</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">3.</span>
              <span>点击上方"添加账户"，粘贴密钥并保存</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">4.</span>
              <span>验证码每 30 秒更新一次，点击验证码即可复制</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
