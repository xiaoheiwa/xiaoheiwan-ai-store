const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000

function padTime(value: number) {
  return String(value).padStart(2, "0")
}

function parseUtcTimestamp(value?: string | Date | null) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const text = String(value).trim()
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(text)
  const normalized = hasTimezone ? text : `${text.replace(" ", "T")}Z`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatBeijingDateTime(value?: string | Date | null) {
  const date = parseUtcTimestamp(value)
  if (!date) return "-"
  const beijingDate = new Date(date.getTime() + BEIJING_OFFSET_MS)
  return `${beijingDate.getUTCFullYear()}/${beijingDate.getUTCMonth() + 1}/${beijingDate.getUTCDate()} ${padTime(beijingDate.getUTCHours())}:${padTime(beijingDate.getUTCMinutes())}:${padTime(beijingDate.getUTCSeconds())}`
}

export function formatBeijingDate(value?: string | Date | null) {
  const date = parseUtcTimestamp(value)
  if (!date) return "-"
  const beijingDate = new Date(date.getTime() + BEIJING_OFFSET_MS)
  return `${beijingDate.getUTCFullYear()}/${beijingDate.getUTCMonth() + 1}/${beijingDate.getUTCDate()}`
}
