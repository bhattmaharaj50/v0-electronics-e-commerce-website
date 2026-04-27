import { Pool } from "pg"
import { categories as defaultCategories, products as defaultProducts, type Product } from "@/lib/products"

// ===== Types =====

export interface Category {
  slug: string
  name: string
  icon: string
}

export interface SiteSettings {
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  flashSaleTitle: string
  dealOfDayTitle: string
  holidayDealsTitle: string
  adminPhone: string
  mpesaNumber: string
  logoText: string
  logoUrl: string
  heroImageUrl: string
  heroAdVideoUrl: string
  heroAdTitle: string
  heroAdSubtitle: string
  pickupLocation: string
  businessName: string
  heroGalleryImages: string
  heroGalleryVideos: string
  brandLogos: string
  brandsTitle: string
}

export interface OrderRecord {
  id: number
  orderNumber: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
  }
  items: Array<{ product: Product; quantity: number }>
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: string
  mpesaCode?: string
  status: string
  whatsappUrl: string
  pickupLocation?: string
  customerWhatsappUrl?: string
  paidAt?: string
  readyAt?: string
  dispatchedAt?: string
  createdAt: string
}

export interface ProductReview {
  id: number
  productId: string
  name: string
  rating: number
  comment: string
  createdAt: string
}

export type AdminRole = "owner" | "staff"

export interface AdminUser {
  id: number
  username: string
  fullName: string
  role: AdminRole
  createdAt: string
  lastLoginAt: string | null
}

export interface AdminSession {
  token: string
  userId: number
  expiresAt: string
}

export interface PageView {
  path: string
  views: number
}

export interface LocationStat {
  label: string
  views: number
}

export interface TrafficAnalytics {
  totalViews: number
  uniqueVisitors: number
  viewsLast24h: number
  viewsLast7d: number
  viewsLast30d: number
  topPages: PageView[]
  topCountries: LocationStat[]
  topCities: LocationStat[]
  topReferrers: LocationStat[]
  recentVisits: Array<{
    path: string
    country: string
    city: string
    referrer: string
    userAgent: string
    createdAt: string
  }>
  dailySeries: Array<{ day: string; views: number }>
}

export interface SalesReport {
  range: number
  totalRevenue: number
  paidRevenue: number
  totalOrders: number
  paidOrders: number
  pendingOrders: number
  averageOrderValue: number
  revenueByDay: Array<{ day: string; revenue: number; orders: number }>
  topProducts: Array<{ id: string; name: string; quantity: number; revenue: number }>
  statusCounts: Record<string, number>
  salesByCategory: Array<{ category: string; revenue: number; quantity: number }>
}

// ===== Defaults =====

const defaultSettings: SiteSettings = {
  heroBadge: "Kenya's Trusted Electronics Store",
  heroTitle: "Premium Electronics, Delivered to Your Door",
  heroSubtitle: "Shop the latest TVs, smartphones, gaming consoles, and home appliances at competitive prices across Kenya.",
  flashSaleTitle: "Flash Sales",
  dealOfDayTitle: "Deal of the Day",
  holidayDealsTitle: "Holiday Deals",
  adminPhone: "254720856892",
  mpesaNumber: "0720856892",
  logoText: "Munex Electronics",
  logoUrl: "",
  heroImageUrl: "/images/hero-electronics.jpg",
  heroAdVideoUrl: "",
  heroAdTitle: "See What's New",
  heroAdSubtitle: "Watch our latest product showcase",
  pickupLocation: "Nairobi: Electronics House, Luthuli Street, Shop G7  •  Narok: Mosque Road",
  businessName: "Munex Electronics",
  heroGalleryImages: "[]",
  heroGalleryVideos: "[]",
  brandLogos: "[]",
  brandsTitle: "Trusted Brands We Stock",
}

// ===== Pool =====

const SCHEMA_VERSION = 2
const ALL_TABLES = [
  "admin_sessions",
  "admin_users",
  "page_views",
  "ip_geo_cache",
  "product_reviews",
  "orders",
  "products",
  "categories",
  "site_settings",
  "schema_version",
]

const globalForDb = globalThis as unknown as { munexPool?: Pool; munexReady?: Promise<void> }

function shouldUseSsl(url: string | undefined): boolean {
  if (!url) return false
  if (process.env.NODE_ENV === "production") return true
  if (/sslmode=require/i.test(url)) return true
  if (/\.neon\.tech|\.supabase\.co|\.aws\.neon\.|\.pooler\./i.test(url)) return true
  return false
}

export const pool =
  globalForDb.munexPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: shouldUseSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

if (process.env.NODE_ENV !== "production") globalForDb.munexPool = pool

