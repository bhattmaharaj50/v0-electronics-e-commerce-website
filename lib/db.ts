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
  createdAt: string
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
}

const globalForDb = globalThis as unknown as { munexPool?: Pool; munexReady?: Promise<void> }

export const pool =
  globalForDb.munexPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  })

if (process.env.NODE_ENV !== "production") globalForDb.munexPool = pool

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  return Number(value)
}

function productFromRow(row: any): Product {
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
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
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
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
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
          id, name, price, original_price, description, category, brand, size, image,
          rating, reviews, badge, featured, stock, offer_type, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
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
  const store = await getStoreData()
  const orders = await pool.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200")
  return { ...store, orders: orders.rows.map(orderFromRow) }
}

export async function saveProduct(product: Product) {
  await ensureDatabase()
  await pool.query(
    `INSERT INTO products (
      id, name, price, original_price, description, category, brand, size, image,
      rating, reviews, badge, featured, stock, offer_type, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      original_price = EXCLUDED.original_price,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      brand = EXCLUDED.brand,
      size = EXCLUDED.size,
      image = EXCLUDED.image,
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

    const result = await client.query(
      `INSERT INTO orders (order_number, customer, items, subtotal, delivery_fee, total, payment_method, mpesa_code, status, whatsapp_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'new',$9)
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
