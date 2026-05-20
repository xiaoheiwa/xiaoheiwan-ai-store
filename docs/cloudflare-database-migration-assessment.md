# Cloudflare Database Migration Assessment

Date: 2026-05-20

## Current production status

- The app is running on Cloudflare Workers at `https://xiaoheiwan-ai-store.ileeken.workers.dev`.
- The active Cloudflare Worker version after the D1-backed deploy is `76776db8-6b3d-4743-9c47-302a6e410654`.
- Uploads are configured to use Cloudflare R2.
- The Cloudflare test Worker is now configured to use Cloudflare D1.
- The public domain `upgrade.xiaoheiwan.com` is still on Vercel. This is intentional until final cutover.
- Verified checks:
  - Homepage returns 200.
  - `/api/products` returns 200 and reads 19 active products from D1.
  - `/api/products/[id]` returns 200 and preserves product JSON fields such as `price_tiers`.
  - `/api/categories` returns 200 and reads 5 categories from D1.
  - `/api/blog` returns 200 and preserves blog tags as arrays.
  - `/api/blog?tag=...` returns 200 against D1 tag data.
  - `/api/price`, `/api/stock`, `/api/config/payment`, and `/api/tools-config` return 200.
  - A test order was created and read successfully on D1, then deleted.
  - A test payment callback successfully changed a test order to paid, fulfilled it with an activation code, and was then cleaned up.
  - The D1 order count returned to 846 after cleanup.
  - Admin login works on the Cloudflare test Worker.
  - Admin orders, codes, products, finance, blog, and stats endpoints return 200 against D1.
  - `/api/admin/stats` returns 401 without login.
  - `/api/cron/daily-report` returns 401 without the cron secret.

## Production database inventory

The latest D1 import contains 29 public tables. Important table counts:

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
| orders | 846 |
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

### Phase 2: Completed

Create a D1 database, convert and import Neon data, and run the Cloudflare test Worker against D1.

This is now working for public read flows, basic order creation, payment callback fulfillment, and key admin read flows.

### Phase 3: Remaining before final domain cutover

1. Re-sync Neon to D1 immediately before cutover so no late orders are missed.
2. Test manual fulfillment and any admin write workflows that will be used immediately after cutover.
3. Freeze writes briefly on Neon for final sync.
4. Switch `upgrade.xiaoheiwan.com` to Cloudflare.
5. Keep Neon unchanged for rollback until D1 has proven stable.

## Cutover warning

Do not point `upgrade.xiaoheiwan.com` to Cloudflare D1-backed code until order creation, payment callbacks, and activation-code stock locking pass tests against D1.

## 2026-05-20 D1 migration progress

Generated a D1-compatible export from Neon with:

```bash
rtk env PATH=/Users/lijian/.nvm/versions/node/v22.22.2/bin:$PATH node scripts/export-neon-to-d1.mjs --env-file .env.local --out-dir /private/tmp/xiaoheiwan-d1
```

Outputs:

- `/private/tmp/xiaoheiwan-d1/schema.sql`
- `/private/tmp/xiaoheiwan-d1/data.sql`
- `/private/tmp/xiaoheiwan-d1/r2-assets.json`

The data file contains production orders and activation codes. Do not commit it.

Created the remote D1 database:

- Name: `xiaoheiwan-ai-store-db`
- ID: `2a270288-2bb8-4be3-a577-20cd96ab849e`
- Region: WNAM

Imported schema and data into remote D1:

- `products`: 22 rows
- `activation_codes`: 911 rows
- `orders`: 846 rows
- `blog_posts`: 23 rows
- `chat_messages`: 422 rows

Five large inline blog images were extracted from database rows and uploaded to R2 under `blog-assets/`. The public file API returned 200 for an extracted image.

The Cloudflare Worker now includes this D1 binding:

```bash
env.DB -> xiaoheiwan-ai-store-db
```

Latest verification on 2026-05-20:

- Re-exported Neon data; order count remained 846.
- Re-imported the latest schema and data into D1.
- Verified automatic payment callback flow on D1.
- Fixed D1 handling for numbered SQL parameters used by multi-field order updates.
- Fixed the finance endpoint to avoid database-specific month generation.
- Verified major admin read endpoints against D1.

The formal domain has not been cut over yet.
