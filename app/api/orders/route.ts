import { NextResponse } from "next/server"
import { createOrder } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.orderNumber || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Order is missing required items" }, { status: 400 })
    }

    const order = await createOrder(body)
    return NextResponse.json({ order })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order failed" }, { status: 500 })
  }
}
