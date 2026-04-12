"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminSidebar } from "@/components/admin-sidebar"
import { BlogManager } from "@/components/blog-manager"
import { AffiliateManager } from "@/components/affiliate-manager"
import { FinancePanel } from "@/components/finance-panel"
import { MarkdownEditor } from "@/components/markdown-editor"
import { TiptapEditor, parseDetailsToHtml } from "@/components/tiptap-editor"
import {
  AlertCircle,
  BarChart3,
  DollarSign,
  Key,
  Loader2,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
  Send,
  CheckCircle,
  Clock,
  Activity,
  Box,
  Plus,
  Pencil,
  Trash2,
  X,
  CreditCard,
  Wrench,
  Shield,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface Order {
  out_trade_no: string
  email: string
  amount: number
  status: "pending" | "paid" | "failed"
  pay_channel: string
  code: string
  product_id?: string
  product_name?: string
  created_at: string
  paid_at?: string
  fulfilled_at?: string
  client_ip?: string
  subject?: string
  delivery_type?: string
  quantity?: number
  selected_region?: string
  region_name?: string
}

interface Stats {
  totalOrders: number
  paidOrders: number
  totalRevenue: number
  stockCount: number
}

interface ActivationCode {
  id: string
  code: string
  status: "available" | "sold" | "locked"
  created_at: string
  updated_at: string
  sold_at?: string // Added for sold codes
  locked_at?: string // Added for locked codes
}

interface RegionOption {
  code: string
  name: string
  price?: number
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  original_price: number | null
  sku: string
  status: "active" | "inactive"
  sort_order: number
  stock_count?: number
  region_options?: RegionOption[] | null
  require_region_selection?: boolean
  created_at: string
  updated_at: string
}

interface ManualEmailForm {
  email: string
  activationCode: string
  subject: string
  message: string
}

export default function AdminPage() {
  const searchParams = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [activationCodes, setActivationCodes] = useState<ActivationCode[]>([])
  const [codesPage, setCodesPage] = useState(1)
  const [codesTotalPages, setCodesTotalPages] = useState(1)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newCodes, setNewCodes] = useState("")

  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Sync tab from URL query param (e.g. /admin?tab=orders when navigating back from /admin/blog)
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["dashboard", "orders", "products", "codes", "blog", "settings"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotalPages, setOrdersTotalPages] = useState(1)
  const [ordersStatusFilter, setOrdersStatusFilter] = useState("")
  const [ordersProductFilter, setOrdersProductFilter] = useState("")
  const [ordersSearch, setOrdersSearch] = useState("")
  const [ordersSummary, setOrdersSummary] = useState({ paid: 0, pending: 0, failed: 0, total: 0, totalRevenue: 0 })
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [showOrderDeleteConfirm, setShowOrderDeleteConfirm] = useState(false)
  const [emailTemplate, setEmailTemplate] = useState({
    shop_name: "",
    greeting_text: "",
    tips_text: "",
    wechat_id: "",
    footer_text: "",
    primary_color: "#0f172a",
    custom_note: "",
  })
  const [emailTemplateLoading, setEmailTemplateLoading] = useState(false)
  const [emailTemplateSaving, setEmailTemplateSaving] = useState(false)
  const [emailPreviewMode, setEmailPreviewMode] = useState(false)
  const [emailTemplateLoaded, setEmailTemplateLoaded] = useState(false)
  const [paymentConfig, setPaymentConfig] = useState({ alipay: true, usdt: true })
  const [usdtRate, setUsdtRate] = useState("7.20")
  const [toolsConfig, setToolsConfig] = useState({ twofa: true, gmailChecker: true })

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({ alipay: true, usdt: true })
  const [paymentSettingsLoading, setPaymentSettingsLoading] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState("")
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [adminToken, setAdminToken] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)


  const [manualEmailForm, setManualEmailForm] = useState<ManualEmailForm>({
    email: "",
    activationCode: "",
    subject: "您的激活码",
    message: "感谢您的购买！以下是您的激活码，请妥善保管。",
  })
  const [emailSending, setEmailSending] = useState(false)
  const [sendingCodeToOrder, setSendingCodeToOrder] = useState<string | null>(null)
  const [manualCodeInputs, setManualCodeInputs] = useState<{ [key: string]: string }>({})
  const [sendingManualCodeToOrder, setSendingManualCodeToOrder] = useState<string | null>(null)
  const [fulfillModal, setFulfillModal] = useState<{ orderNo: string; email: string; productName: string; quantity: number } | null>(null)
  const [fulfillCodes, setFulfillCodes] = useState("")
  const [fulfillUnitCost, setFulfillUnitCost] = useState("")
  const [fulfillSupplier, setFulfillSupplier] = useState("")
  const [fulfillCostNotes, setFulfillCostNotes] = useState("")
  const [fulfilling, setFulfilling] = useState(false)

  // Codes filter state
  const [codesStatusFilter, setCodesStatusFilter] = useState("")
  const [codesProductFilter, setCodesProductFilter] = useState("")
  const [codesSearch, setCodesSearch] = useState("")
  const [codesSummary, setCodesSummary] = useState({ available: 0, sold: 0, locked: 0 })
  const [showImportPanel, setShowImportPanel] = useState(false)

  // Product management state
  const [products, setProducts] = useState<Product[]>([])
  const [productCategories, setProductCategories] = useState<{ id: string; name: string; slug: string; icon?: string; product_count: number }[]>([])
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; slug: string; icon?: string; payment_name?: string } | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", icon: "", sort_order: "0", payment_name: "" })
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({ name: "", description: "", details: "", price: "", original_price: "", sku: "", sort_order: "0", delivery_type: "auto" as string, price_tiers: [] as { min_qty: number; price: number }[], category_id: undefined as string | undefined, region_options: [] as RegionOption[], require_region_selection: false, image_url: "" })
  const [productLoading, setProductLoading] = useState(false)
  const [importProductId, setImportProductId] = useState("")
  const [importBatchName, setImportBatchName] = useState("")
  const [importUnitCost, setImportUnitCost] = useState("")
  const [importSupplier, setImportSupplier] = useState("")
  const [importNotes, setImportNotes] = useState("")

  useEffect(() => {
    // Check if already authenticated via JWT cookie
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/verify")
        if (res.ok) {
          // Retrieve token from localStorage for API calls
          const storedToken = localStorage.getItem("adminToken")
          if (storedToken) {
            setAdminToken(storedToken)
            setIsAuthenticated(true)
            loadData()
            loadPaymentSettings()
            loadToolsConfig()
          }
        }
      } catch {
        // Not authenticated
      }
    }
    checkAuth()
  }, [])

  const handleLogin = async () => {
    setLoginError("")
    setLoginLoading(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (res.ok && data.token) {
        setAdminToken(data.token)
        localStorage.setItem("adminToken", data.token)
        setIsAuthenticated(true)
        loadData()
        setMessage("登录成功")
      } else if (res.status === 429) {
        setLoginError(data.error || "登录尝试次数过多，请稍后再试")
      } else {
        setLoginError(data.error || "密码错误")
        if (data.remaining !== undefined && data.remaining <= 2) {
          setLoginError(`密码错误，还剩 ${data.remaining} 次尝试机会`)
        }
      }
    } catch {
      setLoginError("网络错误，请重试")
    }
    setLoginLoading(false)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
    } catch {
      // ignore
    }
    localStorage.removeItem("adminToken")
    setAdminToken("")
    setIsAuthenticated(false)
    setPassword("")
  }

  const loadData = async () => {
    console.log("[v0] Starting to load admin data...")
    setDataLoading(true)
    try {
      console.log("[v0] Fetching stats, orders, and codes...")

      // Load stats
      try {
        const statsRes = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        console.log("[v0] Stats response status:", statsRes.status)

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          console.log("[v0] Stats data:", statsData)
          setStats(statsData)
  
        } else {
          const errorText = await statsRes.text()
          console.error("[v0] Stats API error:", errorText)
          setMessage("获取统计数据失败: " + errorText)
        }
      } catch (error) {
        console.error("[v0] Stats API error:", error)
        setMessage("获取统计数据失败")
      }

      // Load orders
      await loadOrders(1)

      // Load codes
      try {
        const codesRes = await fetch(`/api/admin/codes?page=1&limit=50`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        if (codesRes.ok) {
          const codesData = await codesRes.json()
          setActivationCodes(codesData.codes)
          setCodesPage(codesData.pagination.page)
          setCodesTotalPages(codesData.pagination.totalPages)
          if (codesData.summary) setCodesSummary(codesData.summary)
        } else {
          const errorText = await codesRes.text()
          console.error("[v0] Codes API error:", errorText)
        }
      } catch (error) {
        console.error("[v0] Codes API error:", error)
        setMessage("获取激活码数据失败")
      }

      // Load payment config
      try {
        const configRes = await fetch("/api/admin/config", {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        if (configRes.ok) {
          const configData = await configRes.json()
          setPaymentConfig({
            alipay: configData.configs?.find((c: any) => c.key === "payment_alipay_enabled")?.value !== "false",
            usdt: configData.configs?.find((c: any) => c.key === "payment_usdt_enabled")?.value !== "false",
          })
          // Load USDT rate
          const rateConfig = configData.configs?.find((c: any) => c.key === "usdt_cny_rate")
          if (rateConfig?.value) {
            setUsdtRate(rateConfig.value)
          }
        }
      } catch (error) {
        console.error("[v0] Payment config load error:", error)
      }
      // Load products
      try {
        const productsRes = await fetch("/api/admin/products", {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData)
        }
      } catch (error) {
        console.error("[v0] Products API error:", error)
      }

      // Load product categories
      try {
        const categoriesRes = await fetch("/api/admin/categories", {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setProductCategories(categoriesData.categories || [])
        }
      } catch (error) {
        console.error("[v0] Categories API error:", error)
      }

    } catch (error) {
      console.error("[v0] Load data error:", error)
      setMessage("加载数据失败: " + error)
    } finally {
      console.log("[v0] Finished loading admin data")
      setDataLoading(false)
    }
  }

  const loadOrders = async (page: number, statusFilter?: string, productFilter?: string, searchTerm?: string) => {
    try {
      const s = statusFilter ?? ordersStatusFilter
      const p = productFilter ?? ordersProductFilter
      const q = searchTerm ?? ordersSearch
      const params = new URLSearchParams({ page: String(page), limit: "30" })
      if (s) params.set("status", s)
      if (p) params.set("productId", p)
      if (q) params.set("search", q)

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setOrdersPage(data.pagination.page)
        setOrdersTotalPages(data.pagination.totalPages)
        if (data.summary) setOrdersSummary(data.summary)
      }
    } catch (error) {
      console.error("[v0] Load orders error:", error)
    }
  }

  const loadCodes = async (page: number, statusFilter?: string, productFilter?: string, searchTerm?: string) => {
    try {
      const s = statusFilter ?? codesStatusFilter
      const p = productFilter ?? codesProductFilter
      const q = searchTerm ?? codesSearch
      const params = new URLSearchParams({ page: String(page), limit: "50" })
      if (s) params.set("status", s)
      if (p) params.set("productId", p)
      if (q) params.set("search", q)

      const codesRes = await fetch(`/api/admin/codes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      if (codesRes.ok) {
        const codesData = await codesRes.json()
        setActivationCodes(codesData.codes)
        setCodesPage(page)
        setCodesTotalPages(codesData.pagination.totalPages)
        if (codesData.summary) setCodesSummary(codesData.summary)
      }
    } catch (error) {
      console.error("[v0] Load codes error:", error)
    }
  }

  const initializeSampleData = async () => {
    setLoading(true)
    try {
      // Add sample activation codes
      const sampleCodes = [
        "SAMPLE-CODE-001",
        "SAMPLE-CODE-002",
        "SAMPLE-CODE-003",
        "SAMPLE-CODE-004",
        "SAMPLE-CODE-005",
      ]

      const response = await fetch("/api/admin/import-codes", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          Authorization: `Bearer ${adminToken}`,
        },
        body: sampleCodes.join("\n"),
      })

      if (response.ok) {
        setMessage("已初始化5个示例激活码")
        loadData()
      } else {
        setMessage("初始化示例数据失败")
      }
    } catch (error) {
      setMessage("初始化示例数据失败")
    }
    setLoading(false)
  }

  const handleImportCodes = async () => {
    if (!newCodes.trim()) {
      setMessage("请输入激活码")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/import-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          codes: newCodes,
          productId: importProductId || null,
          batchName: importBatchName || null,
          unitCost: importUnitCost ? Number(importUnitCost) : null,
          supplier: importSupplier || null,
          notes: importNotes || null,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        const costInfo = importUnitCost ? `（成本 ${importUnitCost} 元/个）` : ""
        setMessage(`成功导入 ${result.imported} 个激活码${costInfo}`)
        setNewCodes("")
        setImportBatchName("")
        setImportUnitCost("")
        setImportSupplier("")
        setImportNotes("")
        loadData()
      } else {
        setMessage(result.error || "导入失败")
      }
    } catch (error) {
      setMessage("导入失败")
    }
    setLoading(false)
  }



  const handleSendManualEmail = async () => {
    if (!manualEmailForm.email.trim() || !manualEmailForm.activationCode.trim()) {
      setMessage("请填写邮箱地址和激活码")
      return
    }

    setEmailSending(true)
    try {
      const response = await fetch("/api/admin/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: manualEmailForm.email,
          activationCode: manualEmailForm.activationCode,
          subject: manualEmailForm.subject,
          message: manualEmailForm.message,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage("激活码邮件发送成功")
        setManualEmailForm({
          email: "",
          activationCode: "",
          subject: "您的激活码",
          message: "感谢您的购买！以下是您的激活码，请妥善保管。",
        })
      } else {
        setMessage(result.error || "邮件发送失败")
      }
    } catch (error) {
      setMessage("邮件发送失败")
    }
    setEmailSending(false)
  }

  const handleDeleteCodes = async () => {
    if (selectedCodes.length === 0) {
      setMessage("请选择要删除的激活码")
      return
    }

    setDeleting(true)
    try {
      const response = await fetch("/api/admin/codes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ codeIds: selectedCodes }),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage(result.message)
        setSelectedCodes([])
        setShowDeleteConfirm(false)
        loadData()
      } else {
        setMessage(result.error || "删除失败")
      }
    } catch (error) {
      setMessage("删除失败")
    }
    setDeleting(false)
  }

  const handleChangeCodeStatus = async (codeIds: string[], newStatus: string) => {
    if (codeIds.length === 0) return

    try {
      const response = await fetch("/api/admin/codes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ codeIds, status: newStatus }),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage(result.message)
        setSelectedCodes([])
        loadCodes(codesPage)
      } else {
        setMessage(result.error || "状态更新失败")
      }
    } catch (error) {
      setMessage("状态更新失败")
    }
  }

  const toggleCodeSelection = (codeId: string) => {
    setSelectedCodes((prev) => (prev.includes(codeId) ? prev.filter((id) => id !== codeId) : [...prev, codeId]))
  }

  const toggleSelectAll = () => {
    const availableCodes = activationCodes.filter((code) => code.status === "available")
    if (selectedCodes.length === availableCodes.length) {
      setSelectedCodes([])
    } else {
      setSelectedCodes(availableCodes.map((code) => code.id))
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setMessage("激活码已复制到剪贴板")
    } catch (error) {
      setMessage("复制失败")
    }
  }

  const loadPaymentSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/config", {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      if (response.ok) {
        const { configs } = await response.json()
        const settings = { alipay: true, usdt: true }
        for (const config of configs || []) {
          if (config.key === "payment_alipay_enabled") {
            settings.alipay = config.value === "true"
          } else if (config.key === "payment_usdt_enabled") {
            settings.usdt = config.value === "true"
          }
        }
        setPaymentSettings(settings)
      }
    } catch (error) {
      console.error("Load payment settings error:", error)
    }
  }, [adminToken])

  const togglePaymentMethod = async (method: "alipay" | "usdt") => {
    setPaymentSettingsLoading(true)
    const newValue = !paymentSettings[method]
    try {
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          key: `payment_${method}_enabled`,
          value: String(newValue),
        }),
      })
      if (response.ok) {
        setPaymentSettings((prev) => ({ ...prev, [method]: newValue }))
        setMessage(`${method === "alipay" ? "支付宝" : "USDT"} 支付已${newValue ? "启用" : "禁用"}`)
      }
    } catch (error) {
      setMessage("保存失败")
    }
    setPaymentSettingsLoading(false)
  }

  // 加载工具配置
  const loadToolsConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/tools-config")
      if (response.ok) {
        const config = await response.json()
        setToolsConfig(config)
      }
    } catch (error) {
      console.error("Load tools config error:", error)
    }
  }, [])

  // 切换工具开关
  const toggleTool = async (tool: "twofa" | "gmailChecker") => {
    const newConfig = { ...toolsConfig, [tool]: !toolsConfig[tool] }
    setToolsConfig(newConfig)
    try {
      const response = await fetch("/api/admin/tools-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      })
      if (response.ok) {
        setMessage(`${tool === "twofa" ? "2FA 验证器" : "Gmail 检测"} 已${newConfig[tool] ? "启用" : "禁用"}`)
      } else {
        // 恢复原状态
        setToolsConfig(toolsConfig)
        setMessage("保存失败")
      }
    } catch (error) {
      setToolsConfig(toolsConfig)
      setMessage("保存失败")
    }
  }

  const handleSaveUsdtRate = async () => {
    try {
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ key: "usdt_cny_rate", value: usdtRate }),
      })

      if (response.ok) {
        setMessage(`USDT 汇率已更新为 ${usdtRate}`)
      } else {
        setMessage("更新汇率失败")
      }
    } catch {
      setMessage("更新汇率失败")
    }
  }

  const handlePaymentToggle = async (method: "alipay" | "usdt", enabled: boolean) => {
    try {
      const key = method === "alipay" ? "payment_alipay_enabled" : "payment_usdt_enabled"
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ key, value: enabled ? "true" : "false" }),
      })

      if (response.ok) {
        setPaymentConfig((prev) => ({ ...prev, [method]: enabled }))
        setMessage(`${method === "alipay" ? "支付宝" : "USDT"} 已${enabled ? "启用" : "禁用"}`)
      } else {
        setMessage("更新支付设置失败")
      }
    } catch {
      setMessage("更新支付设置失败")
    }
  }

  const handleVerifyCrypto = async (orderNo: string) => {
    if (!confirm(`确定要验证订单 ${orderNo} 的USDT支付吗？验证后将自动���货/发码。`)) {
      return
    }

    try {
      const response = await fetch("/api/admin/crypto/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ orderNo }),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage(result.message || "USDT支付已验证，订单已完成")
        loadData()
      } else {
        setMessage(result.error || "验证失败")
      }
    } catch {
      setMessage("验证请求失败")
    }
  }

  const handleSendCodeToOrder = async (order: Order) => {
    if (!order.email) {
      setMessage("订单邮箱地址不存在")
      return
    }

    // Prevent sending if order already has a code
    if (order.code) {
      setMessage("该订单已有激活码，无需重复发送。如需重发请展开订单使用手动发码。")
      return
    }

    // Confirm before sending
    if (!confirm(`确定要为订单 ${order.out_trade_no} 自动分配并发送激活码吗？`)) {
      return
    }

    setSendingCodeToOrder(order.out_trade_no)
    try {
      // Let the server pick the correct product-matching code from the full DB
      const response = await fetch("/api/admin/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: order.email,
          orderNo: order.out_trade_no,
          productId: order.product_id || null,
          productName: order.product_name || "",
          autoAssign: true,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage(result.message || `激活码已发送至 ${order.email}`)
        loadData()
      } else {
        setMessage(result.error || "激活码发送失败")
      }
    } catch (error) {
      setMessage("激活码发送失败")
    }
    setSendingCodeToOrder(null)
  }

  const handleSendManualCodeToOrder = async (order: Order, manualCode: string) => {
    if (!order.email) {
      setMessage("订单邮箱地址不存在")
      return
    }

    if (!manualCode.trim()) {
      setMessage("请输入激活码")
      return
    }

    // Warn if order already has a code
    if (order.code) {
      if (!confirm(`该订单已有激活码 "${order.code}"，确定要覆盖并发送新激活码 "${manualCode}" 吗？`)) {
        return
      }
    }

    setSendingManualCodeToOrder(order.out_trade_no)
    try {
      const response = await fetch("/api/admin/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: order.email,
          activationCode: manualCode,
          orderNo: order.out_trade_no,
          productName: order.product_name || "",
          isManual: true,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage(`手动激活码已发送至 ${order.email}`)
        // Clear the manual input
        setManualCodeInputs((prev) => ({ ...prev, [order.out_trade_no]: "" }))
        // Refresh data to show updated status
        loadData()
      } else {
        setMessage(result.error || "激活码发送失败")
      }
    } catch (error) {
      setMessage("激活码发送失败")
    }
    setSendingManualCodeToOrder(null)
  }

  const handleFulfillOrder = async () => {
    if (!fulfillModal || !fulfillCodes.trim()) return
    setFulfilling(true)
    try {
      const response = await fetch("/api/admin/fulfill-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          orderNo: fulfillModal.orderNo,
          codes: fulfillCodes.trim(),
          unitCost: fulfillUnitCost ? Number(fulfillUnitCost) : null,
          supplier: fulfillSupplier || null,
          costNotes: fulfillCostNotes || null,
        }),
      })
      const result = await response.json()
      if (response.ok) {
        setMessage(result.message || "发货成功")
        setFulfillModal(null)
        setFulfillCodes("")
        setFulfillUnitCost("")
        setFulfillSupplier("")
        setFulfillCostNotes("")
        loadData()
      } else {
        setMessage(result.error || "发货失败")
      }
    } catch {
      setMessage("发货失败，请重试")
    }
    setFulfilling(false)
  }

  const renderDashboard = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid - Enhanced mobile responsiveness */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6">
        <Card className="admin-stat-card">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">总订单数</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground">{stats?.totalOrders || 0}</p>
                <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  较上月增长 12%
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-chart-1/10 rounded-xl flex items-center justify-center shrink-0 self-end sm:self-auto">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-stat-card">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">已支付订单</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground">{stats?.paidOrders || 0}</p>
                <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  支付成功率 95%
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-chart-2/10 rounded-xl flex items-center justify-center shrink-0 self-end sm:self-auto">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-stat-card">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">总收入</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground">¥{stats?.totalRevenue || 0}</p>
                <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                  <DollarSign className="w-3 h-3 inline mr-1" />
                  本月收入目标 80%
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 self-end sm:self-auto">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-stat-card">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{"库存 / 待发货"}</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground">{stats?.stockCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                  {(stats?.pendingFulfill || 0) > 0 ? (
                    <span className="text-orange-500 font-medium">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {stats?.pendingFulfill} {"单待发货"}
                    </span>
                  ) : (
                    <>
                      <Package className="w-3 h-3 inline mr-1" />
                      {"自动发货库存"}
                    </>
                  )}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-chart-3/10 rounded-xl flex items-center justify-center shrink-0 self-end sm:self-auto">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats && stats.stockCount === 0 && stats.paidOrders > 0 && !(stats as any).pendingFulfill && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-amber-800">系统初始化提醒</CardTitle>
                <CardDescription className="text-amber-700">检测到激活码库存为空，建议立即添加库存</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-3">
              <Button
                onClick={initializeSampleData}
                disabled={loading}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100 bg-transparent"
              >
                {loading ? "初始化中..." : "添加示例激活码"}
              </Button>
              <Button onClick={() => setActiveTab("codes")} variant="default">
                前往激活码管理
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Grid - Enhanced mobile layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>最近订单</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">最新的订单活动</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.out_trade_no} className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium truncate">{order.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs sm:text-sm font-medium">¥{order.amount}</p>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {order.status === "paid" ? "已支付" : "待支付"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>系统活动</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">最近的系统操作</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium">新订单创建</p>
                  <p className="text-xs text-muted-foreground">2分钟前</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium">激活码发送成功</p>
                  <p className="text-xs text-muted-foreground">5分钟前</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium">库存更新</p>
                  <p className="text-xs text-muted-foreground">10分钟前</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const orderStatusLabel = (s: string) => {
    if (s === "paid") return "已支付"
    if (s === "pending") return "待支付"
    if (s === "failed") return "失败"
    return s
  }
  const orderStatusColor = (s: string) => {
    if (s === "paid") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
    if (s === "pending") return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
    if (s === "failed") return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
    return ""
  }

  const renderOrders = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:ring-2 hover:ring-emerald-500/50 transition-all" onClick={() => handleOrdersFilterChange("status", ordersStatusFilter === "paid" ? "" : "paid")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{ordersSummary.paid}</p>
            <p className="text-xs text-muted-foreground mt-1">已支付</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-amber-500/50 transition-all" onClick={() => handleOrdersFilterChange("status", ordersStatusFilter === "pending" ? "" : "pending")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{ordersSummary.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">待支付</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-red-500/50 transition-all" onClick={() => handleOrdersFilterChange("status", ordersStatusFilter === "failed" ? "" : "failed")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{ordersSummary.failed}</p>
            <p className="text-xs text-muted-foreground mt-1">失败</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{ordersSummary.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">总收入 (元)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              订单列表
              <span className="text-sm font-normal text-muted-foreground">({ordersSummary.total})</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedOrders.length > 0 && (
                <>
                  <Button variant="destructive" size="sm" onClick={() => setShowOrderDeleteConfirm(true)} disabled={isDeleting}>
                    删除 ({selectedOrders.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrders([])}>
                    取消
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="搜索订单号/邮箱/激活码..."
                value={ordersSearch}
                onChange={(e) => setOrdersSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleOrdersSearch() }}
                className="text-sm"
              />
            </div>
            <select
              value={ordersStatusFilter}
              onChange={(e) => handleOrdersFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[120px]"
            >
              <option value="">全部状态</option>
              <option value="paid">已支付</option>
              <option value="pending">待支付</option>
              <option value="failed">失败</option>
            </select>
            {products.length > 0 && (
              <select
                value={ordersProductFilter}
                onChange={(e) => handleOrdersFilterChange("product", e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
              >
                <option value="">全部产品</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            )}
            <Button variant="outline" size="sm" onClick={handleOrdersSearch} className="shrink-0 bg-transparent">
              搜索
            </Button>
          </div>

          {/* Select All */}
          {orders.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={selectedOrders.length > 0 && selectedOrders.length === orders.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedOrders(orders.map((o) => o.out_trade_no))
                  } else {
                    setSelectedOrders([])
                  }
                }}
                className="rounded"
              />
              <span>全选当前页</span>
            </div>
          )}

          {/* Orders Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium w-8"></th>
                    <th className="text-left p-3 font-medium">订单信息</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">产品</th>
                    <th className="text-left p-3 font-medium">金额</th>
                    <th className="text-left p-3 font-medium">状态</th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">时间</th>
                    <th className="text-right p-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <>
                      <tr key={order.out_trade_no} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.out_trade_no ? null : order.out_trade_no)}>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.out_trade_no)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrders([...selectedOrders, order.out_trade_no])
                              } else {
                                setSelectedOrders(selectedOrders.filter((id) => id !== order.out_trade_no))
                              }
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm truncate max-w-[180px]">{order.email || "无邮箱"}</p>
                            <p className="text-xs text-muted-foreground font-mono">{order.out_trade_no}</p>
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <div className="space-y-0.5">
                            <span className="text-xs text-muted-foreground">{order.product_name || "通用"}</span>
                            {(order.quantity > 1 || order.delivery_type === "manual" || order.region_name) && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {order.region_name && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">{order.region_name}</span>}
                                {order.quantity > 1 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">x{order.quantity}</span>}
                                {order.delivery_type === "manual" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{"人工"}</span>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{order.amount}</td>
                        <td className="p-3">
                          {order.status === "paid" && order.delivery_type === "manual" && !order.fulfilled_at ? (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 animate-pulse">
                              {"待发货"}
                            </Badge>
                          ) : order.payment_method === "usdt" && order.status === "pending" && (order as any).crypto_tx_hash ? (
                            <Badge variant="secondary" className="bg-[#26A17B]/20 text-[#26A17B] animate-pulse">
                              {"待验证USDT"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className={orderStatusColor(order.status)}>
                              {orderStatusLabel(order.status)}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                          {new Date(order.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {/* Crypto payment: show verify button */}
                            {order.payment_method === "usdt" && order.status === "pending" && (order as any).crypto_tx_hash && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleVerifyCrypto(order.out_trade_no)}
                                className="h-7 px-2 text-xs bg-[#26A17B] hover:bg-[#1f8a68] text-white"
                              >
                                {"验证USDT"}
                              </Button>
                            )}
                            {/* Manual delivery: show fulfill button */}
                            {order.status === "paid" && order.delivery_type === "manual" && !order.fulfilled_at && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setFulfillModal({ orderNo: order.out_trade_no, email: order.email, productName: order.product_name || order.subject || "", quantity: order.quantity || 1 })}
                                className="h-7 px-2 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                <Package className="w-3 h-3 mr-1" />
                                {"发货"}
                              </Button>
                            )}
                            {/* Auto delivery: show send code button if no code yet */}
                            {order.status === "paid" && order.delivery_type !== "manual" && order.email && !order.code && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendCodeToOrder(order)}
                                disabled={sendingCodeToOrder === order.out_trade_no}
                                className="h-7 px-2 text-xs"
                                title="自动分配并发送激活码"
                              >
                                {sendingCodeToOrder === order.out_trade_no ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <Mail className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">{"发码"}</span>
                                  </>
                                )}
                              </Button>
                            )}
                            {order.fulfilled_at && order.delivery_type === "manual" && (
                              <span className="text-xs text-emerald-600 font-medium">{"已发货"}</span>
                            )}
                            {order.fulfilled_at && order.code && order.delivery_type !== "manual" && (
                              <span className="text-xs text-emerald-600 font-medium" title={order.code}>{"已发货"}</span>
                            )}
                            {order.code && !order.fulfilled_at && order.delivery_type !== "manual" && (
                              <span className="text-xs text-emerald-600 font-medium" title={order.code}>{"已发码"}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Detail Row */}
                      {expandedOrder === order.out_trade_no && (
                        <tr key={`${order.out_trade_no}-detail`} className="bg-muted/20">
                          <td colSpan={7} className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase">订单信息</p>
                                <div className="space-y-1">
                                  <p><span className="text-muted-foreground">{"订单号:"}</span> <span className="font-mono text-xs">{order.out_trade_no}</span></p>
                                  <p><span className="text-muted-foreground">{"邮箱:"}</span> {order.email || "-"}</p>
                                  <p><span className="text-muted-foreground">{"产品:"}</span> {order.product_name || "通用"}</p>
                                  {order.region_name && <p><span className="text-muted-foreground">{"区域:"}</span> <span className="text-purple-600 dark:text-purple-400 font-medium">{order.region_name}</span></p>}
                                  <p><span className="text-muted-foreground">{"数量:"}</span> {order.quantity || 1}</p>
                                  <p><span className="text-muted-foreground">{"发货方式:"}</span> {order.delivery_type === "manual" ? "人工发货" : "自动发货"}</p>
                                  <p><span className="text-muted-foreground">{"支付渠道:"}</span> {order.pay_channel || "-"}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase">时间线</p>
                                <div className="space-y-1">
                                  <p><span className="text-muted-foreground">创建:</span> {new Date(order.created_at).toLocaleString()}</p>
                                  <p><span className="text-muted-foreground">支付:</span> {order.paid_at ? new Date(order.paid_at).toLocaleString() : "-"}</p>
                                  <p><span className="text-muted-foreground">发货:</span> {order.fulfilled_at ? new Date(order.fulfilled_at).toLocaleString() : "-"}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase">激活码</p>
                                {order.code ? (
                                  <div className="font-mono text-xs bg-muted px-3 py-2 rounded-md break-all">{order.code}</div>
                                ) : (
                                  <p className="text-muted-foreground">未分配</p>
                                )}
                                {/* Manual send code */}
                                {order.email && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <input
                                      type="text"
                                      placeholder="手动输入激活码"
                                      value={manualCodeInputs[order.out_trade_no] || ""}
                                      onChange={(e) =>
                                        setManualCodeInputs((prev) => ({
                                          ...prev,
                                          [order.out_trade_no]: e.target.value,
                                        }))
                                      }
                                      className="flex-1 px-2 py-1.5 text-xs border border-input bg-background rounded font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleSendManualCodeToOrder(order, manualCodeInputs[order.out_trade_no] || "")}
                                      disabled={
                                        sendingManualCodeToOrder === order.out_trade_no ||
                                        !manualCodeInputs[order.out_trade_no]?.trim()
                                      }
                                      className="text-xs h-7 shrink-0"
                                    >
                                      {sendingManualCodeToOrder === order.out_trade_no ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <><Send className="w-3 h-3 mr-1" />发送</>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">暂无订单</p>
                <p className="text-xs mt-1">订单数据将在用户完成购买后显示</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              第 {ordersPage} / {ordersTotalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => loadOrders(ordersPage - 1)} disabled={ordersPage <= 1}>
                上一页
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadOrders(ordersPage + 1)} disabled={ordersPage >= ordersTotalPages}>
                ��一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirm Modal */}
      {showOrderDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-destructive">{"确认删除"}</CardTitle>
              <CardDescription>{"确定要删除选中的"} {selectedOrders.length} {"个订单吗？此操作不可撤销。"}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="destructive" onClick={handleDeleteOrders} disabled={isDeleting} className="flex-1">
                {isDeleting ? "删除中..." : "确认删除"}
              </Button>
              <Button variant="outline" onClick={() => setShowOrderDeleteConfirm(false)} disabled={isDeleting} className="flex-1">
                {"取消"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fulfill Order Modal */}
      {fulfillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" />
                {"手动发货"}
              </CardTitle>
              <CardDescription>
                {"订单"} {fulfillModal.orderNo}
                {fulfillModal.productName && <> &middot; {fulfillModal.productName}</>}
                {(fulfillModal.quantity || 1) > 1 && <> &middot; {fulfillModal.quantity} {"个"}</>}
                <br />
                {"收件邮箱："}{fulfillModal.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{"激活码 / 账号信息"}</Label>
                <p className="text-xs text-muted-foreground mb-2">{"输入激活码、账号密码或其他交付信息，将通过邮件发送给客户"}</p>
                <textarea
                  value={fulfillCodes}
                  onChange={(e) => setFulfillCodes(e.target.value)}
                  placeholder={"输入激活码或账号信息...\n例如:\nCARD-XXXX-XXXX\n或\n账号: xxx@email.com\n密码: xxxxxx"}
                  className="w-full h-28 p-3 border border-input bg-background text-sm rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>

              {/* Cost recording */}
              <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2.5">
                <p className="text-xs font-medium text-muted-foreground">{"采购成本（选填，计入���务统计��"}</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-xs">{"单���成本 (元)"}</Label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fulfillUnitCost}
                      onChange={(e) => setFulfillUnitCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full mt-1 px-3 py-1.5 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{"供应商"}</Label>
                    <input
                      value={fulfillSupplier}
                      onChange={(e) => setFulfillSupplier(e.target.value)}
                      placeholder={"选填"}
                      className="w-full mt-1 px-3 py-1.5 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">{"备注"}</Label>
                  <input
                    value={fulfillCostNotes}
                    onChange={(e) => setFulfillCostNotes(e.target.value)}
                    placeholder={"选填，如：代购费用、充值面值等"}
                    className="w-full mt-1 px-3 py-1.5 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {fulfillUnitCost && Number(fulfillUnitCost) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {"本单成本："}
                    <span className="font-medium text-foreground">
                      {(Number(fulfillUnitCost) * (fulfillModal.quantity || 1)).toFixed(2)} {"元"}
                    </span>
                    {(fulfillModal.quantity || 1) > 1 && (
                      <> {" ("}{fulfillModal.quantity} {"个 x "}{fulfillUnitCost}{" 元)"}</>
                    )}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={handleFulfillOrder} disabled={fulfilling || !fulfillCodes.trim()} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                  {fulfilling ? "发货中..." : "确认发货"}
                </Button>
                <Button variant="outline" onClick={() => { setFulfillModal(null); setFulfillCodes(""); setFulfillUnitCost(""); setFulfillSupplier(""); setFulfillCostNotes("") }} disabled={fulfilling} className="flex-1">
                  {"取消"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  const handleCodesFilterChange = (type: string, value: string) => {
    if (type === "status") {
      setCodesStatusFilter(value)
      setSelectedCodes([])
      loadCodes(1, value, codesProductFilter, codesSearch)
    } else if (type === "product") {
      setCodesProductFilter(value)
      setSelectedCodes([])
      loadCodes(1, codesStatusFilter, value, codesSearch)
    }
  }

  const handleCodesSearch = () => {
    setSelectedCodes([])
    loadCodes(1, codesStatusFilter, codesProductFilter, codesSearch)
  }

  const statusLabel = (s: string) => {
    if (s === "available") return "可用"
    if (s === "sold") return "已售"
    if (s === "locked") return "锁定"
    return s
  }

  const statusColor = (s: string) => {
    if (s === "available") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
    if (s === "sold") return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
    if (s === "locked") return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
    return ""
  }

  const renderCodes = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:ring-2 hover:ring-emerald-500/50 transition-all" onClick={() => handleCodesFilterChange("status", codesStatusFilter === "available" ? "" : "available")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{codesSummary.available}</p>
            <p className="text-xs text-muted-foreground mt-1">可用库存</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-zinc-500/50 transition-all" onClick={() => handleCodesFilterChange("status", codesStatusFilter === "sold" ? "" : "sold")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-zinc-600">{codesSummary.sold}</p>
            <p className="text-xs text-muted-foreground mt-1">已售出</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-amber-500/50 transition-all" onClick={() => handleCodesFilterChange("status", codesStatusFilter === "locked" ? "" : "locked")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{codesSummary.locked}</p>
            <p className="text-xs text-muted-foreground mt-1">锁定中</p>
          </CardContent>
        </Card>
      </div>

      {/* Import Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">导入激活码</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowImportPanel(!showImportPanel)}>
              {showImportPanel ? "收起" : "展开导入"}
            </Button>
          </div>
        </CardHeader>
        {showImportPanel && (
          <CardContent className="space-y-4 pt-0">
            {products.length > 0 && (
              <div>
                <Label className="text-sm font-medium">{"关联产品"}</Label>
                <select
                  value={importProductId}
                  onChange={(e) => setImportProductId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{"不关联产品（通用激活码）"}</option>
                  {products.filter(p => p.status === "active").map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({(product as any).delivery_type === "manual" ? "人工发货" : `库存: ${product.stock_count || 0}`})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cost tracking fields */}
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-3">
              <p className="text-xs font-medium text-muted-foreground">{"采购成本（选填）"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{"批次名称"}</Label>
                  <input
                    value={importBatchName}
                    onChange={(e) => setImportBatchName(e.target.value)}
                    placeholder={"如：2026年2月采购"}
                    className="w-full mt-1 px-3 py-1.5 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <Label className="text-xs">{"单价成本 (元)"}</Label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={importUnitCost}
                    onChange={(e) => setImportUnitCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 px-3 py-1.5 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <Label className="text-xs">{"供应商"}</Label>
                  <input
                    value={importSupplier}
                    onChange={(e) => setImportSupplier(e.target.value)}
                    placeholder={"选填"}
                    className="w-full mt-1 px-3 py-1.5 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <Label className="text-xs">{"备注"}</Label>
                  <input
                    value={importNotes}
                    onChange={(e) => setImportNotes(e.target.value)}
                    placeholder={"选填"}
                    className="w-full mt-1 px-3 py-1.5 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              {importUnitCost && newCodes.trim() && (
                <p className="text-xs text-muted-foreground">
                  {"预计总成本："}
                  <span className="font-medium text-foreground">
                    {(Number(importUnitCost) * newCodes.split("\n").filter(c => c.trim()).length).toFixed(2)} {"元"}
                  </span>
                  {" ("}{newCodes.split("\n").filter(c => c.trim()).length}{" 个 x "}{importUnitCost}{" 元)"}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">{"激活码列表"}</Label>
              <p className="text-xs text-muted-foreground mb-1">{"每行一个激活码，重复的将自动跳过"}</p>
              <textarea
                value={newCodes}
                onChange={(e) => setNewCodes(e.target.value)}
                placeholder={"每行一个激活码\nCARD-XXXX-XXXX\nCARD-YYYY-YYYY"}
                className="w-full h-28 p-3 border border-input bg-background text-sm rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              />
            </div>
            <Button onClick={handleImportCodes} disabled={loading || !newCodes.trim()} className="w-full">
              {loading ? "导入中..." : "导入激活码"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Filters & Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4" />
                激活码列表
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedCodes.length > 0 && (
                <>
                  <span className="text-xs text-muted-foreground mr-1">已选 {selectedCodes.length} 项:</span>
                  <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950" onClick={() => handleChangeCodeStatus(selectedCodes, "available")}>
                    设为可用
                  </Button>
                  <Button variant="outline" size="sm" className="text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900" onClick={() => handleChangeCodeStatus(selectedCodes, "sold")}>
                    设为已售
                  </Button>
                  <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950" onClick={() => handleChangeCodeStatus(selectedCodes, "locked")}>
                    设为锁定
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                    删除
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCodes([])}>
                    取消
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="搜索激活码..."
                value={codesSearch}
                onChange={(e) => setCodesSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCodesSearch() }}
                className="font-mono text-sm"
              />
            </div>
            <select
              value={codesStatusFilter}
              onChange={(e) => handleCodesFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[120px]"
            >
              <option value="">全部状态</option>
              <option value="available">可用</option>
              <option value="sold">已售</option>
              <option value="locked">锁定</option>
            </select>
            {products.length > 0 && (
              <select
                value={codesProductFilter}
                onChange={(e) => handleCodesFilterChange("product", e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
              >
                <option value="">全部产品</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            )}
            <Button variant="outline" size="sm" onClick={handleCodesSearch} className="shrink-0 bg-transparent">
              搜索
            </Button>
          </div>

          {/* Select All */}
          {activationCodes.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={
                  selectedCodes.length > 0 &&
                  selectedCodes.length === activationCodes.length
                }
                onChange={() => {
                  if (selectedCodes.length === activationCodes.length) {
                    setSelectedCodes([])
                  } else {
                    setSelectedCodes(activationCodes.map((c) => c.id))
                  }
                }}
                className="rounded"
              />
              <span>全选当前页 ({activationCodes.length})</span>
            </div>
          )}

          {/* Codes Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium w-8"></th>
                    <th className="text-left p-3 font-medium">��活码</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">关联产品</th>
                    <th className="text-left p-3 font-medium">状态</th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">创建时间</th>
                    <th className="text-right p-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activationCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedCodes.includes(code.id)}
                          onChange={() => toggleCodeSelection(code.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm truncate max-w-[200px]">{code.code}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(code.code)}
                            className="h-6 w-6 p-0 opacity-50 hover:opacity-100 shrink-0"
                            title="复制"
                          >
                            <Key className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {(code as any).product_name || "通用"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className={statusColor(code.status)}>
                          {statusLabel(code.status)}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                        {new Date(code.created_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={code.status}
                          onChange={(e) => {
                            const newStatus = e.target.value
                            if (newStatus !== code.status) {
                              handleChangeCodeStatus([code.id], newStatus)
                            }
                          }}
                          className="px-2 py-1 text-xs border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                        >
                          <option value="available">可用</option>
                          <option value="sold">已售</option>
                          <option value="locked">锁定</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {activationCodes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">暂无激活码</p>
                <p className="text-xs mt-1">使用上方导入功能添加激活码</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              第 {codesPage} / {codesTotalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => loadCodes(codesPage - 1)} disabled={codesPage <= 1}>
                上一页
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadCodes(codesPage + 1)} disabled={codesPage >= codesTotalPages}>
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-destructive">确认删除</CardTitle>
              <CardDescription>确定要删除选中的 {selectedCodes.length} 个激活码吗？此操作不可撤销。</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="destructive" onClick={handleDeleteCodes} disabled={deleting} className="flex-1">
                {deleting ? "删除中..." : "确认删除"}
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1">
                取消
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  const loadEmailTemplate = async () => {
    setEmailTemplateLoading(true)
    try {
      const res = await fetch("/api/admin/email-template", {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setEmailTemplate({
          shop_name: data.shop_name || "",
          greeting_text: data.greeting_text || "",
          tips_text: data.tips_text || "",
          wechat_id: data.wechat_id || "",
          footer_text: data.footer_text || "",
          primary_color: data.primary_color || "#0f172a",
          custom_note: data.custom_note || "",
        })
        setEmailTemplateLoaded(true)
      }
    } catch (error) {
      console.error("[v0] Load email template error:", error)
    }
    setEmailTemplateLoading(false)
  }

  const saveEmailTemplate = async () => {
    setEmailTemplateSaving(true)
    try {
      const res = await fetch("/api/admin/email-template", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(emailTemplate),
      })
      if (res.ok) {
        setMessage("邮件模板已保存")
      } else {
        setMessage("保存失败，请重试")
      }
    } catch (error) {
      setMessage("保存失败，请重试")
    }
    setEmailTemplateSaving(false)
  }

  const sendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      setTestEmailResult({ ok: false, msg: "请输入有效的邮箱地址" })
      return
    }
    setTestEmailSending(true)
    setTestEmailResult(null)
    try {
      const res = await fetch("/api/admin/email-template/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ email: testEmailAddress }),
      })
      const data = await res.json()
      if (res.ok) {
        setTestEmailResult({ ok: true, msg: data.message || "测试邮件已发送" })
      } else {
        setTestEmailResult({ ok: false, msg: data.error || "发送失败" })
      }
    } catch {
      setTestEmailResult({ ok: false, msg: "网络错误，请重试" })
    }
    setTestEmailSending(false)
  }

  const exportTransactionLog = async (format: "json" | "csv" = "json") => {
    try {
      setLoading(true)
      setMessage("")

      const response = await fetch(`/api/admin/transaction-log?format=${format}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("导出失败")
      }

      if (format === "csv") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `transaction-log-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage("CSV交易日志已下载")
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `transaction-log-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage("JSON交易日志已下载")
      }
    } catch (error) {
      console.error("Export error:", error)
      setMessage("导出失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>激活码管理</span>
          </CardTitle>
          <CardDescription>激活码的导入和管理已移至"激活码管理"标签页</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setActiveTab("codes")} variant="outline">
            前往激活码管理
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>系统信息</span>
          </CardTitle>
          <CardDescription>当前系统的配置信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">系统版本</p>
                <p className="text-sm text-muted-foreground">v1.0.0 专业版</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">数据库状态</p>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  已连接
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">支付接口</p>
                <p className="text-sm text-muted-foreground">易支付 V1</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">邮件服务</p>
                <p className="text-sm text-muted-foreground">163 邮箱 SMTP</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {"支付方式设置"}
          </CardTitle>
          <CardDescription>{"启用或禁用可用的支付方式"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1677FF]/10 flex items-center justify-center">
                  <svg viewBox="0 0 1024 1024" className="w-6 h-6" fill="#1677FF">
                    <path d="M230.4 512c0-155.6 126-281.6 281.6-281.6s281.6 126 281.6 281.6-126 281.6-281.6 281.6S230.4 667.6 230.4 512zM512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{"支付宝"}</p>
                  <p className="text-sm text-muted-foreground">{"国内用户支付"}</p>
                </div>
              </div>
              <Switch
                checked={paymentConfig.alipay}
                onCheckedChange={(checked) => handlePaymentToggle("alipay", checked)}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#26A17B]/10 flex items-center justify-center">
                  <svg viewBox="0 0 32 32" className="w-6 h-6">
                    <circle cx="16" cy="16" r="16" fill="#26A17B"/>
                    <path fill="#fff" d="M17.9 17.9v-.003c-.109.008-.67.042-1.9.042-1.014 0-1.723-.03-1.965-.042v.003c-3.896-.168-6.8-1.15-6.8-2.32 0-1.17 2.904-2.15 6.8-2.32v3.69c.246.017.97.057 1.98.057 1.21 0 1.77-.047 1.885-.057V13.26c3.887.17 6.784 1.15 6.784 2.32 0 1.168-2.897 2.15-6.784 2.32zm0-5.02v-3.3h5.282V6H8.783v3.58h5.282v3.3c-4.405.202-7.7 1.42-7.7 2.9 0 1.48 3.295 2.698 7.7 2.9v10.36H18v-10.36c4.397-.202 7.687-1.42 7.687-2.9-.001-1.48-3.29-2.698-7.787-2.9z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{"USDT (TRC20)"}</p>
                  <p className="text-sm text-muted-foreground">{"加密货币支付"}</p>
                </div>
              </div>
              <Switch
                checked={paymentConfig.usdt}
                onCheckedChange={(checked) => handlePaymentToggle("usdt", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            {"工具设置"}
          </CardTitle>
          <CardDescription>{"启用或禁用网站工具功能"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">{"2FA 验证器"}</p>
                  <p className="text-sm text-muted-foreground">{"TOTP 双因素认证码生成工具"}</p>
                </div>
              </div>
              <Switch
                checked={toolsConfig.twofa}
                onCheckedChange={() => toggleTool("twofa")}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium">{"Gmail 检测"}</p>
                  <p className="text-sm text-muted-foreground">{"批量检测邮箱状态工具"}</p>
                </div>
              </div>
              <Switch
                checked={toolsConfig.gmailChecker}
                onCheckedChange={() => toggleTool("gmailChecker")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USDT Exchange Rate Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {"USDT 汇率设置"}
          </CardTitle>
          <CardDescription>{"设置人民币兑 USDT 的汇率"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">{"汇率 (1 USDT = ? CNY)"}</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    value={usdtRate}
                    onChange={(e) => setUsdtRate(e.target.value)}
                    placeholder="7.20"
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">{"CNY"}</span>
                </div>
              </div>
              <div className="flex-1 text-sm text-muted-foreground">
                <p>{"示例：商品价格 ¥72"}</p>
                <p>{"用户需支付: "}<span className="font-mono font-medium text-foreground">{(72 / Number(usdtRate || 7.2)).toFixed(2)} USDT</span></p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveUsdtRate}
              disabled={!usdtRate || Number(usdtRate) <= 0}
            >
              {"保存汇率"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            {"Telegram 通知"}
          </CardTitle>
          <CardDescription>{"订单成功后自动推送通知到 Telegram"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {"当有订单支付成功时，系统会自动发送订单信息和库存状态到您的 Telegram。"}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/telegram/test", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
                      body: JSON.stringify({ type: "order" }),
                    })
                    const data = await res.json()
                    setMessage(res.ok ? data.message : (data.error + (data.details ? `: ${data.details}` : "")))
                  } catch (err) { setMessage("发送失败") }
                }}
              >
                {"测试订单通知"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/telegram/test", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
                      body: JSON.stringify({ type: "stock" }),
                    })
                    const data = await res.json()
                    setMessage(res.ok ? data.message : (data.error + (data.details ? `: ${data.details}` : "")))
                  } catch (err) { setMessage("发送失败") }
                }}
              >
                {"测试库存预警"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/telegram/test", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
                      body: JSON.stringify({ type: "crypto" }),
                    })
                    const data = await res.json()
                    setMessage(res.ok ? data.message : (data.error + (data.details ? `: ${data.details}` : "")))
                  } catch (err) { setMessage("发送失败") }
                }}
              >
                {"测试USDT待验证"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    setMessage("正在生成每日报告...")
                    const res = await fetch("/api/admin/telegram/test", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
                      body: JSON.stringify({ type: "daily-report" }),
                    })
                    const data = await res.json()
                    setMessage(res.ok ? data.message : (data.error + (data.details ? `: ${data.details}` : "")))
                  } catch (err) { setMessage("发送失败") }
                }}
              >
                {"测试每日报告"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {"需要设置 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHAT_ID 环境变量"}
            </p>
            
            {/* Webhook Setup for Customer Support */}
            <div className="pt-4 border-t border-border mt-4">
              <h4 className="font-medium text-sm mb-2">{"在线客服 Webhook 设置"}</h4>
              <p className="text-xs text-muted-foreground mb-3">
                {"设置 Webhook 后，您可以在 Telegram 中直接回复客户消息"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/admin/telegram/setup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
                        body: JSON.stringify({ action: "set" }),
                      })
                      const data = await res.json()
                      setMessage(res.ok ? data.message : data.error)
                    } catch (err) { setMessage("设置失败") }
                  }}
                >
                  {"启用客服 Webhook"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/admin/telegram/setup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
                        body: JSON.stringify({ action: "info" }),
                      })
                      const data = await res.json()
                      if (res.ok && data.info) {
                        setMessage(`Webhook URL: ${data.info.url || "未设置"}`)
                      } else {
                        setMessage(data.error || "获取信息失败")
                      }
                    } catch (err) { setMessage("获取失败") }
                  }}
                >
                  {"查看状态"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {"Telegram 命令: /chats 查看会话, /reply ID 消息 回复"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Template Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                邮件模板编辑
              </CardTitle>
              <CardDescription className="mt-1">自定义激活码发送邮件的内容和样式</CardDescription>
            </div>
            {!emailTemplateLoaded ? (
              <Button variant="outline" size="sm" onClick={loadEmailTemplate} disabled={emailTemplateLoading}>
                {emailTemplateLoading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />加载中...</> : "加载模板"}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEmailPreviewMode(!emailPreviewMode)}
                >
                  {emailPreviewMode ? "编辑" : "预览"}
                </Button>
                <Button size="sm" onClick={saveEmailTemplate} disabled={emailTemplateSaving}>
                  {emailTemplateSaving ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />保存中...</> : "保存模板"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        {emailTemplateLoaded && (
          <CardContent>
            {emailPreviewMode ? (
              /* Preview Mode */
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/30 p-3 text-xs text-muted-foreground text-center border-b">
                  邮件预览 (示例数据)
                </div>
                <div className="bg-muted/10 p-6">
                  <div className="max-w-[480px] mx-auto">
                    {/* Preview Header */}
                    <div style={{ background: `linear-gradient(135deg, ${emailTemplate.primary_color} 0%, ${emailTemplate.primary_color}dd 100%)` }} className="rounded-t-xl p-8 text-center">
                      <h2 className="text-lg font-bold text-white">{emailTemplate.shop_name || "商城名称"}</h2>
                      <p className="text-white/70 text-sm mt-1">购买成功通知</p>
                    </div>
                    {/* Preview Body */}
                    <div className="bg-white p-6 rounded-b-xl shadow-sm space-y-4">
                      <p className="text-sm text-foreground leading-relaxed">{emailTemplate.greeting_text || "问候语..."}</p>

                      <div className="bg-muted/30 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">订单号：DEMO20260211001</p>
                        <p className="text-sm font-semibold mt-1">示例产品 Pro</p>
                      </div>

                      {emailTemplate.custom_note && (
                        <div className="border-l-4 rounded-r-lg p-3 bg-muted/20" style={{ borderColor: emailTemplate.primary_color }}>
                          <p className="text-sm whitespace-pre-wrap">{emailTemplate.custom_note}</p>
                        </div>
                      )}

                      <div className="border-2 border-dashed rounded-xl p-5 text-center bg-muted/10">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">您的激活码</p>
                        <p className="text-2xl font-bold font-mono tracking-wider" style={{ color: emailTemplate.primary_color }}>DEMO-XXXX-ABCD</p>
                      </div>

                      {emailTemplate.tips_text && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4">
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">使用提示</p>
                          <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1 list-disc pl-4">
                            {emailTemplate.tips_text.split("\n").filter((t: string) => t.trim()).map((t: string, i: number) => (
                              <li key={i}>{t.trim()}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {emailTemplate.wechat_id && (
                        <div className="border rounded-xl p-4 text-center">
                          <p className="text-xs text-muted-foreground">客服微信</p>
                          <p className="text-base font-semibold text-green-600 font-mono mt-1">{emailTemplate.wechat_id}</p>
                        </div>
                      )}
                    </div>
                    {/* Preview Footer */}
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground">{emailTemplate.footer_text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">&copy; 2026 {emailTemplate.shop_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">商城名称</Label>
                    <Input
                      value={emailTemplate.shop_name}
                      onChange={(e) => setEmailTemplate({ ...emailTemplate, shop_name: e.target.value })}
                      placeholder="例：小黑丸AI激活码商城"
                    />
                    <p className="text-xs text-muted-foreground">显示在邮件头部和底部</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">主题色</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={emailTemplate.primary_color}
                        onChange={(e) => setEmailTemplate({ ...emailTemplate, primary_color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={emailTemplate.primary_color}
                        onChange={(e) => setEmailTemplate({ ...emailTemplate, primary_color: e.target.value })}
                        placeholder="#0f172a"
                        className="font-mono text-sm flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">邮件头部背景和强调色</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">问候语</Label>
                  <Input
                    value={emailTemplate.greeting_text}
                    onChange={(e) => setEmailTemplate({ ...emailTemplate, greeting_text: e.target.value })}
                    placeholder="例：您好，感谢您的购买！您的激活码已准备就绪。"
                  />
                  <p className="text-xs text-muted-foreground">邮件正文开头的问候语</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">使用提示</Label>
                  <textarea
                    value={emailTemplate.tips_text}
                    onChange={(e) => setEmailTemplate({ ...emailTemplate, tips_text: e.target.value })}
                    placeholder={"每行一条提示，例如：\n请妥善保管您的激活码，切勿泄露给他人\n激活码仅限一次使用，使用后将自动失效"}
                    rows={4}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <p className="text-xs text-muted-foreground">每行一条提示，显示在激活码下方的提示框中</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">自定义备注 (可选)</Label>
                  <textarea
                    value={emailTemplate.custom_note}
                    onChange={(e) => setEmailTemplate({ ...emailTemplate, custom_note: e.target.value })}
                    placeholder="例如：使用激活码前请先下载最新版客户端..."
                    rows={3}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <p className="text-xs text-muted-foreground">显示为高亮提示块，留空则不显示。支持换行。</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">客��微信号</Label>
                    <Input
                      value={emailTemplate.wechat_id}
                      onChange={(e) => setEmailTemplate({ ...emailTemplate, wechat_id: e.target.value })}
                      placeholder="例：xbbdkj-com"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">留空则不显示客服微信模块</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">页脚文字</Label>
                    <Input
                      value={emailTemplate.footer_text}
                      onChange={(e) => setEmailTemplate({ ...emailTemplate, footer_text: e.target.value })}
                      placeholder="例：此邮件由系统自动发送，请勿回复"
                    />
                    <p className="text-xs text-muted-foreground">邮件最底部的小字提示</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-xs text-muted-foreground">修改后请点击"保存模板"，下次发送邮件将使用新模板</p>
                  <Button onClick={saveEmailTemplate} disabled={emailTemplateSaving}>
                    {emailTemplateSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</> : "保存模板"}
                  </Button>
                </div>
              </div>
            )}

            {/* Test Email Section */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">发送测试邮件</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                发送一封包含示例数据的测试邮件到指定邮箱，检查当前模板的实际显示效果。请先保存模板再测试。
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="email"
                  placeholder="输入接收测试邮件的邮箱地址"
                  value={testEmailAddress}
                  onChange={(e) => { setTestEmailAddress(e.target.value); setTestEmailResult(null) }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !testEmailSending) sendTestEmail() }}
                  className="flex-1 text-sm"
                  disabled={testEmailSending}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendTestEmail}
                  disabled={testEmailSending || !testEmailAddress.trim()}
                  className="shrink-0"
                >
                  {testEmailSending ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" />发送中</>
                  ) : (
                    <><Send className="w-3 h-3 mr-1" />发送测试</>
                  )}
                </Button>
              </div>
              {testEmailResult && (
                <div className={`mt-3 text-sm px-3 py-2 rounded-md ${
                  testEmailResult.ok
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                }`}>
                  {testEmailResult.ok ? (
                    <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" />{testEmailResult.msg}</span>
                  ) : (
                    <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{testEmailResult.msg}</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            交易日志导出
          </CardTitle>
          <CardDescription>导出完整的交易记录和统计数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={() => exportTransactionLog("json")} disabled={loading} className="flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              导出JSON格式
            </Button>
            <Button
              onClick={() => exportTransactionLog("csv")}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              导出CSV格式
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">包含所有订单、支付状态、激活码分配记录和收入统计</p>
        </CardContent>
      </Card>
    </div>
  )

  // ========== Product Handlers ==========
  const handleCreateProduct = async () => {
    if (!productForm.name || !productForm.price) {
      setMessage("请填写产品名称和价格")
      return
    }
    setProductLoading(true)
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(productForm),
      })
      if (response.ok) {
        setMessage("产品创建成功")
        setShowProductForm(false)
        setProductForm({ name: "", description: "", details: "", price: "", original_price: "", sku: "", sort_order: "0", delivery_type: "auto", price_tiers: [], category_id: undefined, region_options: [], require_region_selection: false, image_url: "" })
        loadData()
      } else {
        setMessage("创建产品失败")
      }
    } catch (error) {
      setMessage("创建产品失败")
    }
    setProductLoading(false)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return
    setProductLoading(true)
    try {
      const payload = { id: editingProduct.id, ...productForm }
      console.log("[v0] Updating product with payload:", payload)
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      console.log("[v0] Update response:", result)
      if (response.ok) {
        setMessage("产品更新成功")
        setEditingProduct(null)
        setShowProductForm(false)
        setProductForm({ name: "", description: "", details: "", price: "", original_price: "", sku: "", sort_order: "0", delivery_type: "auto", price_tiers: [], category_id: undefined, region_options: [], require_region_selection: false, image_url: "" })
        loadData()
      } else {
        console.error("[v0] Update failed:", result)
        setMessage("更新产品失败: " + (result.error || "未知错误"))
      }
    } catch (error) {
      console.error("[v0] Update error:", error)
      setMessage("更新产品失败")
    }
    setProductLoading(false)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("确定要删除此产品吗？关联的激活码将不会被删除。")) return
    try {
      const response = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        setMessage("产品已�����除")
        loadData()
      } else {
        setMessage("删除产品失败")
      }
    } catch (error) {
      setMessage("删除产品失败")
    }
  }

  const handleToggleProductStatus = async (product: Product) => {
    const newStatus = product.status === "active" ? "inactive" : "active"
    try {
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ id: product.id, status: newStatus }),
      })
      if (response.ok) {
        setMessage(`产品已${newStatus === "active" ? "上架" : "下架"}`)
        loadData()
      }
    } catch (error) {
      setMessage("操作失败")
    }
  }

  const startEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description || "",
      details: parseDetailsToHtml((product as any).details || ""),
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      sku: product.sku || "",
      sort_order: product.sort_order?.toString() || "0",
      delivery_type: (product as any).delivery_type || "auto",
      price_tiers: (product as any).price_tiers || [],
      category_id: (product as any).category_id || undefined,
      region_options: product.region_options || [],
      require_region_selection: product.require_region_selection || false,
      image_url: (product as any).image_url || "",
    })
    setShowProductForm(true)
  }

  // Category management functions
  const handleCreateCategory = async () => {
    if (!categoryForm.name) {
      setMessage("请填写分类名称")
      return
    }
    setCategoryLoading(true)
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(categoryForm),
      })
      if (response.ok) {
        setMessage("分类创建成功")
        setShowCategoryForm(false)
        setCategoryForm({ name: "", slug: "", icon: "", sort_order: "0", payment_name: "" })
        loadData()
      } else {
        const data = await response.json()
        setMessage(data.error || "创建分类失败")
      }
    } catch (err) {
      setMessage("创建分类失败")
    }
    setCategoryLoading(false)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return
    setCategoryLoading(true)
    try {
      const response = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ id: editingCategory.id, ...categoryForm }),
      })
      if (response.ok) {
        setMessage("分类更新成功")
        setEditingCategory(null)
        setShowCategoryForm(false)
        setCategoryForm({ name: "", slug: "", icon: "", sort_order: "0", payment_name: "" })
        loadData()
      } else {
        setMessage("更新分类失败")
      }
    } catch (err) {
      setMessage("更新分类失败")
    }
    setCategoryLoading(false)
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("确定要删除这个分类吗？该分类下的产品将变为未分类。")) return
    try {
      const response = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      if (response.ok) {
        setMessage("分类已删除")
        loadData()
      } else {
        setMessage("删除分类失败")
      }
    } catch (err) {
      setMessage("删除分类失败")
    }
  }

