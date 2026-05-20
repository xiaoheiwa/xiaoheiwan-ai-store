import { getCloudflareContext } from "@opennextjs/cloudflare"
import { neon as neonPostgres } from "@neondatabase/serverless"

type RawSql = { __rawSql: string }

type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: () => Promise<{ results?: unknown[] }>
    }
    all: () => Promise<{ results?: unknown[] }>
  }
}

const JSON_COLUMNS = new Set([
  "applicable_products",
  "gateway_resp",
  "metadata",
  "notify_raw",
  "price_tiers",
  "region_options",
  "tags",
])

const BOOLEAN_COLUMNS = new Set(["email_sent", "is_active", "is_high_risk", "require_region_selection"])

function raw(sql: string): RawSql {
  return { __rawSql: sql }
}

function isRaw(value: unknown): value is RawSql {
  return Boolean(value && typeof value === "object" && "__rawSql" in value)
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`
}

function sqliteUuidExpression(): string {
  return "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))))"
}

function normalizeSql(query: string): string {
  return query
    .replace(/\?\s*=\s*ANY\s*\(([^)]+)\)/gi, "EXISTS (SELECT 1 FROM json_each($1) WHERE value = ?)")
    .replace(/\bNOW\(\)\s*-\s*INTERVAL\s+'1 day'\s*\*\s*\?/gi, "datetime('now', '-' || ? || ' days')")
    .replace(/\bNOW\(\)\s*-\s*INTERVAL\s+'(\d+)\s+(hour|hours|day|days|month|months)'/gi, (_, amount, unit) => `datetime('now', '-${amount} ${unit}')`)
    .replace(/\bDATE_TRUNC\('month',\s*NOW\(\)\)\s*-\s*INTERVAL\s+'(\d+)\s+months?'/gi, (_, amount) => `date('now', 'start of month', '-${amount} months')`)
    .replace(/\bDATE_TRUNC\('month',\s*(?:NOW\(\)|CURRENT_DATE)\)/gi, "date('now', 'start of month')")
    .replace(/\bEXTRACT\s*\(\s*HOUR\s+FROM\s+([^)]+)\)/gi, "CAST(strftime('%H', $1) AS INTEGER)")
    .replace(/\bTO_CHAR\s*\(\s*([^,]+),\s*'YYYY-MM'\s*\)/gi, "strftime('%Y-%m', $1)")
    .replace(/::\s*[\w.]+(?:\[\])?/g, "")
    .replace(/\bNOW\(\)/gi, "CURRENT_TIMESTAMP")
    .replace(/\bgen_random_uuid\(\)/gi, sqliteUuidExpression())
    .replace(/\bILIKE\b/gi, "LIKE")
    .replace(/=\s*ANY\s*\(/gi, "IN (")
    .replace(/\bTRUE\b/g, "1")
    .replace(/\bFALSE\b/g, "0")
}

function parsePostgresArrayLiteral(value: string): string[] | null {
  if (!value.startsWith("{") || !value.endsWith("}")) return null
  const body = value.slice(1, -1)
  if (!body) return []

  const result: string[] = []
  let current = ""
  let inQuotes = false
  let escaping = false

  for (const char of body) {
    if (escaping) {
      current += char
      escaping = false
      continue
    }
    if (char === "\\") {
      escaping = true
      continue
    }
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
      continue
    }
    current += char
  }

  result.push(current)
  return result
}

function normalizeParam(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "boolean") return value ? 1 : 0
  if (Array.isArray(value) || (value && typeof value === "object")) return JSON.stringify(value)
  if (typeof value === "string") {
    const arrayValue = parsePostgresArrayLiteral(value)
    if (arrayValue) return JSON.stringify(arrayValue)
  }
  return value
}

function reviveValue(column: string, value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (BOOLEAN_COLUMNS.has(column) && (value === 0 || value === 1)) return value === 1
  if (!JSON_COLUMNS.has(column) || typeof value !== "string") return value

  try {
    return JSON.parse(value)
  } catch {
    const arrayValue = parsePostgresArrayLiteral(value)
    return arrayValue || value
  }
}

function reviveRow(row: unknown): unknown {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row
  const revived: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    revived[key] = reviveValue(key, value)
  }
  return revived
}

function rowsResult(results: unknown[]): unknown[] & { rows: unknown[] } {
  const revivedResults = results.map(reviveRow)
  const rows = revivedResults as unknown[] & { rows: unknown[] }
  rows.rows = revivedResults
  return rows
}

function getCloudflareEnvSync(): Record<string, unknown> | null {
  try {
    return getCloudflareContext().env as Record<string, unknown>
  } catch {
    return null
  }
}

function isD1Enabled(env?: Record<string, unknown> | null): boolean {
  return (
    process.env.DATABASE_PROVIDER === "d1" ||
    process.env.USE_D1 === "true" ||
    env?.DATABASE_PROVIDER === "d1" ||
    env?.USE_D1 === "true"
  )
}

function shouldUseD1Sync(): boolean {
  return isD1Enabled(getCloudflareEnvSync())
}

async function getD1Database(): Promise<D1DatabaseLike> {
  const syncEnv = getCloudflareEnvSync()
  const syncDb = syncEnv?.DB || syncEnv?.xiaoheiwan_ai_store_db
  if (isD1Enabled(syncEnv) && syncDb) return syncDb as D1DatabaseLike

  const context = await getCloudflareContext({ async: true })
  const db = (context.env as any).DB || (context.env as any).xiaoheiwan_ai_store_db
  if (!db) throw new Error("D1 binding DB is not configured")
  return db as D1DatabaseLike
}

function createD1Sql() {
  const sql = (strings: TemplateStringsArray | string, ...values: unknown[]) => {
    if (typeof strings === "string") return raw(quoteIdentifier(strings))
    if (strings.length === 1 && strings[0] === "" && values.length === 0) return raw("")

    const params: unknown[] = []
    let query = ""

    for (let i = 0; i < strings.length; i++) {
      query += strings[i]
      if (i >= values.length) continue

      const value = values[i]
      if (isRaw(value)) {
        query += value.__rawSql
      } else if (Array.isArray(value)) {
        query += value.length ? value.map(() => "?").join(", ") : "NULL"
        params.push(...value.map(normalizeParam))
      } else {
        query += "?"
        params.push(normalizeParam(value))
      }
    }

    return runD1Query(query, params)
  }

  ;(sql as any).query = (query: string, values: unknown[] = []) => runD1Query(query, values)
  ;(sql as any).unsafe = (query: string) => raw(query)

  return sql as any
}

function createHybridSql(databaseUrl?: string) {
  const postgresSql = neonPostgres(databaseUrl || process.env.DATABASE_URL || "")
  const d1Sql = createD1Sql()

  const sql = (strings: TemplateStringsArray | string, ...values: unknown[]) => {
    if (shouldUseD1Sync()) return d1Sql(strings as any, ...values)
    return (postgresSql as any)(strings as any, ...values)
  }

  ;(sql as any).query = (query: string, values: unknown[] = []) => {
    if (shouldUseD1Sync()) return runD1Query(query, values)
    return (postgresSql as any).query(query, values)
  }
  ;(sql as any).unsafe = (query: string) => {
    if (shouldUseD1Sync()) return raw(query)
    return (postgresSql as any).unsafe ? (postgresSql as any).unsafe(query) : raw(query)
  }

  return sql as any
}

async function runD1Query(query: string, values: unknown[] = []) {
  const db = await getD1Database()
  const normalizedQuery = normalizeSql(query).replace(/\$(\d+)/g, "?")
  const normalizedValues = values.map(normalizeParam)
  const statement = db.prepare(normalizedQuery)
  const result = normalizedValues.length ? await statement.bind(...normalizedValues).all() : await statement.all()
  return rowsResult(result.results || [])
}

export function neon(databaseUrl?: string) {
  return createHybridSql(databaseUrl)
}
