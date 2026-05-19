# Cloudflare Database Migration Assessment

Date: 2026-05-19

## Current production status

- The app is running on Cloudflare Workers at `https://xiaoheiwan-ai-store.ileeken.workers.dev`.
- The active Cloudflare Worker version after the real production-env rebuild is `34710e12-371f-495c-b667-9260e8668d8c`.
- Uploads are configured to use Cloudflare R2.
- The database is still Neon PostgreSQL. This is intentional for the first safe cutover.
- Verified checks:
  - Homepage returns 200.
  - Admin page returns 200.
  - `/api/products` returns 200 and reads 19 active products from the production database.
  - `/api/cron/daily-report` returns 401 without the cron secret.

## Production database inventory

Read-only inspection found 29 public tables and about 2,468 rows total.

| Table | Rows |
| --- | ---: |
| activation_codes | 911 |
| admin_audit_log | 11 |
| affiliate_links | 6 |
| blog_posts | 23 |
| chat_messages | 422 |
| chat_sessions | 88 |
| coupon_codes | 1 |
| coupon_usage | 0 |
| email_templates | 1 |
| ip_whitelist | 0 |
| notifications | 3 |
| orders | 844 |
| price_config | 1 |
| product_categories | 5 |
| products | 22 |
| promoter_applications | 2 |
| purchase_batches | 86 |
| referral_orders | 0 |
| referral_withdrawals | 0 |
| referrers | 0 |
| risk_blacklist | 1 |
| risk_config | 12 |
| risk_logs | 5 |
| risk_whitelist | 1 |
| security_alerts | 17 |
| site_config | 3 |
| system_settings | 1 |
| telegram_users | 2 |
| withdrawal_requests | 0 |

## Why D1 is not a direct drop-in replacement

Cloudflare D1 uses SQLite semantics, while the current app is written for PostgreSQL through Neon.

The current code and schema use PostgreSQL-specific features that need conversion:

- Types: `uuid`, `jsonb`, arrays, `numeric`, `SERIAL`, `BIGINT`, timestamp variants.
- Functions: `gen_random_uuid()`, `NOW()`, `DATE_TRUNC()`.
- Syntax: `::jsonb`, `::uuid`, `::int`, `ANY(...)`, `INTERVAL`, some `RETURNING` usage.
- Behavior: order fulfillment and stock locking depend on transactional update patterns that must be re-tested carefully on D1.

## Recommended safe migration path

### Phase 1: Completed

Move the web app runtime to Cloudflare while keeping Neon as the production database.

This is now working and verified.

### Phase 2: Optional quick database-layer improvement

Use Cloudflare Hyperdrive in front of Neon.

This keeps PostgreSQL and avoids a rewrite, while moving database connectivity into Cloudflare's network. It is the fastest safe next step if the goal is better Cloudflare integration without risking orders and inventory.

### Phase 3: True D1 migration

Only do this after a staging D1 database works end to end.

1. Create a D1 staging database.
2. Convert the PostgreSQL schema to SQLite-compatible D1 schema.
3. Add a database adapter layer so code can target Neon or D1 without rewriting every route at once.
4. Convert and import data table by table.
5. Test safe read flows first: products, categories, blog, config.
6. Test write flows second: order creation, coupon usage, stock lock, payment callback, auto-fulfillment, email send.
7. Freeze writes briefly on Neon for final sync.
8. Switch production to D1.
9. Keep Neon unchanged for rollback until D1 has proven stable.

## Cutover warning

Do not point `upgrade.xiaoheiwan.com` to Cloudflare D1-backed code until order creation, payment callbacks, and activation-code stock locking pass tests against D1.
