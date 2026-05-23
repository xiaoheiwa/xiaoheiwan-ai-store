# Cloudflare 部署说明

更新日期：2026-05-23

## 当前生产架构

正式站 `upgrade.xiaoheiwan.com` 已运行在 Cloudflare 上：

- 应用运行于 Cloudflare Workers。
- 数据库使用 Cloudflare D1。
- 上传文件与增量构建缓存使用 Cloudflare R2。
- 定时任务由 Cloudflare Cron Triggers 执行。
- 中国站路径保持 `/`，全球站使用 `/global`。

## 需要准备的 Cloudflare 资源

部署自己的实例前，需要创建：

1. Workers 应用。
2. D1 数据库。
3. 上传文件使用的 R2 bucket。
4. Next.js 增量缓存使用的 R2 bucket。
5. 自定义域名与 DNS 配置。

请将 `wrangler.jsonc` 中的数据库、存储桶与服务名称替换为自己的资源，避免复用示例或生产项目配置。

## 配置原则

可以公开的运行开关可放在 `wrangler.jsonc` 的变量中，例如是否启用全球站和公开客服地址。

以下内容必须作为 Secret 管理，不要提交到 GitHub：

- 后台密码与登录密钥。
- 邮件服务密钥。
- Telegram Bot Token。
- 支付网关 Token。
- 定时任务签名密钥。
- 任何第三方接口密钥。
- 钱包私钥或助记词（本项目不需要保存这些内容）。

完整变量名称请参考仓库根目录的 `.env.example`。

## 发布流程

```bash
pnpm install
cp .env.example .env.local
pnpm build
pnpm exec opennextjs-cloudflare build
pnpm deploy
```

如需批量写入 Secret，可创建一个不会提交到仓库的 `.env.cloudflare` 文件，并根据自己的环境审查后运行项目中的写入脚本。

## 上线验收

每次涉及订单、付款或交付的发布，至少检查：

- 中国站首页和商品页面可访问。
- 全球站首页、商品、付款和订单查询页面可访问。
- 支付网络提示、付款金额和订单有效期显示正确。
- 回调不会重复发货，异常金额进入人工处理。
- 邮件与 Telegram 通知工作正常。
- 后台能查看订单、付款状态与人工处理原因。

## 数据库变更注意事项

- D1 使用 SQLite 行为，不能直接照搬 PostgreSQL 语法。
- 数据库字段新增应保持旧订单可读，新增字段应允许为空或具有默认值。
- 生产迁移前先备份，再在测试数据上演练。
- 不要把导出的生产数据文件或订单库存内容提交到仓库。
