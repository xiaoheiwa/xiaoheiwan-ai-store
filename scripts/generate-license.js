/**
 * 授权码生成工具
 * 
 * 使用方法:
 * node scripts/generate-license.js <domain> [secret-key]
 * 
 * 示例:
 * node scripts/generate-license.js example.com
 * node scripts/generate-license.js example.com my-super-secret-key
 * 
 * 生成的授权码需要客户设置到环境变量 LICENSE_KEY
 */

const crypto = require("crypto")

// 默认密钥（请更改为你自己的密钥，并保密！）
const DEFAULT_SECRET_KEY = "your-super-secret-key-change-this"

function normalizeDomain(domain) {
  let normalized = domain.toLowerCase()
  normalized = normalized.replace(/^https?:\/\//, "")
  normalized = normalized.split("/")[0]
  normalized = normalized.replace(/^www\./, "")
  return normalized
}

function generateLicenseKey(domain, secretKey) {
  const normalizedDomain = normalizeDomain(domain)
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(normalizedDomain)
    .digest("hex")
  return Buffer.from(`${normalizedDomain}:${signature}`).toString("base64")
}

// 命令行参数
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    授权码生成工具                              ║
╠══════════════════════════════════════════════════════════════╣
║  使用方法:                                                    ║
║  node scripts/generate-license.js <domain> [secret-key]      ║
║                                                              ║
║  示例:                                                        ║
║  node scripts/generate-license.js example.com                ║
║  node scripts/generate-license.js shop.example.com my-key    ║
╚══════════════════════════════════════════════════════════════╝
`)
  process.exit(1)
}

const domain = args[0]
const secretKey = args[1] || DEFAULT_SECRET_KEY

const normalizedDomain = normalizeDomain(domain)
const licenseKey = generateLicenseKey(domain, secretKey)

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    授权码生成成功                              ║
╠══════════════════════════════════════════════════════════════╣
║  域名: ${normalizedDomain.padEnd(52)}║
║  密钥: ${(secretKey.length > 20 ? secretKey.slice(0, 17) + "..." : secretKey).padEnd(52)}║
╠══════════════════════════════════════════════════════════════╣
║  授权码 (LICENSE_KEY):                                        ║
╚══════════════════════════════════════════════════════════════╝

${licenseKey}

╔══════════════════════════════════════════════════════════════╗
║  客户需要在 Vercel 项目中设置以下环境变量:                      ║
╠══════════════════════════════════════════════════════════════╣
║  LICENSE_KEY=${licenseKey.slice(0, 40)}...
║  LICENSE_SECRET_KEY=${secretKey.slice(0, 35)}...
╚══════════════════════════════════════════════════════════════╝

注意: 
- LICENSE_SECRET_KEY 必须与生成授权码时使用的密钥一致
- 建议为每个客户使用相同的 LICENSE_SECRET_KEY
- 请妥善保管你的密钥，不要泄露给客户
`)