// ===== Row mappers =====

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  return Number(value)
}

function toIso(value: any): string {
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function productFromRow(row: any): Product {
  let images: string[] = []
  if (Array.isArray(row.images)) images = row.images.filter(Boolean)
  else if (typeof row.images === "string") {
    try {
      const parsed = JSON.parse(row.images)
      if (Array.isArray(parsed)) images = parsed.filter(Boolean)
    } catch {}
  }
  return {
    id: row.id,
    name: row.name,
    price: toNumber(row.price),
    originalPrice: row.original_price === null ? undefined : toNumber(row.original_price),
    description: row.description,
    category: row.category,
    brand: row.brand,
    size: row.size || undefined,
    color: row.color || undefined,
    image: row.image,
    images,
    videoUrl: row.video_url || undefined,
    rating: toNumber(row.rating),
    reviews: Number(row.reviews || 0),
    badge: row.badge || undefined,
    featured: Boolean(row.featured),
    stock: Number(row.stock || 0),
    offerType: row.offer_type || "",
  }
}

function orderFromRow(row: any): OrderRecord {
  return {
    id: Number(row.id),
    orderNumber: row.order_number,
    customer: row.customer,
    items: row.items,
    subtotal: toNumber(row.subtotal),
    deliveryFee: toNumber(row.delivery_fee),
    total: toNumber(row.total),
    paymentMethod: row.payment_method,
    mpesaCode: row.mpesa_code || undefined,
    status: row.status,
    whatsappUrl: row.whatsapp_url,
    pickupLocation: row.pickup_location || undefined,
    customerWhatsappUrl: row.customer_whatsapp_url || undefined,
    paidAt: row.paid_at ? toIso(row.paid_at) : undefined,
    readyAt: row.ready_at ? toIso(row.ready_at) : undefined,
    dispatchedAt: row.dispatched_at ? toIso(row.dispatched_at) : undefined,
    createdAt: toIso(row.created_at),
  }
}

function reviewFromRow(row: any): ProductReview {
  return {
    id: Number(row.id),
    productId: row.product_id,
    name: row.name,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: toIso(row.created_at),
  }
}

function adminUserFromRow(row: any): AdminUser {
  return {
    id: Number(row.id),
    username: row.username,
    fullName: row.full_name || "",
    role: row.role === "owner" ? "owner" : "staff",
    createdAt: toIso(row.created_at),
    lastLoginAt: row.last_login_at ? toIso(row.last_login_at) : null,
  }
}

// ===== Schema setup (full reset on version mismatch) =====

export async function ensureDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured. Create a Replit PostgreSQL database first.")
  }
  if (!globalForDb.munexReady) {
    globalForDb.munexReady = setupDatabase()
  }
  await globalForDb.munexReady
}

async function setupDatabase() {
  // Determine if we're on the new schema. If not, wipe everything and recreate.
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_version (version INT PRIMARY KEY)`)
  const versionResult = await pool.query("SELECT version FROM schema_version LIMIT 1")
  const currentVersion = versionResult.rows[0]?.version ?? 0

  if (currentVersion !== SCHEMA_VERSION) {
    console.log(`[db] Schema v${currentVersion} → v${SCHEMA_VERSION}. Performing full reset.`)
    for (const table of ALL_TABLES) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`)
    }
    await pool.query(`CREATE TABLE schema_version (version INT PRIMARY KEY)`)
    await createSchema()
    await seedDefaults()
    await pool.query("INSERT INTO schema_version (version) VALUES ($1)", [SCHEMA_VERSION])
    console.log(`[db] Schema v${SCHEMA_VERSION} ready.`)
  }
}

