#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { neon } from "@neondatabase/serverless"

const DEFAULT_TABLE_ORDER = [
  "product_categories",
  "products",
  "purchase_batches",
  "activation_codes",
  "price_config",
  "site_config",
  "system_settings",
  "email_templates",
  "notifications",
  "affiliate_links",
  "blog_posts",
  "orders",
  "coupon_codes",
  "coupon_usage",
  "referrers",
  "referral_orders",
  "referral_withdrawals",
  "withdrawal_requests",
  "promoter_applications",
  "risk_config",
  "risk_blacklist",
  "risk_whitelist",
  "risk_logs",
  "security_alerts",
  "telegram_users",
  "chat_sessions",
  "chat_messages",
  "admin_audit_log",
  "ip_whitelist",
]

const UUID_DEFAULT =
  "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))))"

function parseArgs(argv) {
  const args = {
    envFile: ".env.local",
    outDir: "/private/tmp/xiaoheiwan-d1",
    schemaFile: "schema.sql",
    dataFile: "data.sql",
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--env-file") args.envFile = argv[++i]
    else if (arg === "--out-dir") args.outDir = argv[++i]
    else if (arg === "--schema-file") args.schemaFile = argv[++i]
    else if (arg === "--data-file") args.dataFile = argv[++i]
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/export-neon-to-d1.mjs [options]

Options:
  --env-file <path>     Env file containing DATABASE_URL. Default: .env.local
  --out-dir <path>      Output directory. Default: /private/tmp/xiaoheiwan-d1
  --schema-file <name>  Schema filename. Default: schema.sql
  --data-file <name>    Data filename. Default: data.sql`)
      process.exit(0)
    }
  }

  return args
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#") || !line.includes("=")) continue
    const normalized = line.startsWith("export ") ? line.slice("export ".length) : line
    const index = normalized.indexOf("=")
    const key = normalized.slice(0, index)
    let value = normalized.slice(index + 1)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] ||= value
  }
}

function qid(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`
}

function stringLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function mapType(column) {
  const type = column.data_type
  const udt = column.udt_name

  if (type === "boolean") return "INTEGER"
  if (type === "integer" || type === "smallint" || type === "bigint") return "INTEGER"
  if (type === "numeric" || type === "real" || type === "double precision") return "REAL"
  if (type === "uuid") return "TEXT"
  if (type === "json" || type === "jsonb" || udt === "json" || udt === "jsonb") return "TEXT"
  if (type === "ARRAY") return "TEXT"
  if (type.includes("timestamp") || type === "date" || type === "time without time zone") return "TEXT"
  if (type === "bytea") return "BLOB"
  return "TEXT"
}

function mapDefault(column) {
  const raw = column.column_default
  if (!raw) return ""

  if (raw.includes("gen_random_uuid()")) return ` DEFAULT ${UUID_DEFAULT}`
  if (raw.includes("nextval(")) return ""
  if (raw === "now()" || raw.includes("now()")) return " DEFAULT CURRENT_TIMESTAMP"
  if (raw === "CURRENT_TIMESTAMP") return " DEFAULT CURRENT_TIMESTAMP"
  if (raw === "true") return " DEFAULT 1"
  if (raw === "false") return " DEFAULT 0"
  if (raw === "NULL::" || raw === "NULL") return ""

  const castless = raw.replace(/::[\w\s.[\]"]+$/g, "")
  if (/^-?\d+(\.\d+)?$/.test(castless)) return ` DEFAULT ${castless}`
  if (/^'.*'$/.test(castless)) return ` DEFAULT ${castless}`
  return ""
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL"
  if (typeof value === "boolean") return value ? "1" : "0"
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL"
  if (typeof value === "bigint") return String(value)
  if (value instanceof Date) return stringLiteral(value.toISOString())
  if (Buffer.isBuffer(value)) return `X'${value.toString("hex")}'`
  if (Array.isArray(value) || typeof value === "object") return stringLiteral(JSON.stringify(value))
  return stringLiteral(value)
}

function orderTables(tables) {
  const known = new Set(DEFAULT_TABLE_ORDER)
  const ordered = DEFAULT_TABLE_ORDER.filter((table) => tables.includes(table))
  const rest = tables.filter((table) => !known.has(table)).sort()
  return [...ordered, ...rest]
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  loadEnvFile(args.envFile)

  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!databaseUrl) {
    throw new Error(`DATABASE_URL not found. Pass --env-file or export DATABASE_URL.`)
  }

  fs.mkdirSync(args.outDir, { recursive: true })

  const sql = neon(databaseUrl)
  const tableRows = await sql.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)
  const tables = orderTables(tableRows.map((row) => row.table_name))

  const primaryKeyRows = await sql.query(`
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
    ORDER BY tc.table_name, kcu.ordinal_position
  `)
  const primaryKeys = new Map()
  for (const row of primaryKeyRows) {
    const cols = primaryKeys.get(row.table_name) || []
    cols.push(row.column_name)
    primaryKeys.set(row.table_name, cols)
  }

  const uniqueRows = await sql.query(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'UNIQUE'
    ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position
  `)
  const uniqueConstraints = new Map()
  for (const row of uniqueRows) {
    const key = `${row.table_name}:${row.constraint_name}`
    const entry = uniqueConstraints.get(key) || { table: row.table_name, name: row.constraint_name, columns: [] }
    entry.columns.push(row.column_name)
    uniqueConstraints.set(key, entry)
  }

  const schemaLines = [
    "-- Generated from Neon PostgreSQL for Cloudflare D1.",
    "-- Review before using for a production cutover.",
    "PRAGMA foreign_keys = OFF;",
    "",
  ]
  const dataLines = [
    "-- Generated data export from Neon PostgreSQL for Cloudflare D1.",
    "-- Contains production data. Do not commit this file.",
    "PRAGMA foreign_keys = OFF;",
    "BEGIN TRANSACTION;",
    "",
  ]

  const summary = []

  for (const table of tables) {
    const columns = await sql.query(`
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${stringLiteral(table)}
      ORDER BY ordinal_position
    `)
    const pk = primaryKeys.get(table) || []

    schemaLines.push(`DROP TABLE IF EXISTS ${qid(table)};`)
    schemaLines.push(`CREATE TABLE ${qid(table)} (`)
    const columnDefinitions = columns.map((column) => {
      const isSingleIntegerPrimaryKey =
        pk.length === 1 && pk[0] === column.column_name && mapType(column) === "INTEGER"
      const pieces = [qid(column.column_name)]
      if (isSingleIntegerPrimaryKey) {
        pieces.push("INTEGER PRIMARY KEY AUTOINCREMENT")
      } else {
        pieces.push(mapType(column))
        pieces.push(mapDefault(column))
        if (column.is_nullable === "NO") pieces.push("NOT NULL")
      }
      return `  ${pieces.filter(Boolean).join(" ")}`
    })

    if (pk.length > 0 && !(pk.length === 1 && mapType(columns.find((c) => c.column_name === pk[0])) === "INTEGER")) {
      columnDefinitions.push(`  PRIMARY KEY (${pk.map(qid).join(", ")})`)
    }

    schemaLines.push(columnDefinitions.join(",\n"))
    schemaLines.push(");")
    schemaLines.push("")

    dataLines.push(`DELETE FROM ${qid(table)};`)
    const rows = await sql.query(`SELECT * FROM ${qid(table)}`)
    summary.push({ table, rows: rows.length })

    for (const row of rows) {
      const names = columns.map((column) => column.column_name)
      const values = names.map((name) => sqlValue(row[name]))
      dataLines.push(`INSERT INTO ${qid(table)} (${names.map(qid).join(", ")}) VALUES (${values.join(", ")});`)
    }
    dataLines.push("")
  }

  for (const { table, name, columns } of uniqueConstraints.values()) {
    const pk = primaryKeys.get(table) || []
    if (pk.length === columns.length && pk.every((col, index) => col === columns[index])) continue
    schemaLines.push(
      `CREATE UNIQUE INDEX IF NOT EXISTS ${qid(`idx_${table}_${columns.join("_")}_unique`)} ON ${qid(table)} (${columns.map(qid).join(", ")});`,
    )
  }

  schemaLines.push("")
  dataLines.push("COMMIT;")
  dataLines.push("")

  const schemaPath = path.join(args.outDir, args.schemaFile)
  const dataPath = path.join(args.outDir, args.dataFile)
  fs.writeFileSync(schemaPath, `${schemaLines.join("\n")}\n`)
  fs.writeFileSync(dataPath, `${dataLines.join("\n")}\n`)

  console.log(`Wrote ${schemaPath}`)
  console.log(`Wrote ${dataPath}`)
  console.table(summary)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
