# AI Service Activation Code Platform

一个现代化的 AI 服务激活码销售平台，支持 Claude Pro、ChatGPT Plus、Grok Premium 等 AI 服务的激活码自动发货。

## 功能特性

- **多产品支持** - 支持 Claude、ChatGPT、Grok 等多种 AI 服务激活码
- **多支付方式** - 支持支付宝、微信、USDT 加密货币支付
- **自动发货** - 支付成功后自动发送激活码到邮箱
- **后台管理** - 完整的商品、订单、库存管理后台
- **Telegram 通知** - 订单通知、库存预警、每日销售报告
- **在线客服** - 内置实时聊天客服系统
- **SEO 优化** - 完整的 SEO 配置和结构化数据
- **响应式设计** - 完美支持移动端和桌面端

## 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: PostgreSQL (Neon)
- **样式**: Tailwind CSS v4 + shadcn/ui
- **邮件**: Resend
- **支付**: 虎皮椒、ZPayz、USDT (TRC20)
- **部署**: Vercel

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/ai-activation-platform.git
cd ai-activation-platform
```

### 2. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写相应配置：

```bash
cp .env.example .env.local
```

### 4. 初始化数据库

在 Neon 控制台或使用 SQL 客户端执行 `scripts/` 目录下的 SQL 文件来创建数据库表。

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看项目。

## 环境变量说明

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 数据库连接字符串 |
| `ADMIN_PASSWORD` | 是 | 后台管理员密码 |
| `JWT_SECRET` | 是 | JWT 签名密钥 |
| `RESEND_API_KEY` | 否 | Resend 邮件服务 API Key |
| `EMAIL_FROM` | 否 | 发件人邮箱地址 |
| `TELEGRAM_BOT_TOKEN` | 否 | Telegram Bot Token |
| `TELEGRAM_CHAT_ID` | 否 | Telegram 接收通知的 Chat ID |
| `USDT_WALLET_ADDRESS` | 否 | USDT (TRC20) 收款钱包地址 |
| `USDT_CNY_RATE` | 否 | USDT 兑换人民币汇率，默认 7.2 |
| `TRON_API_KEY` | 否 | Tron API Key (用于验证 USDT 交易) |
| `CRON_SECRET` | 否 | Cron Job 验证密钥 |
| `NEXT_PUBLIC_BASE_URL` | 否 | 网站基础 URL |

## 项目结构

```
├── app/                    # Next.js App Router 页面
│   ├── admin/             # 后台管理页面
│   ├── api/               # API 路由
│   ├── activate/          # 激活页面
│   ├── purchase/          # 购买页面
│   └── ...
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   └── ...
├── lib/                   # 工具函数和配置
├── scripts/               # 数据库迁移脚本
└── public/               # 静态资源
```

## 后台管理

访问 `/admin` 进入后台管理，使用 `ADMIN_PASSWORD` 环境变量设置的密码登录。

后台功能包括：
- 商品管理（添加、编辑、删除商品和激活码）
- 订单管理（查看订单、手动发货）
- 分类管理
- 支付配置
- Telegram 通知设置
- 数据统计

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

## 部署

### Vercel 部署

1. Fork 本项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 部署完成

### 数据库

推荐使用 [Neon](https://neon.tech) 免费 PostgreSQL 数据库。

## License

[MIT](LICENSE)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 致谢

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Neon](https://neon.tech/)
- [Vercel](https://vercel.com/)