async function createSchema() {
  await pool.query(`
    CREATE TABLE categories (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Package',
      sort_order INT NOT NULL DEFAULT 100,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC NOT NULL DEFAULT 0,
      original_price NUMERIC,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT '',
      size TEXT,
      color TEXT,
      image TEXT NOT NULL DEFAULT '',
      images JSONB NOT NULL DEFAULT '[]'::jsonb,
      video_url TEXT,
      rating NUMERIC NOT NULL DEFAULT 4.5,
      reviews INTEGER NOT NULL DEFAULT 0,
      badge TEXT,
      featured BOOLEAN NOT NULL DEFAULT false,
      stock INTEGER NOT NULL DEFAULT 10,
      offer_type TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_products_category ON products(category);
    CREATE INDEX idx_products_offer ON products(offer_type);

    CREATE TABLE site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer JSONB NOT NULL,
      items JSONB NOT NULL,
      subtotal NUMERIC NOT NULL DEFAULT 0,
      delivery_fee NUMERIC NOT NULL DEFAULT 0,
      total NUMERIC NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL,
      mpesa_code TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      whatsapp_url TEXT NOT NULL DEFAULT '',
      pickup_location TEXT,
      customer_whatsapp_url TEXT,
      paid_at TIMESTAMP,
      ready_at TIMESTAMP,
      dispatched_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_orders_created ON orders(created_at DESC);
    CREATE INDEX idx_orders_status ON orders(status);

    CREATE TABLE product_reviews (
      id SERIAL PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      comment TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_reviews_product ON product_reviews(product_id);

    CREATE TABLE admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'staff',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMP
    );

    CREATE TABLE admin_sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_sessions_user ON admin_sessions(user_id);

    CREATE TABLE page_views (
      id BIGSERIAL PRIMARY KEY,
      path TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT,
      ip TEXT,
      country TEXT,
      country_code TEXT,
      city TEXT,
      session_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_page_views_created ON page_views(created_at DESC);
    CREATE INDEX idx_page_views_session ON page_views(session_id);

    CREATE TABLE ip_geo_cache (
      ip TEXT PRIMARY KEY,
      country TEXT,
      country_code TEXT,
      city TEXT,
      cached_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `)
}

async function seedDefaults() {
  for (const [index, category] of defaultCategories.entries()) {
    await pool.query(
      "INSERT INTO categories (slug, name, icon, sort_order) VALUES ($1, $2, $3, $4)",
      [category.slug, category.name, category.icon, index]
    )
  }

  for (const [index, product] of defaultProducts.entries()) {
    const seededProduct = {
      ...product,
      stock: product.stock ?? 10,
      offerType:
        product.offerType ??
        (product.originalPrice
          ? index % 3 === 0
            ? "flash-sale"
            : index % 3 === 1
              ? "deal-of-day"
              : "holiday-deal"
          : ""),
    }

    await pool.query(
      `INSERT INTO products (
        id, name, price, original_price, description, category, brand, size, color, image, images, video_url,
        rating, reviews, badge, featured, stock, offer_type
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        seededProduct.id,
        seededProduct.name,
        seededProduct.price,
        seededProduct.originalPrice ?? null,
        seededProduct.description,
        seededProduct.category,
        seededProduct.brand,
        seededProduct.size ?? null,
        seededProduct.color ?? null,
        seededProduct.image,
        JSON.stringify(seededProduct.images ?? []),
        seededProduct.videoUrl ?? null,
        seededProduct.rating,
        seededProduct.reviews,
        seededProduct.badge ?? null,
        seededProduct.featured ?? false,
        seededProduct.stock,
        seededProduct.offerType ?? "",
      ]
    )
  }

  for (const [key, value] of Object.entries(defaultSettings)) {
    await pool.query("INSERT INTO site_settings (key, value) VALUES ($1, $2)", [key, value])
  }

  // Seed default admin (owner role): admin / munex2024
  // Hashed lazily via bcrypt at module top level — but to avoid loading bcrypt
  // here, we delegate this to lib/auth.ts on first request. Insert a marker row
  // here so that lib/auth.ts can complete the bootstrap.
  // Actually we can call bcrypt directly:
  const bcrypt = await import("bcryptjs")
  const hash = await bcrypt.hash("munex2024", 10)
  await pool.query(
    "INSERT INTO admin_users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4)",
    ["admin", hash, "Owner", "owner"]
  )
}

// ===== Store / admin data =====

export async function getStoreData() {
  await ensureDatabase()
  const [productResult, categoryResult, settingsResult] = await Promise.all([
    pool.query("SELECT * FROM products ORDER BY updated_at DESC, name ASC"),
    pool.query("SELECT * FROM categories ORDER BY sort_order ASC, name ASC"),
    pool.query("SELECT key, value FROM site_settings"),
  ])

  const settings = { ...defaultSettings }
  for (const row of settingsResult.rows) {
    ;(settings as any)[row.key] = row.value
  }

  return {
    products: productResult.rows.map(productFromRow),
    categories: categoryResult.rows.map((r) => ({ slug: r.slug, name: r.name, icon: r.icon })) as Category[],
    settings,
  }
}

export async function getAdminData() {
  await ensureDatabase()
  const [store, ordersResult, reviewsResult] = await Promise.all([
    getStoreData(),
    pool.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200"),
    pool.query("SELECT * FROM product_reviews ORDER BY created_at DESC LIMIT 500"),
  ])
  return {
    ...store,
    orders: ordersResult.rows.map(orderFromRow),
    allReviews: reviewsResult.rows.map(reviewFromRow),
  }
}

// ===== Products =====

export async function saveProduct(product: Product) {
  await ensureDatabase()
  await pool.query(
    `INSERT INTO products (
      id, name, price, original_price, description, category, brand, size, color, image, images, video_url,
      rating, reviews, badge, featured, stock, offer_type, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      original_price = EXCLUDED.original_price,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      brand = EXCLUDED.brand,
      size = EXCLUDED.size,
      color = EXCLUDED.color,
      image = EXCLUDED.image,
      images = EXCLUDED.images,
      video_url = EXCLUDED.video_url,
      rating = EXCLUDED.rating,
      reviews = EXCLUDED.reviews,
      badge = EXCLUDED.badge,
      featured = EXCLUDED.featured,
      stock = EXCLUDED.stock,
      offer_type = EXCLUDED.offer_type,
      updated_at = NOW()`,
    [
      product.id,
      product.name,
      product.price,
      product.originalPrice ?? null,
      product.description,
      product.category,
      product.brand,
      product.size ?? null,
      product.color ?? null,
      product.image,
      JSON.stringify(product.images ?? []),
      product.videoUrl ?? null,
      product.rating,
      product.reviews,
      product.badge ?? null,
      product.featured ?? false,
      product.stock ?? 0,
      product.offerType ?? "",
    ]
  )
}

export async function deleteProduct(id: string) {
  await ensureDatabase()
  await pool.query("DELETE FROM products WHERE id = $1", [id])
}

// ===== Categories =====

export async function saveCategory(category: Category) {
  await ensureDatabase()
  await pool.query(
    `INSERT INTO categories (slug, name, icon) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon`,
    [category.slug, category.name, category.icon]
  )
}

export async function deleteCategory(slug: string) {
  await ensureDatabase()
  await pool.query("DELETE FROM categories WHERE slug = $1", [slug])
}

// ===== Settings =====

export async function saveSettings(settings: Partial<SiteSettings>) {
  await ensureDatabase()
  for (const [key, value] of Object.entries(settings)) {
    await pool.query(
      `INSERT INTO site_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, String(value ?? "")]
    )
  }
}

