import { NextResponse } from "next/server"
import { createOrder, pool, ensureDatabase } from "@/lib/db"
import { rateLimit, clientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_PAYMENT = new Set(["mpesa", "pay-on-delivery"])
const NAIROBI_DELIVERY_FEE = 0
const OTHER_DELIVERY_FEE = 500

function strField(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max)
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function isValidPhone(s: string): boolean {
  return /^[+\d][\d\s-]{6,20}$/.test(s)
}

export async function POST(request: Request) {
  try {
    // Rate limit per IP — 10 orders / 10 minutes
    const rl = rateLimit(`orders:${clientIp(request)}`, { windowMs: 10 * 60 * 1000, max: 10 })
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many orders submitted. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    if (!body.orderNumber || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Order is missing required items" }, { status: 400 })
    }
    if (body.items.length > 50) {
      return NextResponse.json({ error: "Too many items in a single order" }, { status: 400 })
    }

    const customer = body.customer || {}
    const firstName = strField(customer.firstName, 80)
    const lastName = strField(customer.lastName, 80)
    const email = strField(customer.email, 200)
    const phone = strField(customer.phone, 30)
    const address = strField(customer.address, 300)
    const city = strField(customer.city, 80)

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First and last name are required" }, { status: 400 })
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }
    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json({ error: "A valid phone number is required" }, { status: 400 })
    }
    if (!address || !city) {
      return NextResponse.json({ error: "Delivery address and city are required" }, { status: 400 })
    }

    const paymentMethod = String(body.paymentMethod || "")
    if (!ALLOWED_PAYMENT.has(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
    }

    let mpesaCode = ""
    if (paymentMethod === "mpesa") {
      mpesaCode = String(body.mpesaCode || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
      if (mpesaCode.length < 6 || mpesaCode.length > 15) {
        return NextResponse.json(
          { error: "A valid M-Pesa transaction code is required for M-Pesa orders" },
          { status: 400 }
        )
      }
    }

    // Recompute totals server-side from authoritative product data —
    // never trust prices/totals supplied by the client.
    await ensureDatabase()
    const ids: string[] = []
    const quantities = new Map<string, number>()
    for (const item of body.items as Array<{ product?: { id?: string }; quantity?: unknown }>) {
      const id = String(item?.product?.id ?? "")
      const qty = Math.max(1, Math.min(99, Math.floor(Number(item?.quantity ?? 0))))
      if (!id || !Number.isFinite(qty) || qty < 1) {
        return NextResponse.json({ error: "Invalid item in order" }, { status: 400 })
      }
      ids.push(id)
      quantities.set(id, (quantities.get(id) || 0) + qty)
    }

    const productResult = await pool.query(
      "SELECT * FROM products WHERE id = ANY($1::text[])",
      [Array.from(new Set(ids))]
    )
    const productById = new Map<string, any>()
    for (const row of productResult.rows) productById.set(row.id, row)

    let subtotal = 0
    const verifiedItems: Array<{ product: any; quantity: number }> = []
    for (const [id, qty] of quantities) {
      const row = productById.get(id)
      if (!row) {
        return NextResponse.json({ error: `Product no longer available: ${id}` }, { status: 400 })
      }
      const stock = Number(row.stock || 0)
      if (stock < qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${row.name}. Only ${stock} left.` },
          { status: 409 }
        )
      }
      const price = Number(row.price)
      subtotal += price * qty
      verifiedItems.push({
        product: {
          id: row.id,
          name: row.name,
          price,
          image: row.image,
          category: row.category,
          brand: row.brand,
        },
        quantity: qty,
      })
    }

    const deliveryFee = city.toLowerCase() === "nairobi" ? NAIROBI_DELIVERY_FEE : OTHER_DELIVERY_FEE
    const total = subtotal + deliveryFee

    const order = await createOrder({
      orderNumber: String(body.orderNumber).slice(0, 64),
      customer: { firstName, lastName, email, phone, address, city },
      items: verifiedItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      mpesaCode: mpesaCode || undefined,
      whatsappUrl: String(body.whatsappUrl || "").slice(0, 2000),
    })
    return NextResponse.json({ order })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Order failed" },
      { status: 500 }
    )
  }
}
