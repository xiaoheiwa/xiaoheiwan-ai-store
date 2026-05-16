"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, Plus, Trash2, RefreshCw, UserCheck } from "lucide-react"

interface BlacklistItem {
  id: number
  type: string
  value: string
  reason: string
  blocked_orders: number
  created_by: string
  created_at: string
  expires_at: string | null
}

interface WhitelistItem {
  id: number
  type: string
  value: string
  reason: string
  created_by: string
  created_at: string
  expires_at: string | null
}

interface RiskLog {
  id: number
  order_no: string
  email: string
  client_ip: string
  fingerprint: string
  risk_type: string
  risk_reason: string
  risk_score: number
  created_at: string
}

interface RiskConfig {
  config_key: string
  config_value: string
  description: string
}

export function RiskControlPanel() {
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([])
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([])
  const [logs, setLogs] = useState<RiskLog[]>([])
  const [configs, setConfigs] = useState<RiskConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("blacklist")
  
  const [newType, setNewType] = useState<string>("email")
  const [newValue, setNewValue] = useState("")
  const [newReason, setNewReason] = useState("")
  const [adding, setAdding] = useState(false)
  
  // 白名单表单
  const [newWhitelistValue, setNewWhitelistValue] = useState("")
  const [newWhitelistReason, setNewWhitelistReason] = useState("")
  const [addingWhitelist, setAddingWhitelist] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [blacklistRes, whitelistRes, logsRes, configsRes] = await Promise.all([
        fetch("/api/admin/risk/blacklist"),
        fetch("/api/admin/risk/whitelist"),
        fetch("/api/admin/risk/logs"),
        fetch("/api/admin/risk/config")
      ])
      
      if (blacklistRes.ok) {
        const data = await blacklistRes.json()
        setBlacklist(data.data || [])
      }
      if (whitelistRes.ok) {
        const data = await whitelistRes.json()
        setWhitelist(data.data || [])
      }
      if (logsRes.ok) {
        const data = await logsRes.json()
        setLogs(data.data || [])
      }
      if (configsRes.ok) {
        const data = await configsRes.json()
        setConfigs(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch risk data:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddBlacklist = async () => {
    if (!newValue.trim() || !newReason.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/admin/risk/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType, value: newValue, reason: newReason })
      })
      if (res.ok) {
        setNewValue("")
        setNewReason("")
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add to blacklist:", error)
    }
    setAdding(false)
  }

  const handleRemoveBlacklist = async (type: string, value: string) => {
    if (!confirm(`确定要移除 ${value} 吗？`)) return
    try {
      await fetch("/api/admin/risk/blacklist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value })
      })
      fetchData()
    } catch (error) {
      console.error("Failed to remove from blacklist:", error)
    }
  }
  
  // 白名单操作
  const handleAddWhitelist = async () => {
    if (!newWhitelistValue.trim()) return
    setAddingWhitelist(true)
    try {
      const res = await fetch("/api/admin/risk/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", value: newWhitelistValue, reason: newWhitelistReason || "管理员手动添加" })
      })
      if (res.ok) {
        setNewWhitelistValue("")
        setNewWhitelistReason("")
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add to whitelist:", error)
    }
    setAddingWhitelist(false)
  }

  const handleRemoveWhitelist = async (value: string) => {
    if (!confirm(`确定要移除 ${value} 的白名单吗？`)) return
    try {
      await fetch("/api/admin/risk/whitelist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", value })
      })
      fetchData()
    } catch (error) {
      console.error("Failed to remove from whitelist:", error)
    }
  }

  const handleUpdateConfig = async (key: string, value: string) => {
    try {
      await fetch("/api/admin/risk/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      })
      fetchData()
    } catch (error) {
      console.error("Failed to update config:", error)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      email: "邮箱",
      ip: "IP地址",
      fingerprint: "设备指纹",
      email_domain: "邮箱域名"
    }
    return labels[type] || type
  }

  const getRiskTypeBadge = (type: string) => {
    switch (type) {
      case "blocked":
        return <Badge variant="destructive">已拦截</Badge>
      case "suspicious":
        return <Badge className="bg-orange-500">可疑</Badge>
      case "warning":
        return <Badge variant="secondary">警告</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="font-medium">风控系统</span>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              黑名单
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blacklist.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-500" />
              白名单
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{whitelist.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              今日拦截
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => l.risk_type === "blocked" && new Date(l.created_at).toDateString() === new Date().toDateString()).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              今日警告
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => l.risk_type !== "blocked" && new Date(l.created_at).toDateString() === new Date().toDateString()).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${configs.find(c => c.config_key === "risk_control_enabled")?.config_value === "true" ? "text-green-600" : "text-red-600"}`}>
              {configs.find(c => c.config_key === "risk_control_enabled")?.config_value === "true" ? "已启用" : "已禁用"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="blacklist">黑名单</TabsTrigger>
          <TabsTrigger value="whitelist">白名单</TabsTrigger>
          <TabsTrigger value="logs">风控日志</TabsTrigger>
          <TabsTrigger value="config">配置</TabsTrigger>
        </TabsList>

        <TabsContent value="blacklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">添加黑名单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">邮箱</SelectItem>
                    <SelectItem value="ip">IP地址</SelectItem>
                    <SelectItem value="email_domain">邮箱域名</SelectItem>
                    <SelectItem value="fingerprint">设备指纹</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={newType === "email" ? "example@gmail.com" : newType === "ip" ? "192.168.1.1" : "值"}
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="拉黑原因"
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddBlacklist} disabled={adding || !newValue || !newReason}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">黑名单列表</CardTitle>
              <CardDescription>共 {blacklist.length} 条</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : blacklist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无记录</div>
              ) : (
                <div className="space-y-2">
                  {blacklist.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/50 rounded-lg gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
                        <span className="font-mono text-sm break-all">{item.value}</span>
                        <span className="text-sm text-muted-foreground">{item.reason}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">拦截 {item.blocked_orders} 次</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveBlacklist(item.type, item.value)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelist" className="space-y-4">
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-500" />
                添加白名单
              </CardTitle>
              <CardDescription>白名单用户将跳过所有风控检查，用于解除被误风控的用户</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="用户邮箱"
                  value={newWhitelistValue}
                  onChange={e => setNewWhitelistValue(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="原因（可选）"
                  value={newWhitelistReason}
                  onChange={e => setNewWhitelistReason(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddWhitelist} disabled={addingWhitelist || !newWhitelistValue.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">白名单列表</CardTitle>
              <CardDescription>这些用户将跳过所有风控检查</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : whitelist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无白名单</div>
              ) : (
                <div className="space-y-2">
                  {whitelist.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-green-200 bg-green-50 dark:bg-green-950/30 rounded-lg gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500">邮箱</Badge>
                          <span className="font-mono text-sm">{item.value}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.reason} | 添加于 {new Date(item.created_at).toLocaleString("zh-CN")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWhitelist(item.value)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">风控日志</CardTitle>
              <CardDescription>最近 100 条</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无日志</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map(log => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/50 rounded-lg gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getRiskTypeBadge(log.risk_type)}
                        <span className="text-sm">{log.email}</span>
                        {log.client_ip && <span className="text-xs text-muted-foreground font-mono">{log.client_ip}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground truncate max-w-xs">{log.risk_reason}</span>
                        <Badge variant="outline">分数 {log.risk_score}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">风控配置</CardTitle>
              <CardDescription>调整风控参数，修改后立即生效</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : (
                <div className="space-y-6">
                  {/* 总开关 */}
                  <div className="p-4 border-2 border-blue-500/50 bg-blue-500/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-blue-600">风控系统总开关</div>
                        <div className="text-xs text-muted-foreground">关闭后所有风控规则失效</div>
                      </div>
                      {configs.find(c => c.config_key === "risk_control_enabled") && (
                        <Select
                          value={configs.find(c => c.config_key === "risk_control_enabled")?.config_value || "true"}
                          onValueChange={value => handleUpdateConfig("risk_control_enabled", value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">开启</SelectItem>
                            <SelectItem value="false">关闭</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  {/* 高风险审核开关 */}
                  <div className="p-4 border-2 border-amber-500/50 bg-amber-500/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-amber-600">高风险订单人工审核（防代付诈骗）</div>
                        <div className="text-xs text-muted-foreground">开启后，高风险订单支付成功但需人工审核才发货</div>
                      </div>
                      {configs.find(c => c.config_key === "high_risk_review_enabled") && (
                        <Select
                          value={configs.find(c => c.config_key === "high_risk_review_enabled")?.config_value || "true"}
                          onValueChange={value => handleUpdateConfig("high_risk_review_enabled", value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">开启</SelectItem>
                            <SelectItem value="false">关闭</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  {/* 下单拦截规则 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">下单拦截规则</span>
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">触发后直接拒绝下单</span>
                    </div>
                    {configs
                      .filter(c => ["max_orders_per_email_per_day", "max_orders_per_ip_per_hour", "max_pending_orders_per_email", "block_disposable_emails"].includes(c.config_key))
                      .map(config => (
                        <div key={config.config_key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg gap-2">
                          <div>
                            <div className="text-sm">{config.description?.replace(/【.*】/, "") || config.config_key}</div>
                            <div className="text-xs text-muted-foreground font-mono">{config.config_key}</div>
                          </div>
                          {config.config_value === "true" || config.config_value === "false" ? (
                            <Select
                              value={config.config_value}
                              onValueChange={value => handleUpdateConfig(config.config_key, value)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">开启</SelectItem>
                                <SelectItem value="false">关闭</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type="number"
                              value={config.config_value}
                              onChange={e => handleUpdateConfig(config.config_key, e.target.value)}
                              className="w-20 text-center"
                            />
                          )}
                        </div>
                      ))}
                  </div>

                  {/* 高风险判定规则（支付后审核） */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">高风险判定规则</span>
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded">触发后需人工审核发货</span>
                    </div>
                    {configs
                      .filter(c => c.config_key.startsWith("high_risk_") && !["high_risk_review_enabled"].includes(c.config_key))
                      .map(config => (
                        <div key={config.config_key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg gap-2">
                          <div>
                            <div className="text-sm">{config.description?.replace(/【.*】/, "") || config.config_key}</div>
                            <div className="text-xs text-muted-foreground font-mono">{config.config_key}</div>
                          </div>
                          <Input
                            type="number"
                            value={config.config_value}
                            onChange={e => handleUpdateConfig(config.config_key, e.target.value)}
                            className="w-20 text-center"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