// ===== Orders =====

export async function createOrder(payload: Omit<OrderRecord, "id" | "createdAt" | "status">) {
  await ensureDatabase()
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const existing = await client.query("SELECT order_number FROM orders WHERE order_number = $1", [payload.orderNumber])
    if (existing.rowCount) throw new Error("Order already exists")

    for (const item of payload.items) {
      await client.query(
        "UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = NOW() WHERE id = $2",
        [item.quantity, item.product.id]
      )
    }

    const initialStatus = payload.paymentMethod === "mpesa" ? "pending_payment" : "new"

    const result = await client.query(
      `INSERT INTO orders (order_number, customer, items, subtotal, delivery_fee, total, payment_method, mpesa_code, status, whatsapp_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        payload.orderNumber,
        JSON.stringify(payload.customer),
        JSON.stringify(payload.items),
        payload.subtotal,
        payload.deliveryFee,
        payload.total,
        payload.paymentMethod,
        payload.mpesaCode ?? null,
        initialStatus,
        payload.whatsappUrl,
      ]
    )
    await client.query("COMMIT")
    return orderFromRow(result.rows[0])
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export async function updateOrderStatus(orderNumber: string, status: string) {
  await ensureDatabase()
  const result = await pool.query(
    "UPDATE orders SET status = $1, updated_at = NOW() WHERE order_number = $2 RETURNING *",
    [status, orderNumber]
  )
  if (!result.rowCount) throw new Error("Order not found")
  return orderFromRow(result.rows[0])
}

export async function deleteOrder(orderNumber: string) {
  await ensureDatabase()
  await pool.query("DELETE FROM orders WHERE order_number = $1", [orderNumber])
}

export async function markOrderPaid(orderNumber: string) {
  await ensureDatabase()
  const result = await pool.query(
    "UPDATE orders SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE order_number = $1 RETURNING *",
    [orderNumber]
  )
  if (!result.rowCount) throw new Error("Order not found")
  return orderFromRow(result.rows[0])
}

export async function markOrderReady(orderNumber: string, pickupLocation: string) {
  await ensureDatabase()
  const result = await pool.query(
    `UPDATE orders SET status = 'ready', ready_at = NOW(), pickup_location = $1, updated_at = NOW()
     WHERE order_number = $2 RETURNING *`,
    [pickupLocation, orderNumber]
  )
  if (!result.rowCount) throw new Error("Order not found")
  return orderFromRow(result.rows[0])
}

export async function markOrderDispatched(orderNumber: string, customerWhatsappUrl: string) {
  await ensureDatabase()
  const result = await pool.query(
    `UPDATE orders SET status = 'dispatched', dispatched_at = NOW(), customer_whatsapp_url = $1, updated_at = NOW()
     WHERE order_number = $2 RETURNING *`,
    [customerWhatsappUrl, orderNumber]
  )
  if (!result.rowCount) throw new Error("Order not found")
  return orderFromRow(result.rows[0])
}

// ===== Reviews =====

export async function saveReview(payload: { productId: string; name: string; rating: number; comment: string }) {
  await ensureDatabase()
  const rating = Math.max(1, Math.min(5, Math.round(payload.rating)))
  const inserted = await pool.query(
    `INSERT INTO product_reviews (product_id, name, rating, comment)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [payload.productId, payload.name.trim().slice(0, 80), rating, payload.comment.trim().slice(0, 1000)]
  )
  await refreshProductRating(payload.productId)
  return reviewFromRow(inserted.rows[0])
}

