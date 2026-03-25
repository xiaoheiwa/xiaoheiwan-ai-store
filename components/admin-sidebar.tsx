"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, ShoppingCart, Key, Settings, LogOut, Menu, X, Box, FileText, TrendingUp, Link2, FolderTree, Megaphone } from "lucide-react"

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  stats?: {
    totalOrders: number
    stockCount: number
  }
}

export function AdminSidebar({ activeTab, onTabChange, onLogout, stats }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    {
      id: "dashboard",
      label: "仪表板",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "orders",
      label: "订单管理",
      icon: ShoppingCart,
      badge: stats?.totalOrders || 0,
    },
    {
      id: "products",
      label: "产品管理",
      icon: Box,
      badge: null,
    },
    {
      id: "categories",
      label: "分类管理",
      icon: FolderTree,
      badge: null,
    },
    {
      id: "codes",
      label: "激活码管理",
      icon: Key,
      badge: stats?.stockCount || 0,
    },
    {
      id: "finance",
      label: "财务管理",
      icon: TrendingUp,
      badge: null,
    },
    {
      id: "blog",
      label: "博客管理",
      icon: FileText,
      badge: null,
    },
    {
      id: "affiliates",
      label: "推广管理",
      icon: Link2,
      badge: null,
    },
    {
      id: "notifications",
      label: "通知公告",
      icon: Megaphone,
      badge: null,
    },
    {
      id: "settings",
      label: "系统设置",
      icon: Settings,
      badge: null,
    },
  ]

  return (
    <div className={`admin-sidebar flex flex-col h-full transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}>
      <div className="admin-header p-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg">激活码管理</h2>
              <p className="text-xs text-muted-foreground">专业版后台</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="p-2">
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start h-12 ${isCollapsed ? "px-3" : "px-4"} ${
                isActive ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted"
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== null && (
                    <Badge variant={isActive ? "secondary" : "outline"} className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={`w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10 ${
            isCollapsed ? "px-3" : "px-4"
          }`}
          onClick={onLogout}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"}`} />
          {!isCollapsed && <span>退出登录</span>}
        </Button>
      </div>
    </div>
  )
}
