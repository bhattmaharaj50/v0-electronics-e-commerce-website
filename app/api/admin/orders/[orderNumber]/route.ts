import { NextResponse } from "next/server"
import { updateOrderStatus } from "@/lib/db"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params
    const body = await request.json()
    const order = await updateOrderStatus(orderNumber, body.status)
    return NextResponse.json({ order })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order update failed" }, { status: 500 })
  }
}