export async function listProductReviews(productId: string) {
  await ensureDatabase()
  const result = await pool.query(
    "SELECT * FROM product_reviews WHERE product_id = $1 ORDER BY created_at DESC LIMIT 100",
    [productId]
  )
  return result.rows.map(reviewFromRow)
}

export async function deleteReview(id: number) {
  await ensureDatabase()
  const target = await pool.query("SELECT product_id FROM product_reviews WHERE id = $1", [id])
  if (!target.rowCount) return
  await pool.query("DELETE FROM product_reviews WHERE id = $1", [id])
  await refreshProductRating(target.rows[0].product_id)
}

export async function updateReview(payload: { id: number; name?: string; rating?: number; comment?: string }) {
  await ensureDatabase()
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  if (payload.name !== undefined) {
    fields.push(`name = $${i++}`)
    values.push(payload.name.trim().slice(0, 80))
  }
  if (payload.rating !== undefined) {
    fields.push(`rating = $${i++}`)
    values.push(Math.max(1, Math.min(5, Math.round(payload.rating))))
  }
  if (payload.comment !== undefined) {
    fields.push(`comment = $${i++}`)
    values.push(payload.comment.trim().slice(0, 1000))
  }
  if (fields.length === 0) return
  values.push(payload.id)
  const result = await pool.query(
    `UPDATE product_reviews SET ${fields.join(", ")} WHERE id = $${i} RETURNING product_id`,
    values
  )
  if (!result.rowCount) throw new Error("Review not found")
  await refreshProductRating(result.rows[0].product_id)
}

async function refreshProductRating(productId: string) {
  const stats = await pool.query(
    "SELECT COALESCE(AVG(rating), 0)::float AS avg, COUNT(*)::int AS cnt FROM product_reviews WHERE product_id = $1",
    [productId]
  )
  const { avg, cnt } = stats.rows[0]
  if (cnt > 0) {
    await pool.query(
      "UPDATE products SET rating = $1, reviews = $2, updated_at = NOW() WHERE id = $3",
      [Number(avg.toFixed(2)), cnt, productId]
    )
  }
}

// ===== Admin users =====

export async function listAdminUsers(): Promise<AdminUser[]> {
  await ensureDatabase()
  const result = await pool.query(
    "SELECT id, username, full_name, role, created_at, last_login_at FROM admin_users ORDER BY id ASC"
  )
  return result.rows.map(adminUserFromRow)
}

export async function getAdminUserByUsername(username: string) {
  await ensureDatabase()
  const result = await pool.query("SELECT * FROM admin_users WHERE username = $1 LIMIT 1", [username])
  if (!result.rowCount) return null
  const row = result.rows[0]
  return { ...adminUserFromRow(row), passwordHash: row.password_hash as string }
}

export async function getAdminUserById(id: number) {
  await ensureDatabase()
  const result = await pool.query(
    "SELECT id, username, full_name, role, created_at, last_login_at FROM admin_users WHERE id = $1 LIMIT 1",
    [id]
  )
  if (!result.rowCount) return null
  return adminUserFromRow(result.rows[0])
}

export async function createAdminUser(payload: {
  username: string
  passwordHash: string
  fullName: string
  role: AdminRole
}) {
  await ensureDatabase()
  const result = await pool.query(
    `INSERT INTO admin_users (username, password_hash, full_name, role)
     VALUES ($1,$2,$3,$4) RETURNING id, username, full_name, role, created_at, last_login_at`,
    [payload.username, payload.passwordHash, payload.fullName, payload.role]
  )
  return adminUserFromRow(result.rows[0])
}