const startEditCategory = (category: { id: string; name: string; slug: string; icon?: string; sort_order?: number; payment_name?: string }) => {
  setEditingCategory(category)
  setCategoryForm({
  name: category.name,
  slug: category.slug,
  icon: category.icon || "",
  sort_order: category.sort_order?.toString() || "0",
  payment_name: category.payment_name || "",
  })
  setShowCategoryForm(true)
  }

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{"分类列表"}</h2>
          <p className="text-sm text-muted-foreground">{"管理产品分类，方便用户快速筛选"}</p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setCategoryForm({ name: "", slug: "", icon: "", sort_order: "0", payment_name: "" }); setShowCategoryForm(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          {"添加分类"}
        </Button>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCategory ? "编辑分类" : "添加分类"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{"分类名称"}</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="如：游戏账号"
                />
              </div>
              <div>
                <Label>{"Slug (URL标识)"}</Label>
                <Input
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="如：game-accounts (留空自动生成)"
                />
              </div>
              <div>
                <Label>{"图标 (Emoji)"}</Label>
                <Input
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  placeholder="如：🎮"
                />
              </div>
              <div>
                <Label>{"排序权重"}</Label>
                <Input
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2">
                <Label>{"支付显示名称"}</Label>
                <Input
                  value={categoryForm.payment_name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, payment_name: e.target.value })}
                  placeholder="如：数字商品、会员服务（用于支付平台显示，避免内容审核）"
                />
                <p className="text-xs text-muted-foreground mt-1">{"该分类下产品在支付平台显示的通用名称，留空则使用全局默认值"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory} disabled={categoryLoading}>
                {categoryLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{"处理中..."}</> : (editingCategory ? "更新分类" : "创建分类")}
              </Button>
              <Button variant="outline" onClick={() => { setShowCategoryForm(false); setEditingCategory(null) }}>
                {"取消"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      {productCategories.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {"暂无分类，点击上方按钮添加"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {productCategories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                    {category.icon || "📁"}
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{"Slug: "}{category.slug}</span>
                      <span>{"产品数: "}{category.product_count}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEditCategory(category)}>
                    <Pencil className="w-3 h-3 mr-1" />
                    {"编辑"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    {"删除"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">产品列表</h2>
          <p className="text-sm text-muted-foreground">管理可销售的产品品类</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setProductForm({ name: "", description: "", details: "", price: "", original_price: "", sku: "", sort_order: "0", delivery_type: "auto", price_tiers: [], category_id: undefined, region_options: [], require_region_selection: false, image_url: "" }); setShowProductForm(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          添加产品
        </Button>
      </div>

      {showProductForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingProduct ? "编辑产品" : "添加新产品"}</CardTitle>
            <CardDescription>{editingProduct ? "修改产品信息" : "创建一个新的可销售产品"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>产品名称 *</Label>
                <Input
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="例如: ChatGPT Plus 激活码"
                />
              </div>
              <div>
                <Label>SKU编码</Label>
                <Input
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  placeholder="例如: CHATGPT-PLUS"
                />
              </div>
              <div className="md:col-span-2">
                <Label>产品图片 URL</Label>
                <Input
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  placeholder="https://example.com/image.png"
                />
                {productForm.image_url && (
                  <div className="mt-2">
                    <img
                      src={productForm.image_url}
                      alt="产品图片预览"
                      className="max-h-32 rounded-lg border border-border object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
              </div>
              <div>
                <Label>销售价格 (元) *</Label>
                <Input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="99"
                  step="0.01"
                />
              </div>
              <div>
                <Label>原价 (元)</Label>
                <Input
                  type="number"
                  value={productForm.original_price}
                  onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                  placeholder="129"
                  step="0.01"
                />
              </div>
              <div>
                <Label>排序权重</Label>
                <Input
                  type="number"
                  value={productForm.sort_order}
                  onChange={(e) => setProductForm({ ...productForm, sort_order: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>{"产品分类"}</Label>
                <select
                  value={productForm.category_id || ""}
                  onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value || undefined })}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{"未分类"}</option>
                  {productCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Delivery Type */}
            <div>
              <Label>{"发货方式"}</Label>
              <select
                value={productForm.delivery_type}
                onChange={(e) => setProductForm({ ...productForm, delivery_type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="auto">{"自动发货（支付后自动分配激活码）"}</option>
                <option value="manual">{"手动发货（支付后人工处理）"}</option>
              </select>
              {productForm.delivery_type === "manual" && (
                <p className="text-xs text-amber-600 mt-1">{"人工发货模式：用户下单后需要您在后台手动发货，适用于成品账号等时效性商品"}</p>
              )}
            </div>

            {/* Price Tiers */}
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{"阶梯定价（选填）"}</p>
                  <p className="text-xs text-muted-foreground">{"购买不同数量时享受不同价格"}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProductForm({ ...productForm, price_tiers: [...productForm.price_tiers, { min_qty: 2, price: 0 }] })}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {"添加"}
                </Button>
              </div>
              {productForm.price_tiers.length > 0 && (
                <div className="space-y-2">
                  {productForm.price_tiers.map((tier, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-xs text-muted-foreground shrink-0">{">="}</span>
                        <input
                          type="number"
                          min={2}
                          value={tier.min_qty}
                          onChange={(e) => {
                            const newTiers = [...productForm.price_tiers]
                            newTiers[index] = { ...newTiers[index], min_qty: parseInt(e.target.value) || 2 }
                            setProductForm({ ...productForm, price_tiers: newTiers })
                          }}
                          className="w-16 px-2 py-1.5 border border-input bg-background rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">{"个时，单价"}</span>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={tier.price}
                          onChange={(e) => {
                            const newTiers = [...productForm.price_tiers]
                            newTiers[index] = { ...newTiers[index], price: parseFloat(e.target.value) || 0 }
                            setProductForm({ ...productForm, price_tiers: newTiers })
                          }}
                          className="w-24 px-2 py-1.5 border border-input bg-background rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">{"元"}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setProductForm({ ...productForm, price_tiers: productForm.price_tiers.filter((_, i) => i !== index) })}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Region Options */}
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={productForm.require_region_selection}
                    onCheckedChange={(checked) => setProductForm({ ...productForm, require_region_selection: checked })}
                  />
                  <div>
                    <p className="text-sm font-medium">{"区域选择（适用于 Apple ID 等多区域商品）"}</p>
                    <p className="text-xs text-muted-foreground">{"开启后用户需选择区域才能下单"}</p>
                  </div>
                </div>
              </div>
              {productForm.require_region_selection && (
                <>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProductForm({ ...productForm, region_options: [...(productForm.region_options || []), { code: "", name: "", price: undefined }] })}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {"添加区域"}
                    </Button>
                  </div>
                  {(productForm.region_options?.length || 0) > 0 && (
                    <div className="space-y-2">
                      {(productForm.region_options || []).map((region, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border border-border">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={region.code}
                              onChange={(e) => {
                                const newRegions = [...(productForm.region_options || [])]
                                newRegions[index] = { ...newRegions[index], code: e.target.value }
                                setProductForm({ ...productForm, region_options: newRegions })
                              }}
                              placeholder="区域代码 (如 US)"
                              className="px-2 py-1.5 border border-input bg-background rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <input
                              type="text"
                              value={region.name}
                              onChange={(e) => {
                                const newRegions = [...(productForm.region_options || [])]
                                newRegions[index] = { ...newRegions[index], name: e.target.value }
                                setProductForm({ ...productForm, region_options: newRegions })
                              }}
                              placeholder="显示名称 (如 美国)"
                              className="px-2 py-1.5 border border-input bg-background rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={region.price ?? ""}
                              onChange={(e) => {
                                const newRegions = [...(productForm.region_options || [])]
                                newRegions[index] = { ...newRegions[index], price: e.target.value ? parseFloat(e.target.value) : undefined }
                                setProductForm({ ...productForm, region_options: newRegions })
                              }}
                              placeholder="价格 (留空用默认)"
                              className="px-2 py-1.5 border border-input bg-background rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setProductForm({ ...productForm, region_options: (productForm.region_options || []).filter((_, i) => i !== index) })}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(productForm.region_options?.length || 0) === 0 && (
                    <p className="text-xs text-amber-600">{"请添加至少一个区域选项"}</p>
                  )}
                </>
              )}
            </div>

            <div>
              <Label>{"产品简介"}</Label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="一句话描述产品，显示在产品卡片上"
                className="w-full h-20 p-3 border border-input bg-background text-sm rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <Label>产品详情（图文教程）</Label>
              <p className="text-xs text-muted-foreground mb-2">支持直接粘贴或拖拽图片，可使用 Markdown 快捷键</p>
              <TiptapEditor
                value={productForm.details}
                onChange={(html) => setProductForm({ ...productForm, details: html })}
                placeholder="开始编写产品详情...&#10;&#10;可直接粘贴截图或拖拽图片上传"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={editingProduct ? handleUpdateProduct : handleCreateProduct} disabled={productLoading}>
                {productLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingProduct ? "保存修改" : "创建产品"}
              </Button>
              <Button variant="outline" onClick={() => { setShowProductForm(false); setEditingProduct(null) }}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">暂无产品</p>
            <p className="text-sm text-muted-foreground mb-4">��加产品后，用户可以在前端选择购买</p>
            <Button onClick={() => setShowProductForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加第一个产品
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id} className={product.status === "inactive" ? "opacity-60" : ""}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                      <Badge variant={product.status === "active" ? "default" : "secondary"}>
                        {product.status === "active" ? "上架中" : "已下架"}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${(product as any).delivery_type === "manual" ? "border-amber-500/50 text-amber-600" : "border-emerald-500/50 text-emerald-600"}`}>
                        {(product as any).delivery_type === "manual" ? "人工发货" : "自动发货"}
                      </Badge>
                      {(product as any).price_tiers?.length > 0 && (
                        <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-600">
                          {"阶梯价"}
                        </Badge>
                      )}
                      {product.sku && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {product.sku}
                        </Badge>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-foreground">
                        ¥{product.price}
                        {product.original_price && (
                          <span className="text-muted-foreground line-through ml-2">¥{product.original_price}</span>
                        )}
                      </span>
                      <span className="text-muted-foreground">
                        {"库存: "}
                        {(product as any).delivery_type === "manual" ? (
                          <span className="text-blue-500 font-medium">{"按需"}</span>
                        ) : (
                          <span className={Number(product.stock_count) > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{product.stock_count || 0}</span>
                        )}
                      </span>
                      <span className="text-muted-foreground">排序: {product.sort_order}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleToggleProductStatus(product)}>
                      {product.status === "active" ? "下架" : "上架"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => startEditProduct(product)}>
                      <Pencil className="w-3 h-3 mr-1" />
                      编辑
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard()
      case "orders":
        return renderOrders()
      case "products":
        return renderProducts()
      case "categories":
        return renderCategories()
      case "codes":
        return renderCodes()
      case "finance":
        return <FinancePanel adminToken={adminToken} />
      case "blog":
        return <BlogManager adminToken={adminToken} />
      case "affiliates":
        return <AffiliateManager adminToken={adminToken} />
      case "settings":
        return renderSettings()
      default:
        return renderDashboard()
    }
  }

  const handleDeleteOrders = async () => {
    if (selectedOrders.length === 0) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ orderIds: selectedOrders }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(result.message)
        setSelectedOrders([])
        setShowOrderDeleteConfirm(false)
        loadOrders(ordersPage)
      } else {
        setMessage(`删除失败: ${result.error}`)
      }
    } catch (error) {
      setMessage("删除订单失败，请重试")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOrdersFilterChange = (type: string, value: string) => {
    if (type === "status") {
      setOrdersStatusFilter(value)
      setSelectedOrders([])
      loadOrders(1, value, ordersProductFilter, ordersSearch)
    } else if (type === "product") {
      setOrdersProductFilter(value)
      setSelectedOrders([])
      loadOrders(1, ordersStatusFilter, value, ordersSearch)
    }
  }

  const handleOrdersSearch = () => {
    setSelectedOrders([])
    loadOrders(1, ordersStatusFilter, ordersProductFilter, ordersSearch)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-grid-pattern">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">管理员登录</CardTitle>
            <CardDescription>激活码销售系统 - 专业版后台</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                管理员密码
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError("") }}
                onKeyDown={(e) => e.key === "Enter" && !loginLoading && handleLogin()}
                placeholder="请输入管理员密码"
                className="h-12"
                disabled={loginLoading}
              />
            </div>
            <Button onClick={handleLogin} className="w-full h-12 text-base font-medium" disabled={loginLoading || !password}>
              {loginLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{"验证中..."}</>
              ) : (
                "登录管理后台"
              )}
            </Button>
            {loginError && (
              <Alert className="border-destructive bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-grid-pattern">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Activity className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <div className="text-xl font-semibold">加载管理数据中</div>
            <div className="text-sm text-muted-foreground">正在获取最新的系统数据...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background bg-grid-pattern flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-card/50 backdrop-blur-sm">
          <h1 className="text-lg sm:text-xl font-bold truncate">管理后台</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-h-[40px] min-w-[40px] touch-manipulation"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="border-b bg-card shadow-lg">
            <AdminSidebar
              activeTab={activeTab}
              onTabChange={(tab) => {
                handleTabChange(tab)
                setMobileMenuOpen(false)
              }}
              onLogout={handleLogout}
              stats={stats}
            />
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} onLogout={handleLogout} stats={stats} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="admin-header p-3 sm:p-4 lg:p-6 bg-card/30 backdrop-blur-sm border-b">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground truncate">
                  {activeTab === "dashboard" && "仪表板"}
                  {activeTab === "orders" && "订单管理"}
                  {activeTab === "products" && "产品管理"}
                  {activeTab === "categories" && "分类管理"}
                  {activeTab === "codes" && "激活码管理"}
                  {activeTab === "finance" && "财务管理"}
                {activeTab === "blog" && "博客管理"}
                {activeTab === "affiliates" && "推广管理"}
                {activeTab === "settings" && "系统设置"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {activeTab === "dashboard" && "系统概览和关键指标"}
                  {activeTab === "orders" && "查看和管理所有订单"}
                  {activeTab === "products" && "管理可销售的产品品类"}
                  {activeTab === "categories" && "管理产品分类"}
                  {activeTab === "codes" && "管理激活码库存"}
                  {activeTab === "finance" && "进销存与利润分析"}
                {activeTab === "blog" && "创建和管理博客文章"}
                {activeTab === "affiliates" && "管理推广链接和合作伙伴"}
                {activeTab === "settings" && "系统配置和设置"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={loadData}
                disabled={dataLoading}
                size="sm"
                className="shrink-0 bg-transparent min-h-[36px] sm:min-h-[40px] touch-manipulation whitespace-nowrap"
              >
                {dataLoading ? "刷新中..." : "刷新数据"}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">{renderContent()}</main>
      </div>
    </div>
  )
}
