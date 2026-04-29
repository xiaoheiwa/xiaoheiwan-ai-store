import { neon } from "@neondatabase/serverless"

let sql: any = null
let connectionInitialized = false

function createMockSql() {
  const mockSql = (strings: TemplateStringsArray, ...values: any[]) => {
    console.log("[v0] Mock SQL called - database not available")
    return Promise.resolve([])
  }
  mockSql.query = (query: string, values?: any[]) => {
    console.log("[v0] Mock SQL query called - database not available")
    return Promise.resolve({ rows: [] })
  }
  return mockSql
}

function initializeConnection() {
  if (connectionInitialized && sql) return sql
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING
  if (!databaseUrl) {
    console.error("[v0] No database URL found, using fallback")
    sql = createMockSql()
    connectionInitialized = true
    return sql
  }
  try {
    sql = neon(databaseUrl)
    connectionInitialized = true
    return sql
  } catch (error) {
    console.error("[v0] Failed to initialize database:", error)
    sql = createMockSql()
    connectionInitialized = true
    return sql
  }
}

const getSql = () => {
  if (!sql) sql = initializeConnection()
  return sql
}

export interface ActivationCode {
  id: string
  code: string
  status: "available" | "locked" | "sold"
  product_id?: string
  created_at: Date
  sold_at?: Date
  locked_at?: Date
  locked_by?: string
}

export interface Order {
  out_trade_no: string
  email: string
  amount: number
  subject: string
  status: "pending" | "paid" | "failed" | "refunded"
  pay_channel: string
  product_id?: string
  code?: string
  quantity: number
  delivery_type: "auto" | "manual"
  selected_region?: string
  region_name?: string
  created_at: Date
  paid_at?: Date
  fulfilled_at?: Date
  gateway_resp?: string
  notify_raw?: string
  updated_at: Date
  [key: string]: any
}

export interface PriceTier {
  min_qty: number
  price: number
}

export interface RegionOption {
  code: string
  name: string
  price?: number
}

export interface Product {
  id: string
  name: string
  description: string
  details: string | null
  price: number
  original_price: number | null
  sku: string
  status: "active" | "paused" | "inactive"
  sort_order: number
  delivery_type: "auto" | "manual"
  price_tiers: PriceTier[] | null
  region_options: RegionOption[] | null
  require_region_selection: boolean
  image_url: string | null
  stock_count?: number
  created_at: Date
  updated_at: Date
}

export interface PriceConfig {
  id: number
  global_price: number
  updated_at: Date
}

export class Database {
  private static async executeQuery<T>(operation: () => Promise<T>, fallbackValue?: T): Promise<T> {
    try {
      getSql()
      return await operation()
    } catch (error) {
      console.error("[v0] Database operation failed:", error)
      if (fallbackValue !== undefined) return fallbackValue
      throw error
    }
  }