export async function updateAdminUser(payload: {
  id: number
  fullName?: string
  role?: AdminRole
  passwordHash?: string
}) {
  await ensureDatabase()
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  if (payload.fullName !== undefined) {
    fields.push(`full_name = $${i++}`)
    values.push(payload.fullName)
  }
  if (payload.role !== undefined) {
    fields.push(`role = $${i++}`)
    values.push(payload.role)
  }
  if (payload.passwordHash !== undefined) {
    fields.push(`password_hash = $${i++}`)
    values.push(payload.passwordHash)
  }
  if (fields.length === 0) return null
  values.push(payload.id)
  const result = await pool.query(
    `UPDATE admin_users SET ${fields.join(", ")} WHERE id = $${i}
     RETURNING id, username, full_name, role, created_at, last_login_at`,
    values
  )
  if (!result.rowCount) return null
  return adminUserFromRow(result.rows[0])
}

export async function deleteAdminUser(id: number) {
  await ensureDatabase()
  await pool.query("DELETE FROM admin_users WHERE id = $1", [id])
}

export async function touchAdminLogin(id: number) {
  await ensureDatabase()
  await pool.query("UPDATE admin_users SET last_login_at = NOW() WHERE id = $1", [id])
}

// ===== Admin sessions =====

export async function createAdminSession(userId: number, token: string, expiresAt: Date) {
  await ensureDatabase()
  await pool.query(
    "INSERT INTO admin_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)",
    [token, userId, expiresAt]
  )
}

export async function getAdminSession(token: string) {
  await ensureDatabase()
  const result = await pool.query(
    `SELECT s.token, s.user_id, s.expires_at, u.id, u.username, u.full_name, u.role, u.created_at, u.last_login_at
     FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW() LIMIT 1`,
    [token]
  )
  if (!result.rowCount) return null
  const row = result.rows[0]
  return {
    user: adminUserFromRow(row),
    session: { token: row.token, userId: Number(row.user_id), expiresAt: toIso(row.expires_at) } as AdminSession,
  }
}

export async function deleteAdminSession(token: string) {
  await ensureDatabase()
  await pool.query("DELETE FROM admin_sessions WHERE token = $1", [token])
}

export async function pruneExpiredSessions() {
  await ensureDatabase()
  await pool.query("DELETE FROM admin_sessions WHERE expires_at < NOW()")
}

// ===== Sales reports =====

