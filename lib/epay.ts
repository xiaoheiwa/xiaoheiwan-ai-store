import md5 from "md5"
import { getEnv } from "./env"

export function buildEpayUrl(p: Record<string, string | number>) {
  const filtered = Object.entries(p)
    .filter(([k, v]) => v !== undefined && v !== "" && k !== "sign" && k !== "sign_type")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&")

  const key = getEnv("EPAY_KEY")
  const sig1 = md5(filtered + key)

  const q = new URLSearchParams({
    ...Object.fromEntries(new URLSearchParams(filtered)),
    sign: sig1,
    sign_type: "MD5",
  }).toString()

  const base = getEnv("EPAY_API").replace(/\/+$/, "")
  return `${base}?${q}`
}

export function verifyEpay(params: Record<string, string>) {
  const filtered = Object.entries(params)
    .filter(([k, v]) => v && k !== "sign" && k !== "sign_type")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&")

  const key = getEnv("EPAY_KEY")
  const got = (params.sign || "").toLowerCase()
  const a = md5(filtered + key)
  const b = md5(filtered + "&key=" + key)
  return got === a || got === b // 双分支兼容
}