  // ========== Product Management ==========
  static async getAllProducts(): Promise<Product[]> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`
        SELECT p.*,
          (SELECT COUNT(*) FROM activation_codes ac WHERE ac.product_id = p.id AND ac.status = 'available') as stock_count
        FROM products p
        ORDER BY p.sort_order ASC, p.created_at DESC
      `
      return result as Product[]
    }, [])
  }

  static async getActiveProducts(): Promise<Product[]> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`
        SELECT p.*,
          (SELECT COUNT(*) FROM activation_codes ac WHERE ac.product_id = p.id AND ac.status = 'available') as stock_count
        FROM products p
        WHERE p.status = 'active'
        ORDER BY p.sort_order ASC, p.created_at DESC
      `
      return result as Product[]
    }, [])
  }

  static async getProduct(id: string): Promise<Product | null> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`SELECT * FROM products WHERE id = ${id}`
      return result[0] || null
    }, null)
  }

  static async createProduct(data: {
    name: string
    description?: string
    details?: string
    price: number
    original_price?: number
    sku?: string
    sort_order?: number
    delivery_type?: "auto" | "manual"
    price_tiers?: PriceTier[] | null
    category_id?: string | null
    region_options?: RegionOption[] | null
    require_region_selection?: boolean
    image_url?: string | null
  }): Promise<Product> {
    return this.executeQuery(async () => {
      const s = getSql()
      const priceTiersJson = data.price_tiers ? JSON.stringify(data.price_tiers) : null
      const regionOptionsJson = data.region_options ? JSON.stringify(data.region_options) : null
      const result = await s`
        INSERT INTO products (id, name, description, details, price, original_price, sku, status, sort_order, delivery_type, price_tiers, category_id, region_options, require_region_selection, image_url, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${data.name},
          ${data.description || ""},
          ${data.details || null},
          ${data.price},
          ${data.original_price || null},
          ${data.sku || ""},
          'active',
          ${data.sort_order || 0},
          ${data.delivery_type || "auto"},
          ${priceTiersJson}::jsonb,
          ${data.category_id || null},
          ${regionOptionsJson}::jsonb,
          ${data.require_region_selection || false},
          ${data.image_url || null},
          NOW(), NOW()
        )
        RETURNING *
      `
      return result[0] as Product
    })
  }

  static async updateProduct(id: string, data: {
    name?: string
    description?: string
    details?: string | null
    price?: number
    original_price?: number | null
    sku?: string
    status?: string
    sort_order?: number
    delivery_type?: "auto" | "manual"
    price_tiers?: PriceTier[] | null
    category_id?: string | null
    region_options?: RegionOption[] | null
    require_region_selection?: boolean
    image_url?: string | null
  }): Promise<Product | null> {
    return this.executeQuery(async () => {
      const s = getSql()
      const hasOriginalPrice = "original_price" in data
      const hasDetails = "details" in data
      const hasPriceTiers = "price_tiers" in data
      const hasCategoryId = "category_id" in data
      const hasRegionOptions = "region_options" in data
      const hasRequireRegionSelection = "require_region_selection" in data
      const hasImageUrl = "image_url" in data
      const priceTiersJson = hasPriceTiers ? (data.price_tiers ? JSON.stringify(data.price_tiers) : null) : null
      const regionOptionsJson = hasRegionOptions ? (data.region_options ? JSON.stringify(data.region_options) : null) : null
      // 处理空字符串为 null
      const nameVal = data.name || null
      const descVal = data.description ?? null
      const detailsVal = hasDetails ? (data.details || null) : null
      const skuVal = data.sku || null
      const statusVal = data.status || null
      const deliveryTypeVal = data.delivery_type || null
      const imageUrlVal = hasImageUrl ? (data.image_url || null) : null
      const originalPriceVal = hasOriginalPrice ? (data.original_price ?? null) : null
      const categoryIdVal = hasCategoryId ? (data.category_id || null) : null

      const result = await s`
        UPDATE products SET
          name = COALESCE(${nameVal}, name),
          description = COALESCE(${descVal}, description),
          details = CASE WHEN ${hasDetails} THEN ${detailsVal}::text ELSE details END,
          price = COALESCE(${data.price ?? null}, price),
          original_price = CASE WHEN ${hasOriginalPrice} THEN ${originalPriceVal}::numeric ELSE original_price END,
          sku = COALESCE(${skuVal}, sku),
          status = COALESCE(${statusVal}, status),
          sort_order = COALESCE(${data.sort_order ?? null}, sort_order),
          delivery_type = COALESCE(${deliveryTypeVal}, delivery_type),
          price_tiers = CASE WHEN ${hasPriceTiers} THEN ${priceTiersJson}::jsonb ELSE price_tiers END,
          category_id = CASE WHEN ${hasCategoryId} THEN ${categoryIdVal}::uuid ELSE category_id END,
          region_options = CASE WHEN ${hasRegionOptions} THEN ${regionOptionsJson}::jsonb ELSE region_options END,
          require_region_selection = CASE WHEN ${hasRequireRegionSelection} THEN ${hasRequireRegionSelection ? (data.require_region_selection ?? false) : false}::boolean ELSE require_region_selection END,
          image_url = CASE WHEN ${hasImageUrl} THEN ${imageUrlVal}::text ELSE image_url END,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return result[0] || null
    }, null)
  }

  static async deleteProduct(id: string): Promise<boolean> {
    return this.executeQuery(async () => {
      const s = getSql()
      await s`DELETE FROM products WHERE id = ${id}`
      return true
    }, false)
  }

  // ========== Activation Code Management ==========
  static async getAvailableCodesCount(): Promise<number> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`SELECT COUNT(*) as count FROM activation_codes WHERE status = 'available'`
      return Number.parseInt(result[0].count)
    }, 0)
  }

  static async getAvailableCodesCountByProduct(productId: string): Promise<number> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`SELECT COUNT(*) as count FROM activation_codes WHERE status = 'available' AND product_id = ${productId}`
      return Number.parseInt(result[0].count)
    }, 0)
  }

  static async lockCode(orderNo: string): Promise<ActivationCode | null> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`
        UPDATE activation_codes
        SET status = 'locked', locked_by = ${orderNo}, locked_at = NOW()
        WHERE id = (
          SELECT id FROM activation_codes WHERE status = 'available' ORDER BY created_at ASC LIMIT 1
        )
        RETURNING *
      `
      return result[0] || null
    }, null)
  }

  static async lockCodeByProduct(orderNo: string, productId: string): Promise<ActivationCode | null> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`
        UPDATE activation_codes
        SET status = 'locked', locked_by = ${orderNo}, locked_at = NOW()
        WHERE id = (
          SELECT id FROM activation_codes WHERE status = 'available' AND product_id = ${productId} ORDER BY created_at ASC LIMIT 1
        )
        RETURNING *
      `
      return result[0] || null
    }, null)
  }

  static async lockMultipleCodesByProduct(orderNo: string, productId: string, quantity: number): Promise<ActivationCode[]> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`
        UPDATE activation_codes
        SET status = 'locked', locked_by = ${orderNo}, locked_at = NOW()
        WHERE id IN (
          SELECT id FROM activation_codes WHERE status = 'available' AND product_id = ${productId} ORDER BY created_at ASC LIMIT ${quantity}
        )
        RETURNING *
      `
      return result as ActivationCode[]
    }, [])
  }

  static async sellCode(orderNo: string): Promise<ActivationCode | null> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`
        UPDATE activation_codes SET status = 'sold', sold_at = NOW() WHERE locked_by = ${orderNo} RETURNING *
      `
      return result[0] || null
    }, null)
  }

  static async sellMultipleCodes(orderNo: string): Promise<ActivationCode[]> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`
        UPDATE activation_codes SET status = 'sold', sold_at = NOW() WHERE locked_by = ${orderNo} RETURNING *
      `
      return result as ActivationCode[]
    }, [])
  }

  static async releaseLockedCode(orderNo: string): Promise<void> {
    await this.executeQuery(async () => {
      const s = getSql()
      await s`UPDATE activation_codes SET status = 'available', locked_by = NULL, locked_at = NULL WHERE locked_by = ${orderNo}`
    })
  }

  static async createPurchaseBatch(batch: {
    batchName: string
    productId?: string | null
    unitCost: number
    quantity: number
    supplier?: string | null
    notes?: string | null
  }): Promise<string> {
    return this.executeQuery(async () => {
      const s = getSql()
      const totalCost = batch.unitCost * batch.quantity
      const result = await s`
        INSERT INTO purchase_batches (batch_name, product_id, unit_cost, quantity, total_cost, supplier, notes, created_at)
        VALUES (${batch.batchName}, ${batch.productId || null}, ${batch.unitCost}, ${batch.quantity}, ${totalCost}, ${batch.supplier || null}, ${batch.notes || null}, NOW())
        RETURNING id
      `
      return String(result[0].id)
    }, "")
  }

  static async addCodes(codes: string[], batchId?: string | number | null): Promise<number> {
    let addedCount = 0
    const batchIdInt = batchId ? Number(batchId) : null
    for (const code of codes) {
      try {
        await getSql()`INSERT INTO activation_codes (id, code, status, batch_id, created_at) VALUES (gen_random_uuid(), ${code}, 'available', ${batchIdInt}, NOW())`
        addedCount++
      } catch (error) {
        console.log("Code already exists, skipping")
      }
    }
    return addedCount
  }

  static async addCodesForProduct(codes: string[], productId: string, batchId?: string | number | null): Promise<number> {
    let addedCount = 0
    const batchIdInt = batchId ? Number(batchId) : null
    for (const code of codes) {
      try {
        await getSql()`INSERT INTO activation_codes (id, code, status, product_id, batch_id, created_at) VALUES (gen_random_uuid(), ${code}, 'available', ${productId}, ${batchIdInt}, NOW())`
        addedCount++
      } catch (error) {
        console.log("Code already exists, skipping")
      }
    }
    return addedCount
  }

  static async getPurchaseBatches(limit = 50, offset = 0) {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`
        SELECT pb.*, p.name as product_name,
          COALESCE((SELECT COUNT(*) FROM activation_codes ac WHERE ac.batch_id = pb.id), 0) as codes_count,
          COALESCE((SELECT COUNT(*) FROM activation_codes ac WHERE ac.batch_id = pb.id AND ac.status = 'sold'), 0) as sold_count
        FROM purchase_batches pb
        LEFT JOIN products p ON pb.product_id = p.id
        ORDER BY pb.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      return result as any[]
    }, [])
  }

  static async updatePurchaseBatch(id: number, data: {
    batchName?: string
    productId?: string | null
    unitCost?: number
    quantity?: number
    supplier?: string | null
    notes?: string | null
  }): Promise<boolean> {
    return this.executeQuery(async () => {
      const s = getSql()
      // Fetch current values to merge
      const current = await s`SELECT * FROM purchase_batches WHERE id = ${id}`
      if (!current.length) return false

      const batchName = data.batchName ?? current[0].batch_name
      const unitCost = data.unitCost ?? Number(current[0].unit_cost)
      const quantity = data.quantity ?? Number(current[0].quantity)
      const totalCost = unitCost * quantity
      const supplier = data.supplier !== undefined ? data.supplier : current[0].supplier
      const notes = data.notes !== undefined ? data.notes : current[0].notes

      await s`
        UPDATE purchase_batches SET
          batch_name = ${batchName},
          unit_cost = ${unitCost},
          quantity = ${quantity},
          total_cost = ${totalCost},
          supplier = ${supplier},
          notes = ${notes}
        WHERE id = ${id}
      `
      return true
    }, false)
  }

  static async deletePurchaseBatch(id: number): Promise<boolean> {
    return this.executeQuery(async () => {
      const s = getSql()
      // Unlink activation_codes from this batch before deleting
      await s`UPDATE activation_codes SET batch_id = NULL WHERE batch_id = ${id}`
      await s`DELETE FROM purchase_batches WHERE id = ${id}`
      return true
    }, false)
  }

  static async getAllCodes(limit = 100, offset = 0): Promise<ActivationCode[]> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`
        SELECT ac.*, p.name as product_name
        FROM activation_codes ac
        LEFT JOIN products p ON ac.product_id = p.id
        ORDER BY ac.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      return result as ActivationCode[]
    }, [])
  }

  // ========== Order Management ==========
  static async createOrder(order: Partial<Order>): Promise<Order> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`
        INSERT INTO orders (
          out_trade_no, email, amount, subject, status, pay_channel, product_id, code,
          quantity, delivery_type, selected_region, region_name,
          paid_at, fulfilled_at, gateway_resp, notify_raw, query_password_hash, created_at, updated_at
        ) VALUES (
          ${order.out_trade_no}, ${order.email}, ${order.amount}, ${order.subject},
          ${order.status}, ${order.pay_channel}, ${order.product_id || null}, ${order.code || null},
          ${order.quantity || 1}, ${order.delivery_type || "auto"},
          ${order.selected_region || null}, ${order.region_name || null},
          ${order.paid_at || null}, ${order.fulfilled_at || null},
          ${order.gateway_resp || null}, ${order.notify_raw || null},
          ${order.query_password_hash || null},
          NOW(), NOW()
        )
        RETURNING *
      `
      return result[0] as Order
    }, {} as Order)
  }

  static async updateOrder(orderNo: string, updates: Record<string, any>): Promise<Order | null> {
    const entries = Object.entries(updates).filter(([_, value]) => value !== undefined)
    if (entries.length === 0) return null
    try {
      if (entries.length === 1) {
        const [key, value] = entries[0]
        const result = await getSql()`
          UPDATE orders SET ${getSql()(key)} = ${value}, updated_at = NOW() WHERE out_trade_no = ${orderNo} RETURNING *
        `
        return result?.[0] || null
      }
      let query = "UPDATE orders SET "
      const setClauses: string[] = []
      for (let i = 0; i < entries.length; i++) {
        setClauses.push(`${entries[i][0]} = $${i + 2}`)
      }
      query += setClauses.join(", ") + ", updated_at = NOW() WHERE out_trade_no = $1 RETURNING *"
      const values = [orderNo, ...entries.map(([_, value]) => value)]
      const result = await getSql().query(query, values)
      return result?.rows?.[0] || null
    } catch (error) {
      console.log("[v0] Error in updateOrder:", error)
      return null
    }
  }

  static async getOrder(orderNo: string): Promise<Order | null> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`SELECT * FROM orders WHERE out_trade_no = ${orderNo}`
      return result[0] || null
    }, null)
  }

  static async getAllOrders(limit = 100, offset = 0): Promise<Order[]> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`
        SELECT o.*, p.name as product_name
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        ORDER BY o.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      return result as Order[]
    }, [])
  }

  static async getOrderStats() {
    return this.executeQuery(
      async () => {
        const s = getSql()
        const [totalResult, paidResult, pendingResult, todayResult] = await Promise.all([
          s`SELECT COUNT(*) as count FROM orders`,
          s`SELECT COUNT(*) as count FROM orders WHERE status = 'paid'`,
          s`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`,
          s`SELECT COUNT(*) as sales, COALESCE(SUM(amount), 0) as revenue FROM orders WHERE status = 'paid' AND DATE(created_at) = CURRENT_DATE`,
        ])
        return {
          total: Number.parseInt(totalResult[0].count),
          paid: Number.parseInt(paidResult[0].count),
          pending: Number.parseInt(pendingResult[0].count),
          today_sales: Number.parseInt(todayResult[0].sales),
          today_revenue: Number.parseFloat(todayResult[0].revenue),
        }
      },
      { total: 0, paid: 0, pending: 0, today_sales: 0, today_revenue: 0 },
    )
  }

  // ========== Price Management ==========
  static async getGlobalPrice(): Promise<number> {
    return this.executeQuery(async () => {
      const s = getSql()
      const result = await s`SELECT global_price FROM price_config ORDER BY id DESC LIMIT 1`
      return result[0]?.global_price || 99
    }, 99)
  }

  static async setGlobalPrice(price: number): Promise<void> {
    await this.executeQuery(async () => {
      const s = getSql()
      await s`INSERT INTO price_config (global_price, updated_at) VALUES (${price}, NOW()) ON CONFLICT (id) DO UPDATE SET global_price = ${price}, updated_at = NOW()`
    })
  }

  // ========== Admin Dashboard Stats ==========
  static async getStats() {
    return this.executeQuery(
      async () => {
        const s = getSql()
        const [orderStats, stockCount, currentPrice] = await Promise.all([
          this.getOrderStats(),
          this.getAvailableCodesCount(),
          this.getGlobalPrice(),
        ])
        const revenueResult = await s`SELECT COALESCE(SUM(amount), 0) as total_revenue FROM orders WHERE status = 'paid'`
        return {
          totalOrders: orderStats.total,
          paidOrders: orderStats.paid,
          totalRevenue: Number.parseFloat(revenueResult[0].total_revenue),
          stockCount,
          currentPrice,
        }
      },
      { totalOrders: 0, paidOrders: 0, totalRevenue: 0, stockCount: 0, currentPrice: 99 },
    )
  }
}

export const getOrder = Database.getOrder.bind(Database)
export const createOrder = Database.createOrder.bind(Database)
export const getPrice = Database.getGlobalPrice.bind(Database)
export const getCurrentPrice = Database.getGlobalPrice.bind(Database)
export const getAvailableCodesCount = Database.getAvailableCodesCount.bind(Database)
export const updateOrderStatus = (orderNo: string, status: Order["status"]) => Database.updateOrder(orderNo, { status })
export const updateOrder = Database.updateOrder.bind(Database)
export const importActivationCodes = Database.addCodes.bind(Database)
export const updatePrice = Database.setGlobalPrice.bind(Database)
export const allocateActivationCode = async (orderNo: string): Promise<string | null> => {
  const lockedCode = await Database.lockCode(orderNo)
  if (lockedCode) {
    const soldCode = await Database.sellCode(orderNo)
    return soldCode?.code || null
  }
  return null
}

export const lockAndSellActivationCode = async (): Promise<string | null> => {
  const tempId = `auto_${Date.now()}`
  const lockedCode = await Database.lockCode(tempId)
  if (lockedCode) {
    const soldCode = await Database.sellCode(tempId)
    return soldCode?.code || null
  }
  return null
}

export const db = Database
export { getSql as sql }
