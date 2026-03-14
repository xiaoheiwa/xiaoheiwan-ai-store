// Key aliases: maps old code-level names to actual env var names
const KEY_ALIASES: Record<string, string[]> = {
  SITE_BASE: ["SITE_BASE", "SITE_BASE_URL"],
  EPAY_API: ["EPAY_API", "EPAY_GATEWAY"],
  EPAY_MCH_ID: ["EPAY_MCH_ID", "EPAY_PID"],
}

export function assertEnv(keys: string[]) {
  const miss = keys.filter((k) => !getEnv(k))
  if (miss.length) {
    throw new Error("ENV_MISSING:" + miss.join(","))
  }
}

export function getEnv(key: string): string {
  // Check direct key first
  if (process.env[key]) {
    return process.env[key]!
  }

  // Check aliases
  const aliases = KEY_ALIASES[key]
  if (aliases) {
    for (const alias of aliases) {
      if (process.env[alias]) {
        return process.env[alias]!
      }
    }
  }

  return ""
}
