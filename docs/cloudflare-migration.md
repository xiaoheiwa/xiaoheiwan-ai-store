# Cloudflare Migration Checklist

目标：第一阶段先迁移运行环境到 Cloudflare Workers，数据库继续使用 Neon。D1 数据库迁移单独作为第二阶段处理。

## 已完成的代码适配

- 使用 OpenNext Cloudflare 适配 Next.js。
- 增加 `wrangler.jsonc` 和 `open-next.config.ts`。
- 将上传接口改成优先使用 Cloudflare R2，非 Cloudflare 环境继续回退到 Vercel Blob。
- 增加 Cloudflare 定时任务入口，继续触发原来的每日报告接口。
- 删除空的 `proxy.ts`，避免 Cloudflare 构建把它当作不支持的 Node.js 中间层。
- 将 Next.js 升级到 `16.2.6`，满足当前 Cloudflare 适配器要求。

## Cloudflare 需要创建的资源

1. Workers 项目：`xiaoheiwan-ai-store`
2. R2 bucket：`xiaoheiwan-ai-store-uploads`（已创建）
3. R2 bucket：`xiaoheiwan-ai-store-cache`（已创建）
4. Node.js 版本：`22`

## 需要从 Vercel 复制到 Cloudflare 的变量

至少需要这些：

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `LICENSE_KEY`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL`

按实际启用功能继续复制：

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `XUNHUPAY_API_URL`
- `XUNHUPAY_APP_ID` 或 `XUNHUPAY_APPID`
- `XUNHUPAY_APP_SECRET`
- `ZPAYZ_PID`
- `ZPAYZ_PKEY`
- `ZPAYZ_WXPAY_CID`
- `EPAY_API_URL`
- `EPAY_PID`
- `EPAY_KEY`
- `USDT_WALLET_ADDRESS`
- `TRON_API_KEY`
- `USDT_TO_CNY_RATE` 或 `USDT_CNY_RATE`
- `BEPUSDT_BASE_URL`
- `BEPUSDT_API_TOKEN`
- `BEPUSDT_TRADE_TYPE`
- `BEPUSDT_FIAT`
- `BEPUSDT_TIMEOUT`
- `CHONGZHI_API_URL`
- `CHONGZHI_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `PAYMENT_PRODUCT_NAME`
- `SITE_BASE_URL` 或 `SITE_BASE`
- `BLOG_API_KEY`
- `ADMIN_TOKEN`
- `REACHER_API_KEY`
- `REACHER_API_URL`
- `PIXEL_API_BASE`

如果给 R2 绑定了公开访问域名，再设置：

- `R2_PUBLIC_BASE_URL`

没有公开域名也可以，上传图片会走站内 `/api/file` 读取。

## 本地验证命令

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm exec opennextjs-cloudflare build
pnpm exec wrangler deploy --dry-run
```

本机运行 Wrangler 需要 Node.js 22。当前已用 Node 22 验证过 dry-run。

## 批量写入 Cloudflare 环境变量

把 Vercel 变量导出到 `.env.cloudflare` 后运行：

```bash
pnpm cf:set-secrets .env.cloudflare
```

这个文件已被 `.gitignore` 忽略，不要提交到 GitHub。

## Cloudflare 部署前检查

- 首页能打开。
- 商品列表能加载。
- 下单流程能创建订单。
- 支付回调能更新订单。
- 自动发货能正常扣库存并发送邮件。
- 后台能登录。
- 后台商品图片能上传并显示。
- Telegram 测试通知能发送。
- 每日报告接口用 `Authorization: Bearer <CRON_SECRET>` 能触发。

## 定时任务

Cloudflare 定时任务已配置为每天 UTC 16:00 触发，等同于北京时间每天 00:00。它会内部请求：

```text
GET https://你的域名/api/cron/daily-report
Authorization: Bearer <CRON_SECRET>
```

也可以手动请求这个地址测试 Telegram 每日报告。

## 数据库迁移原则

第一阶段不迁数据库，继续连 Neon。等 Cloudflare 测试站完整跑通后，再单独评估 D1：

- PostgreSQL 语法要改成 SQLite/D1 兼容写法。
- 订单、库存、支付回调要重点压测。
- Neon 要完整备份后再做数据迁移。
- 正式切库前需要短暂停写，做最后一次数据同步。
