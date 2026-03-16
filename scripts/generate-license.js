#!/usr/bin/env node
/**
 * 授权码生成工具
 * 
 * 使用方法：
 *   node scripts/generate-license.js <域名> [有效期天数]
 * 
 * 示例：
 *   node scripts/generate-license.js example.com        # 1年授权
 *   node scripts/generate-license.js example.com 30     # 30天授权
 *   node scripts/generate-license.js example.com 0      # 永久授权
 */

const crypto = require("crypto")

// 重要：与 lib/license.ts 中的 INTERNAL_SECRET 保持一致！
const INTERNAL_SECRET = "XHW-2024-SECRET-KEY-CHANGE-THIS-TO-YOUR-OWN"

function normalizeDomain(domain) {
  let normalized = domain.toLowerCase()
  normalized = normalized.replace(/^https?:\/\//, "")
  normalized = normalized.split("/")[0]
  normalized = normalized.replace(/^www\./, "")
  return normalized
}

function generateLicenseKey(domain, expiryDays = 365) {
  const normalizedDomain = normalizeDomain(domain)
  const expiry = expiryDays > 0 
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : "permanent"
  
  const data = `${normalizedDomain}|${expiry}`
  const signature = crypto.createHmac("sha256", INTERNAL_SECRET)
    .update(data)
    .digest("hex")
    .substring(0, 16)
  
  return Buffer.from(`${data}|${signature}`).toString("base64")
}

// 命令行参数
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log(`
授权码生成工具
==============

使用方法：
  node scripts/generate-license.js <域名> [有效期天数]

参数说明：
  域名          客户的网站域名（如 example.com）
  有效期天数    授权有效期，默认365天，设为0表示永久授权

示例：
  node scripts/generate-license.js shop.example.com        # 1年授权
  node scripts/generate-license.js shop.example.com 30     # 30天试用
  node scripts/generate-license.js shop.example.com 0      # 永久授权
`)
  process.exit(0)
}

const domain = args[0]
const expiryDays = parseInt(args[1]) || 365

const licenseKey = generateLicenseKey(domain, expiryDays)
const normalizedDomain = normalizeDomain(domain)
const expiryText = expiryDays > 0 
  ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  : "永久"

console.log(`
============================================
           授权码生成成功
============================================

授权域名：${normalizedDomain}
有效期至：${expiryText}

授权码：
${licenseKey}

--------------------------------------------

客户配置方法：
在 Vercel 环境变量中添加：
  LICENSE_KEY = ${licenseKey}

============================================
`)
