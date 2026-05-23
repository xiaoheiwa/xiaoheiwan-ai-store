# 小黑丸 AI Store

> 一个后台、两个市场的数字商品商城：中文本地购买体验与 Global USDT Self-Service Store。

[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Cloudflare](https://img.shields.io/badge/deploy-Cloudflare-F38020)](https://www.cloudflare.com/)
[![Database](https://img.shields.io/badge/database-D1-F38020)](https://developers.cloudflare.com/d1/)

## 在线站点

- 中国站：[upgrade.xiaoheiwan.com](https://upgrade.xiaoheiwan.com)
- 全球站：[upgrade.xiaoheiwan.com/global](https://upgrade.xiaoheiwan.com/global)

中国站保留中文说明、本地支付与中文服务体验；全球站提供英文界面、USDT 付款、订单查询与自助交付体验。两个市场共享同一个后台，但商品展示、价格、支付方式和订单归属相互隔离。

## 当前能力

### 双市场商城

- 中国站与全球站使用独立的展示配置和价格体系。
- 全球商品仅在 `/global` 展示，不会把全球价格混入中国站。
- 全球订单支持 USDT-TRC20 与 USDT-BEP20 网络选择。
- 全球订单提供付款页面、倒计时、订单查询和英文政策页面。

### 订单与交付

- 支持自动交付与人工处理的数字商品。
- 支付回调、订单状态、发货状态和风险审核分开记录。
- 邮件交付通过 Resend 发送，Telegram 可用于订单通知与客服支持。
- ChatGPT 全球激活页面可处理已交付的激活码；某些激活流程会明确提示用户提交账户会话资料的用途和风险。

### 后台管理

- 商品、分类、库存、订单、优惠券和支付配置管理。
- 中国站 / 全球站订单与商品筛选。
- 人工审核、手动发货、财务与报税辅助功能。
- Telegram 通知测试、风控管理与内容管理。

## 页面入口

| 入口 | 用途 |
| --- | --- |
| `/` | 中国站商城 |
| `/global` | 全球 USDT 商城 |
| `/global/products` | 全球商品列表 |
| `/global/track-order` | 全球订单查询 |
| `/global/activate/gpt` | 已交付 ChatGPT 激活码的全球激活页面 |
| `/admin` | 统一后台 |

## 运行架构

| 类别 | 当前方案 |
| --- | --- |
| 应用框架 | Next.js 16 App Router + React 19 + TypeScript |
| 界面 | Tailwind CSS v4 + 项目内组件 |
| 生产运行环境 | Cloudflare Workers，通过 OpenNext 构建 |
| 生产数据库 | Cloudflare D1 |
| 文件与构建缓存 | Cloudflare R2 |
| 邮件 | Resend |
| 通知 | Telegram Bot |
| 全球付款 | USDT，经现有网关与订单校验流程处理 |

仓库中仍保留部分兼容旧运行环境与迁移过程的代码。生产部署以 `wrangler.jsonc` 和 Cloudflare 绑定为准。

## 本地开发

### 准备环境

- Node.js 22
- pnpm
- 自己的开发数据库与第三方服务配置

### 启动项目

```bash
git clone https://github.com/xiaoheiwa/xiaoheiwan-ai-store.git
cd xiaoheiwan-ai-store
pnpm install
cp .env.example .env.local
pnpm dev
```

开发地址默认为 `http://localhost:3000`。

### 环境变量

请从 `.env.example` 开始配置，只填写你自己的测试或生产信息。主要配置分为：

| 类别 | 变量示例 |
| --- | --- |
| 登录与后台 | `ADMIN_PASSWORD`、`JWT_SECRET` |
| 数据库 | `DATABASE_URL` 或 Cloudflare D1 绑定 |
| 邮件 | `RESEND_API_KEY`、`RESEND_FROM_EMAIL` |
| Telegram | `TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID`、`GLOBAL_SUPPORT_TELEGRAM` |
| 全球商城 | `GLOBAL_STORE_ENABLED`、`GLOBAL_ORDER_EXPIRE_MINUTES` |
| USDT / 支付网关 | `BEPUSDT_BASE_URL`、`BEPUSDT_API_TOKEN` 及网络配置 |
| 定时任务与接口保护 | `CRON_SECRET`、`PIXEL_TASK_SIGNING_SECRET` |

不要提交 `.env.local`、`.env.cloudflare`、API Token、钱包私钥或助记词。

## Cloudflare 部署

生产环境使用 Cloudflare Workers、D1 与 R2。部署自己的实例前，请先创建自己的 Cloudflare 资源，并将 `wrangler.jsonc` 中的绑定替换为你自己的配置。

```bash
pnpm install
pnpm build
pnpm exec opennextjs-cloudflare build
pnpm deploy
```

敏感变量应使用 Cloudflare Secrets 写入，而不是直接写在仓库中。可参考 [Cloudflare 部署说明](docs/cloudflare-migration.md)。

## 数据库与迁移

- 生产版本当前使用 Cloudflare D1。
- `scripts/` 中包含项目演进过程中的建表和兼容脚本。
- 不要未经审核将迁移脚本直接执行到生产数据库。
- 订单、库存、支付回调和自动交付属于高风险数据流程，变更前应备份并验证。

## 安全与合规提示

- 本项目销售数字交付商品，不应将钱包私钥、助记词或第三方账户密码交给站点。
- 部分第三方激活服务可能要求会话资料；页面必须在提交前清楚告知用户，并仅用于该次服务处理。
- 支付完成和发货应以系统确认结果为准，不以截图作为付款证明。
- 运营者需要自行遵守当地法律、税务要求与第三方平台条款。

## 发布前检查

当前可用的生产构建检查：

```bash
pnpm build
```

本仓库现有的 `lint` 与完整类型检查仍有待清理的历史问题；在将它们作为合并门槛前，应先修复这些存量报错。

## License

本项目基于 [MIT License](LICENSE) 发布。

## 联系

- Telegram 支持：[@jialiao2025](https://t.me/jialiao2025)
- 问题反馈：[GitHub Issues](https://github.com/xiaoheiwa/xiaoheiwan-ai-store/issues)