export async function getSalesReport(rangeDays: number): Promise<SalesReport> {
  await ensureDatabase()
  const days = Math.max(1, Math.min(365, Math.round(rangeDays)))

  const since = `NOW() - INTERVAL '${days} days'`

  const [totals, byDayRes, topProductsRes, statusRes, byCategoryRes] = await Promise.all([
    pool.query(`
      SELECT
        COALESCE(SUM(total), 0)::float AS revenue_total,
        COALESCE(SUM(CASE WHEN status IN ('paid','confirmed','processing','ready','dispatched','delivered') THEN total ELSE 0 END), 0)::float AS revenue_paid,
        COUNT(*)::int AS orders_total,
        COUNT(*) FILTER (WHERE status IN ('paid','confirmed','processing','ready','dispatched','delivered'))::int AS orders_paid,
        COUNT(*) FILTER (WHERE status IN ('new','pending_payment'))::int AS orders_pending
      FROM orders
      WHERE created_at > ${since}
    `),
    pool.query(`
      SELECT TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
             COALESCE(SUM(total), 0)::float AS revenue,
             COUNT(*)::int AS orders
      FROM orders
      WHERE created_at > ${since}
      GROUP BY day
      ORDER BY day ASC
    `),
    pool.query(`
      SELECT v->'product'->>'id' AS id,
             v->'product'->>'name' AS name,
             SUM(COALESCE((v->>'quantity')::int, 0))::int AS quantity,
             SUM(COALESCE((v->>'quantity')::int, 0) * COALESCE((v->'product'->>'price')::numeric, 0))::float AS revenue
      FROM orders
      CROSS JOIN LATERAL jsonb_array_elements(orders.items) AS v
      WHERE orders.created_at > ${since}
      GROUP BY v->'product'->>'id', v->'product'->>'name'
      ORDER BY revenue DESC
      LIMIT 10
    `),
    pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM orders
      WHERE created_at > ${since}
      GROUP BY status
    `),
    pool.query(`
      SELECT v->'product'->>'category' AS category,
             SUM(COALESCE((v->>'quantity')::int, 0))::int AS quantity,
             SUM(COALESCE((v->>'quantity')::int, 0) * COALESCE((v->'product'->>'price')::numeric, 0))::float AS revenue
      FROM orders
      CROSS JOIN LATERAL jsonb_array_elements(orders.items) AS v
      WHERE orders.created_at > ${since}
      GROUP BY v->'product'->>'category'
      ORDER BY revenue DESC
    `),
  ])

  const dayMap = new Map<string, { revenue: number; orders: number }>()
  for (const row of byDayRes.rows) {
    dayMap.set(row.day, { revenue: Number(row.revenue) || 0, orders: Number(row.orders) || 0 })
  }
  const revenueByDay: Array<{ day: string; revenue: number; orders: number }> = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    const v = dayMap.get(key) ?? { revenue: 0, orders: 0 }
    revenueByDay.push({ day: key, revenue: v.revenue, orders: v.orders })
  }

  const statusCounts: Record<string, number> = {}
  for (const r of statusRes.rows) statusCounts[r.status] = Number(r.count) || 0

  const t = totals.rows[0]
  const ordersTotal = Number(t.orders_total) || 0
  const revenueTotal = Number(t.revenue_total) || 0

  return {
    range: days,
    totalRevenue: revenueTotal,
    paidRevenue: Number(t.revenue_paid) || 0,
    totalOrders: ordersTotal,
    paidOrders: Number(t.orders_paid) || 0,
    pendingOrders: Number(t.orders_pending) || 0,
    averageOrderValue: ordersTotal > 0 ? revenueTotal / ordersTotal : 0,
    revenueByDay,
    topProducts: topProductsRes.rows.map((r) => ({
      id: r.id || "",
      name: r.name || "Unknown product",
      quantity: Number(r.quantity) || 0,
      revenue: Number(r.revenue) || 0,
    })),
    statusCounts,
    salesByCategory: byCategoryRes.rows.map((r) => ({
      category: r.category || "uncategorized",
      revenue: Number(r.revenue) || 0,
      quantity: Number(r.quantity) || 0,
    })),
  }
}

// ===== Analytics (page views) =====

export async function recordPageView(payload: {
  path: string
  referrer?: string
  userAgent?: string
  ip?: string
  country?: string
  countryCode?: string
  city?: string
  sessionId?: string
}) {
  await ensureDatabase()
  await pool.query(
    `INSERT INTO page_views (path, referrer, user_agent, ip, country, country_code, city, session_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      payload.path.slice(0, 500),
      (payload.referrer || "").slice(0, 500) || null,
      (payload.userAgent || "").slice(0, 500) || null,
      payload.ip || null,
      payload.country || null,
      payload.countryCode || null,
      payload.city || null,
      payload.sessionId || null,
    ]
  )
}

export async function getCachedGeo(ip: string) {
  await ensureDatabase()
  const result = await pool.query(
    "SELECT country, country_code, city FROM ip_geo_cache WHERE ip = $1 AND cached_at > NOW() - INTERVAL '7 days'",
    [ip]
  )
  if (result.rowCount) {
    const row = result.rows[0]
    return { country: row.country as string | null, countryCode: row.country_code as string | null, city: row.city as string | null }
  }
  return null
}

export async function saveGeoCache(ip: string, geo: { country?: string | null; countryCode?: string | null; city?: string | null }) {
  await ensureDatabase()
  await pool.query(
    `INSERT INTO ip_geo_cache (ip, country, country_code, city, cached_at)
     VALUES ($1,$2,$3,$4,NOW())
     ON CONFLICT (ip) DO UPDATE SET country = EXCLUDED.country, country_code = EXCLUDED.country_code, city = EXCLUDED.city, cached_at = NOW()`,
    [ip, geo.country || null, geo.countryCode || null, geo.city || null]
  )
}

export function emptyAnalytics(): TrafficAnalytics {
  return {
    totalViews: 0,
    uniqueVisitors: 0,
    viewsLast24h: 0,
    viewsLast7d: 0,
    viewsLast30d: 0,
    topPages: [],
    topCountries: [],
    topCities: [],
    topReferrers: [],
    recentVisits: [],
    dailySeries: [],
  }
}

async function safeAnalyticsQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
  timeoutMs = 6000,
): Promise<T> {
  try {
    return await Promise.race<T>([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ])
  } catch (err) {
    console.error(`[analytics:${label}]`, err instanceof Error ? err.message : err)
    return fallback
  }
}

