import { neon } from "@neondatabase/serverless"

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  ""

if (!DATABASE_URL) {
  console.error("[v0] DATABASE_URL environment variable is missing")
  console.error("[v0] Please add DATABASE_URL to your Project Settings (gear icon > Environment Variables)")
  console.error("[v0] Get your connection string from Neon Dashboard > Connection Details")
  throw new Error("DATABASE_URL environment variable is required. Please configure it in Project Settings.")
}

console.log("[v0] Database connection initialized successfully")
export const sql = neon(DATABASE_URL)
