# 小黑丸 AI Store

> XiaoHeiWan AI Store - 一站式 AI 服务激活码销售平台

支持 Claude Pro、ChatGPT Plus、Grok Premium 等 AI 服务的激活码自动发货，开箱即用的开源商城系统。

![License](https://img.shields.io/badge/license-Commercial-red.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 演示站点

**在线演示**: [upgrade.xiaoheiwan.com](https://upgrade.xiaoheiwan.com)

**购买授权**: Telegram [@jialiao2025](https://t.me/jialiao2025)

## 截图预览

| 首页 | 商品详情 | 后台管理 |
|:---:|:---:|:---:|
| 产品展示、分类导航 | 支付方式、区域选择 | 订单、库存、统计 |

## 功能特性

### 商品销售
- 多产品支持 - Claude、ChatGPT、Grok、GitHub Copilot、Apple ID 等
- 多支付方式 - 支付宝、微信支付、USDT (TRC20)
- 自动发货 - 支付成功后自动发送激活码
- 人工发货 - 支持需要人工处理的商品
- 区域选择 - 多区域商品支持（如不同国家的 Apple ID）
- 阶梯定价 - 批量购买折扣价格

### 激活服务
- Claude Pro 激活 - 自助激活流程
- ChatGPT Plus 激活 - 对接第三方 API
- Grok Premium 激活 - X/Twitter 会员激活
- GitHub Copilot 激活 - 套壳代理激活平台
- GPT Team 兑换 - 邀请链接自动兑换
- Telegram Premium - 代开会员服务

### 后台管理
- 商品管理 - CRUD、库存、阶梯定价、区域选项
- 订单管理 - 订单详情、手动发货、状态筛选
- 分类管理 - 商品分类、图标、排序
- 支付配置 - 多支付通道配置
- 财务统计 - 销售数据、收入图表
- 博客系统 - 内置博客，支持 AI 辅助写作

### 通知系统
- Telegram Bot - 订单通知、库存预警、每日报告
- 邮件通知 - 自动发送激活码到用户邮箱
- Webhook - 支持 Bot 命令交互

### 实用工具
- 2FA 验证器 - TOTP 双因素认证码生成
- Gmail 检测 - 批量检测邮箱状态
- 图片分割 - 外链 AI 拼贴图分割工具

### 其他特性
- 域名授权 - 内置授权验证，保护源代码
- 在线客服 - 实时聊天客服系统
- SEO 优化 - 完整的 SEO 配置
- 响应式设计 - 移动端 + 桌面端
- 深色模式 - 明暗主题切换
- 订单密码重置 - 后台支持重置用户查询密码

## 技术栈

| 类型 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 |
| 数据库 | PostgreSQL (Neon) |
| 缓存 | Upstash Redis |
| 样式 | Tailwind CSS v4 + shadcn/ui |
| 邮件 | Resend |
| 支付 | 虎皮椒 / ZPayz / EPay / USDT / 微信支付 |
| 部署 | Vercel |

## 授权说明

本项目采用**商业授权**，需要购买授权后方可部署使用。

### 获取授权

联系开发者购买：**Telegram [@jialiao2025](https://t.me/jialiao2025)**

### 授权方式

购买后获得授权码，在 Vercel 环境变量中设置：

```env
LICENSE_KEY=您的授权码
```

### 免授权环境（开发测试）

- `localhost` 本地开发
- `*.vercel.app` Vercel 预览
- `*.v0.build` / `*.v0.dev` v0 预览

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/xiaoheiwa/upgrade-xiaoheiwan-com.git
cd upgrade-xiaoheiwan-com
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 填写配置。

### 4. 初始化数据库

执行 `scripts/` 目录下的 SQL 文件创建表结构。

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 环境变量

<details>
<summary><strong>点击展开完整配置</strong></summary>

### 授权（必需）

```env
LICENSE_KEY=your_license_key
```

### 数据库（必需）

```env
DATABASE_URL=postgresql://user:password@host/database
```

### 管理员（必需）

```env
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_jwt_secret_at_least_32_chars
```

### 邮件服务

```env
RESEND_API_KEY=re_xxxx
EMAIL_FROM=noreply@yourdomain.com
```

### Telegram 通知

```env
TELEGRAM_BOT_TOKEN=123456:ABC-xxx
TELEGRAM_CHAT_ID=123456789
```

### 支付配置

```env
# 虎皮椒
XUNHUPAY_API_URL=https://api.xunhupay.com/payment/do.html
XUNHUPAY_APP_ID=your_app_id
XUNHUPAY_APP_SECRET=your_app_secret

# ZPayz
ZPAYZ_PID=your_pid
ZPAYZ_PKEY=your_pkey
ZPAYZ_WXPAY_CID=your_wxpay_channel_id

# EPay
EPAY_API_URL=https://your-epay-url/mapi.php
EPAY_PID=your_pid
EPAY_KEY=your_key

# USDT
USDT_WALLET_ADDRESS=TRC20_wallet_address
TRON_API_KEY=your_trongrid_api_key
USDT_TO_CNY_RATE=7.2
```

### 定时任务

```env
CRON_SECRET=your_cron_secret
```

</details>

## 项目结构

```
├── app/
│   ├── admin/              # 后台管理
│   ├── api/                # API 路由
│   ├── activate/           # 激活页面
│   ├── blog/               # 博客
│   ├── purchase/           # 购买页面
│   └── unauthorized/       # 授权提示
├── components/
│   └── ui/                 # shadcn/ui 组件
├── lib/
│   ├── database.ts         # 数据库操作
│   ├── license.ts          # 授权验证
│   └── telegram.tsx        # Telegram 通知
├── middleware.ts           # 授权中间件
└── scripts/
    ├── generate-license.js # 授权码生成
    └── *.sql               # 数据库迁移
```

## 后台管理

访问 `/admin`，使用 `ADMIN_PASSWORD` 登录。

**功能模块**：仪表盘 / 商品管理 / 订单管理 / 分类管理 / 支付配置 / Telegram 通知 / 博客管理

## 部署

### Vercel（推荐）

1. Fork 本项目
2. 在 Vercel 导入项目
3. 添加 Neon 数据库集成
4. 配置环境变量
5. 部署完成

### 数据库

推荐 [Neon](https://neon.tech) 免费 PostgreSQL。

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.5.0 | 2026-04-24 | GitHub Copilot 激活、微信支付渠道、订单密码重置 |
| v1.4.0 | 2026-04 | GPT Plus 新源站、Team 存活率健康度、2FA 工具 |
| v1.3.0 | 2026-03-16 | 域名授权系统、代码安全优化 |
| v1.2.0 | 2026-03 | 区域选择功能、区域定价 |
| v1.1.0 | 2026-02 | 博客系统、财务统计、分类导航 |
| v1.0.0 | 2026-01 | 初始版本 |

## 联系方式

- **购买授权** / **技术支持**: Telegram [@jialiao2025](https://t.me/jialiao2025)
- **问题反馈**: [GitHub Issues](https://github.com/xiaoheiwa/upgrade-xiaoheiwan-com/issues)

## 二次开发说明

如果你购买源码进行二次开发/销售，请修改以下内容：

1. **授权密钥** - 修改 `INTERNAL_SECRET` 为你自己的私密字符串
   - `lib/license.ts`
   - `middleware.ts`
   - `scripts/generate-license.js`

2. **开发者域名** - 修改 `DEVELOPER_DOMAINS` 为你的域名
   - `middleware.ts`

3. **联系方式** - 修改 Telegram、GitHub 链接
   - `app/unauthorized/page.tsx`
   - `components/footer.tsx`
   - `README.md`

## License

本项目为商业授权软件，未经授权不得用于商业用途。详情请联系开发者。

---

**Made with Next.js, Tailwind CSS, and shadcn/ui**