export async function getTrafficAnalytics(): Promise<TrafficAnalytics> {
  await ensureDatabase()

  const exclude = "path NOT LIKE '/admin%' AND path NOT LIKE '/api%'"

  const totals = safeAnalyticsQuery(
    "totals",
    () => pool.query(`SELECT COUNT(*)::int AS views, COUNT(DISTINCT session_id)::int AS visitors FROM page_views WHERE ${exclude}`),
    { rows: [{ views: 0, visitors: 0 }] } as any,
  )
  const day = safeAnalyticsQuery(
    "24h",
    () => pool.query(`SELECT COUNT(*)::int AS views FROM page_views WHERE ${exclude} AND created_at > NOW() - INTERVAL '24 hours'`),
    { rows: [{ views: 0 }] } as any,
  )
  const week = safeAnalyticsQuery(
    "7d",
    () => pool.query(`SELECT COUNT(*)::int AS views FROM page_views WHERE ${exclude} AND created_at > NOW() - INTERVAL '7 days'`),
    { rows: [{ views: 0 }] } as any,
  )
  const month = safeAnalyticsQuery(
    "30d",
    () => pool.query(`SELECT COUNT(*)::int AS views FROM page_views WHERE ${exclude} AND created_at > NOW() - INTERVAL '30 days'`),
    { rows: [{ views: 0 }] } as any,
  )
  const pages = safeAnalyticsQuery(
    "topPages",
    () => pool.query(`SELECT path, COUNT(*)::int AS views FROM page_views WHERE ${exclude} AND created_at > NOW() - INTERVAL '30 days' GROUP BY path ORDER BY views DESC LIMIT 10`),
    { rows: [] } as any,
  )
  const countries = safeAnalyticsQuery(
    "topCountries",
    () => pool.query(`SELECT COALESCE(NULLIF(country, ''), 'Unknown') AS label, COUNT(*)::int AS views FROM page_views WHERE ${exclude} AND created_at > NOW() - INTERVAL '30 days' GROUP BY label ORDER BY views DESC LIMIT 10`),
    { rows: [] } as any,
  )
  const cities = safeAnalyticsQuery(
    "topCities",
    () => pool.query(`SELECT COALESCE(NULLIF(city, ''), 'Unknown') AS label, COUNT(*)::int AS views FROM page_views WHERE ${exclude} AND created_at > NOW() - INTERVAL '30 days' GROUP BY label ORDER BY views DESC LIMIT 10`),
    { rows: [] } as any,
  )
  const referrers = safeAnalyticsQuery(
    "topReferrers",
    () => pool.query(`SELECT COALESCE(NULLIF(referrer, ''), 'Direct') AS label, COUNT(*)::int AS views FROM page_views WHERE ${exclude} AND created_at > NOW() - INTERVAL '30 days' GROUP BY label ORDER BY views DESC LIMIT 10`),
    { rows: [] } as any,
  )
  const recent = safeAnalyticsQuery(
    "recentVisits",
    () => pool.query(`SELECT path, country, city, referrer, user_agent, created_at FROM page_views WHERE ${exclude} ORDER BY created_at DESC LIMIT 25`),
    { rows: [] } as any,
  )
  const daily = safeAnalyticsQuery(
    "dailySeries",
    () => pool.query(
      `SELECT TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS views
       FROM page_views
       WHERE ${exclude} AND created_at > NOW() - INTERVAL '14 days'
       GROUP BY day
       ORDER BY day ASC`,
    ),
    { rows: [] } as any,
  )

  const [totalsR, dayR, weekR, monthR, pagesR, countriesR, citiesR, referrersR, recentR, dailyR] = await Promise.all([
    totals, day, week, month, pages, countries, cities, referrers, recent, daily,
  ])

  const dailyMap = new Map<string, number>()
  for (const r of dailyR.rows as Array<{ day: string; views: number }>) {
    dailyMap.set(r.day, Number(r.views) || 0)
  }
  const dailySeries: Array<{ day: string; views: number }> = []
  const today = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailySeries.push({ day: key, views: dailyMap.get(key) ?? 0 })
  }

  return {
    totalViews: Number(totalsR.rows[0]?.views) || 0,
    uniqueVisitors: Number(totalsR.rows[0]?.visitors) || 0,
    viewsLast24h: Number(dayR.rows[0]?.views) || 0,
    viewsLast7d: Number(weekR.rows[0]?.views) || 0,
    viewsLast30d: Number(monthR.rows[0]?.views) || 0,
    topPages: pagesR.rows as PageView[],
    topCountries: countriesR.rows as LocationStat[],
    topCities: citiesR.rows as LocationStat[],
    topReferrers: referrersR.rows as LocationStat[],
    recentVisits: (recentR.rows as any[]).map((r) => ({
      path: r.path,
      country: r.country || "Unknown",
      city: r.city || "Unknown",
      referrer: r.referrer || "Direct",
      userAgent: r.user_agent || "",
      createdAt: toIso(r.created_at),
    })),
    dailySeries,
  }
}
