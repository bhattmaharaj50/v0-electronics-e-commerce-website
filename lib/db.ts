import { Pool } from "pg"
import { categories as defaultCategories, products as defaultProducts, type Product } from "@/lib/products"

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
}

const globalForDb = globalThis as unknown as { munexPool?: Pool; munexReady?: Promise<void> }

export const pool =
  globalForDb.munexPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

if (process.env.NODE_ENV !== "production") globalForDb.munexPool = pool

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  return Number(value)
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

function toIso(value: any): string {
  if (value instanceof Date) return value.toISOString()
  return String(value)
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Package'
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC NOT NULL DEFAULT 0,
      original_price NUMERIC,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT '',
      size TEXT,
      image TEXT NOT NULL DEFAULT '',
      images JSONB NOT NULL DEFAULT '[]'::jsonb,
      video_url TEXT,
      rating NUMERIC NOT NULL DEFAULT 4.5,
      reviews INTEGER NOT NULL DEFAULT 0,
      badge TEXT,
      featured BOOLEAN NOT NULL DEFAULT false,
      stock INTEGER NOT NULL DEFAULT 10,
      offer_type TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
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

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_reviews (
      id SERIAL PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      comment TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS page_views (
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

    CREATE TABLE IF NOT EXISTS ip_geo_cache (
      ip TEXT PRIMARY KEY,
      country TEXT,
      country_code TEXT,
      city TEXT,
      cached_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
  `)

  await pool.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_location TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_whatsapp_url TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMP;
  `)

  const categoryCount = await pool.query("SELECT COUNT(*)::int AS count FROM categories")
  if (categoryCount.rows[0].count === 0) {
    for (const category of defaultCategories) {
      await pool.query(
        "INSERT INTO categories (slug, name, icon) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING",
        [category.slug, category.name, category.icon]
      )
    }
  }

  const productCount = await pool.query("SELECT COUNT(*)::int AS count FROM products")
  if (productCount.rows[0].count === 0) {
    for (const [index, product] of defaultProducts.entries()) {
      const seededProduct = {
        ...product,
        stock: product.stock ?? 10,
        offerType: product.offerType ?? (product.originalPrice ? (index % 3 === 0 ? "flash-sale" : index % 3 === 1 ? "deal-of-day" : "holiday-deal") : ""),
      }

      await pool.query(
        `INSERT INTO products (
          id, name, price, original_price, description, category, brand, size, image, images, video_url,
          rating, reviews, badge, featured, stock, offer_type, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW())
        ON CONFLICT (id) DO NOTHING`,
        [
          seededProduct.id,
          seededProduct.name,
          seededProduct.price,
          seededProduct.originalPrice ?? null,
          seededProduct.description,
          seededProduct.category,
          seededProduct.brand,
          seededProduct.size ?? null,
          seededProduct.image,
          JSON.stringify(seededProduct.images ?? []),
          seededProduct.videoUrl ?? null,
          seededProduct.rating,
          seededProduct.reviews,
          seededProduct.badge ?? null,
          seededProduct.featured ?? false,
          seededProduct.stock ?? 0,
          seededProduct.offerType ?? "",
        ]
      )
    }
  }

  for (const [key, value] of Object.entries(defaultSettings)) {
    await pool.query(
      "INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
      [key, value]
    )
  }
}

export async function getStoreData() {
  await ensureDatabase()
  const [productResult, categoryResult, settingsResult] = await Promise.all([
    pool.query("SELECT * FROM products ORDER BY updated_at DESC, name ASC"),
    pool.query("SELECT * FROM categories ORDER BY name ASC"),
    pool.query("SELECT key, value FROM site_settings"),
  ])

  const settings = { ...defaultSettings }
  for (const row of settingsResult.rows) {
    ;(settings as any)[row.key] = row.value
  }

  return {
    products: productResult.rows.map(productFromRow),
    categories: categoryResult.rows as Category[],
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

export async function saveProduct(product: Product) {
  await ensureDatabase()
  await pool.query(
    `INSERT INTO products (
      id, name, price, original_price, description, category, brand, size, image, images, video_url,
      rating, reviews, badge, featured, stock, offer_type, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      original_price = EXCLUDED.original_price,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      brand = EXCLUDED.brand,
      size = EXCLUDED.size,
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

export async function saveCategory(category: Category) {
  await ensureDatabase()
  await pool.query(
    "INSERT INTO categories (slug, name, icon) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon",
    [category.slug, category.name, category.icon]
  )
}

export async function deleteCategory(slug: string) {
  await ensureDatabase()
  await pool.query("DELETE FROM categories WHERE slug = $1", [slug])
}

export async function saveSettings(settings: Partial<SiteSettings>) {
  await ensureDatabase()
  for (const [key, value] of Object.entries(settings)) {
    await pool.query(
      "INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [key, String(value ?? "")]
    )
  }
}

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
  const result = await pool.query("DELETE FROM orders WHERE order_number = $1", [orderNumber])
  if (!result.rowCount) throw new Error("Order not found")
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

// ----- Reviews -----

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
  if (!target.rowCount) throw new Error("Review not found")
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

// ----- Analytics -----

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

export async function getTrafficAnalytics(): Promise<TrafficAnalytics> {
  await ensureDatabase()
  const [totals, day, week, month, pages, countries, cities, referrers, recent, daily] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS views, COUNT(DISTINCT session_id)::int AS visitors FROM page_views"),
    pool.query("SELECT COUNT(*)::int AS views FROM page_views WHERE created_at > NOW() - INTERVAL '24 hours'"),
    pool.query("SELECT COUNT(*)::int AS views FROM page_views WHERE created_at > NOW() - INTERVAL '7 days'"),
    pool.query("SELECT COUNT(*)::int AS views FROM page_views WHERE created_at > NOW() - INTERVAL '30 days'"),
    pool.query("SELECT path, COUNT(*)::int AS views FROM page_views WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY path ORDER BY views DESC LIMIT 10"),
    pool.query("SELECT COALESCE(country, 'Unknown') AS label, COUNT(*)::int AS views FROM page_views WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY country ORDER BY views DESC LIMIT 10"),
    pool.query("SELECT COALESCE(city, 'Unknown') AS label, COUNT(*)::int AS views FROM page_views WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY city ORDER BY views DESC LIMIT 10"),
    pool.query("SELECT COALESCE(referrer, 'Direct') AS label, COUNT(*)::int AS views FROM page_views WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY referrer ORDER BY views DESC LIMIT 10"),
    pool.query("SELECT path, country, city, referrer, user_agent, created_at FROM page_views ORDER BY created_at DESC LIMIT 25"),
    pool.query("SELECT TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS views FROM page_views WHERE created_at > NOW() - INTERVAL '14 days' GROUP BY day ORDER BY day ASC"),
  ])

  return {
    totalViews: totals.rows[0].views,
    uniqueVisitors: totals.rows[0].visitors,
    viewsLast24h: day.rows[0].views,
    viewsLast7d: week.rows[0].views,
    viewsLast30d: month.rows[0].views,
    topPages: pages.rows as PageView[],
    topCountries: countries.rows as LocationStat[],
    topCities: cities.rows as LocationStat[],
    topReferrers: referrers.rows as LocationStat[],
    recentVisits: recent.rows.map((r: any) => ({
      path: r.path,
      country: r.country || "Unknown",
      city: r.city || "Unknown",
      referrer: r.referrer || "Direct",
      userAgent: r.user_agent || "",
      createdAt: toIso(r.created_at),
    })),
    dailySeries: daily.rows.map((r: any) => ({ day: r.day, views: r.views })),
  }
}
