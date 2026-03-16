# AI Service Activation Code Platform

一个现代化的 AI 服务激活码销售平台，支持 Claude Pro、ChatGPT Plus、Grok Premium 等 AI 服务的激活码自动发货。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791)

## 演示

- 在线演示: [upgrade.xiaoheiwan.com](https://upgrade.xiaoheiwan.com)
- 购买授权: Telegram [@jialiao2025](https://t.me/jialiao2025)

## 功能特性

### 核心功能
- **多产品支持** - 支持 Claude、ChatGPT、Grok、Apple ID 等多种商品
- **多支付方式** - 支持支付宝、微信、USDT (TRC20) 加密货币支付
- **自动发货** - 支付成功后自动发送激活码到邮箱
- **人工发货** - 支持需要人工处理的商品（如 Apple ID）
- **区域选择** - 支持多区域商品（如不同国家的 Apple ID），可设置区域专属价格
- **阶梯定价** - 支持批量购买折扣价格

### 后台管理
- **商品管理** - 添加、编辑、删除商品和激活码库存
- **订单管理** - 查看订单详情、手动发货、订单筛选
- **分类管理** - 商品分类和排序
- **支付配置** - 多支付通道配置
- **财务统计** - 销售数据、收入统计图表
- **博客系统** - 内置博客管理，支持 AI 辅助写作

### 通知系统
- **Telegram Bot** - 订单通知、库存预警、每日销售报告
- **邮件通知** - 自动发送激活码到用户邮箱
- **Webhook** - 支持 Telegram Bot 命令交互

### 其他特性
- **域名授权** - 内置授权验证系统，保护源代码
- **在线客服** - 内置实时聊天客服系统
- **SEO 优化** - 完整的 SEO 配置和结构化数据
- **响应式设计** - 完美支持移动端和桌面端
- **深色模式** - 支持明暗主题切换

## 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: PostgreSQL (Neon)
- **缓存**: Upstash Redis
- **样式**: Tailwind CSS v4 + shadcn/ui
- **邮件**: Resend
- **支付**: 虎皮椒 / ZPayz / EPay / USDT (TRC20)
- **部署**: Vercel

## 授权说明

本项目采用域名授权机制，需要购买授权后方可使用。

### 获取授权

联系开发者购买授权：**Telegram [@jialiao2025](https://t.me/jialiao2025)**

### 授权方式

购买后您将获得一个授权码（LICENSE_KEY），只需在 Vercel 环境变量中设置：

```env
LICENSE_KEY=您的授权码
```

### 免授权环境

以下环境无需授权，方便开发测试：
- `localhost` 本地开发
- `*.vercel.app` Vercel 预览域名
- `*.v0.build` / `*.v0.dev` v0 预览环境

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/xiaoheiwa/upgrade-xiaoheiwan-com.git
cd upgrade-xiaoheiwan-com
```

### 2. 安装依赖

```bash
pnpm install
# 或
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写相应配置：

```bash
cp .env.example .env.local
```

### 4. 初始化数据库

在 Neon 控制台或使用 SQL 客户端执行 `scripts/` 目录下的 SQL 文件来创建数据库表：

```bash
# 按顺序执行以下脚本
scripts/create-tables.sql
scripts/add-region-fields.sql
# ... 其他迁移脚本
```

### 5. 启动开发服务器

```bash
pnpm dev
# 或
npm run dev
```

访问 http://localhost:3000 查看项目。

## 环境变量说明

### 授权配置（必需）

| 变量名 | 说明 |
|--------|------|
| `LICENSE_KEY` | 域名授权码（联系开发者获取） |

### 数据库配置（必需）

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 (Neon) |

### 管理员配置（必需）

| 变量名 | 说明 |
|--------|------|
| `ADMIN_PASSWORD` | 后台管理员密码 |
| `JWT_SECRET` | JWT 签名密钥（至少32字符） |

### 邮件服务

| 变量名 | 说明 |
|--------|------|
| `RESEND_API_KEY` | Resend 邮件服务 API Key |
| `EMAIL_FROM` | 发件人邮箱地址 |

### Telegram 通知

| 变量名 | 说明 |
|--------|------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token |
| `TELEGRAM_CHAT_ID` | 接收通知的 Chat ID |

### 支付配置

| 变量名 | 说明 |
|--------|------|
| `XUNHUPAY_API_URL` | 虎皮椒 API 地址 |
| `XUNHUPAY_APP_ID` | 虎皮椒 AppID |
| `XUNHUPAY_APP_SECRET` | 虎皮椒 AppSecret |
| `ZPAYZ_PID` | ZPayz 商户 ID |
| `ZPAYZ_PKEY` | ZPayz 商户密钥 |
| `EPAY_API_URL` | EPay API 地址 |
| `EPAY_PID` | EPay 商户 ID |
| `EPAY_KEY` | EPay 商户密钥 |

### 加密货币支付

| 变量名 | 说明 |
|--------|------|
| `USDT_WALLET_ADDRESS` | USDT (TRC20) 收款钱包地址 |
| `TRON_API_KEY` | TronGrid API Key |
| `USDT_TO_CNY_RATE` | USDT 兑换人民币汇率，默认 7.2 |

### 定时任务

| 变量名 | 说明 |
|--------|------|
| `CRON_SECRET` | Cron Job 验证密钥 |

## 项目结构

```
├── app/                    # Next.js App Router 页面
│   ├── admin/             # 后台管理页面
│   ├── api/               # API 路由
│   │   ├── admin/        # 管理后台 API
│   │   ├── cron/         # 定时任务 API
│   │   ├── order/        # 订单相关 API
│   │   └── pay/          # 支付回调 API
│   ├── activate/          # 激活页面
│   ├── blog/              # 博客页面
│   ├── purchase/          # 购买页面
│   ├── unauthorized/      # 授权提示页面
│   └── ...
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   └── ...
├── lib/                   # 工具函数和配置
│   ├── database.ts       # 数据库操作
│   ├── license.ts        # 授权验证
│   ├── telegram.tsx      # Telegram 通知
│   ├── resend.tsx        # 邮件发送
│   └── ...
├── middleware.ts          # 授权验证中间件
├── scripts/               # 数据库迁移和工具脚本
│   ├── generate-license.js  # 授权码生成工具
│   └── *.sql             # 数据库迁移脚本
└── public/               # 静态资源
```

## 后台管理

访问 `/admin` 进入后台管理，使用 `ADMIN_PASSWORD` 环境变量设置的密码登录。

### 功能模块

- **仪表盘** - 销售统计、收入图表、近期订单
- **商品管理** - 商品 CRUD、库存管理、阶梯定价、区域选项
- **订单管理** - 订单列表、状态筛选、手动发货、区域信息显示
- **分类管理** - 商品分类、图标、排序
- **支付配置** - 多支付通道开关和配置
- **Telegram** - 通知设置、Webhook 配置、每日报告测试
- **博客管理** - 文章发布、AI 辅助写作

## 支付配置

### 支付宝/微信（虎皮椒）

1. 注册 [虎皮椒](https://www.xunhupay.com/) 账号
2. 在后台「支付配置」中填写 AppID 和 AppSecret

### USDT 加密货币

1. 准备一个 TRC20 USDT 钱包地址
2. 在环境变量中设置 `USDT_WALLET_ADDRESS`
3. 可选：申请 [TronGrid API Key](https://www.trongrid.io/) 用于自动验证交易

## Telegram 通知

1. 创建 Telegram Bot（通过 [@BotFather](https://t.me/BotFather)）
2. 获取 Bot Token
3. 获取你的 Chat ID（通过 [@userinfobot](https://t.me/userinfobot)）
4. 在后台「Telegram 通知」中配置并设置 Webhook

### 支持的通知类型

- 新订单通知（包含产品、金额、区域等信息）
- 库存预警（低于设定阈值时提醒）
- 每日销售报告（自动在每天 00:00 发送昨日数据）

## 定时任务

项目使用 Vercel Cron Jobs 执行定时任务：

- **每日销售报告** - 每天北京时间 00:00 自动发送昨日销售数据到 Telegram

确保在 Vercel 环境变量中设置 `CRON_SECRET`。

## 部署

### Vercel 部署（推荐）

1. Fork 本项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 添加 Neon 数据库集成
4. 配置环境变量（包括 LICENSE_KEY）
5. 部署完成

### 数据库

推荐使用 [Neon](https://neon.tech) 免费 PostgreSQL 数据库，支持 serverless 连接。

## 更新日志

### v1.3.0 (2026-03-16)
- 新增域名授权系统
- 优化代码安全性，移除硬编码密钥
- 新增授权提示页面

### v1.2.0
- 新增区域选择功能（适用于 Apple ID 等多区域商品）
- 支持区域专属定价
- 订单详情显示区域信息
- Telegram 通知包含区域信息

### v1.1.0
- 新增博客系统和 AI 辅助写作
- 新增财务统计面板
- 优化后台管理界面
- 新增分类导航

### v1.0.0
- 初始版本发布
- 多产品、多支付方式支持
- 自动/人工发货
- Telegram 通知系统

## 联系方式

- **购买授权**: Telegram [@jialiao2025](https://t.me/jialiao2025)
- **技术支持**: Telegram [@jialiao2025](https://t.me/jialiao2025)
- **问题反馈**: [GitHub Issues](https://github.com/xiaoheiwa/upgrade-xiaoheiwan-com/issues)

## License

本项目需要购买授权后使用，详情请联系开发者。

## 致谢

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Neon](https://neon.tech/)
- [Vercel](https://vercel.com/)
- [Resend](https://resend.com/)
