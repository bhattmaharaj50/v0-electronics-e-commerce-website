import { NextResponse } from "next/server"
import { updateOrderStatus } from "@/lib/db"
import { authErrorResponse, requireAdmin } from "@/lib/auth"
import { requireCsrf } from "@/lib/csrf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    await requireAdmin()
    await requireCsrf(request)
    const { orderNumber } = await params
    const body = await request.json()
    const order = await updateOrderStatus(orderNumber, body.status)
    return NextResponse.json({ order })
  } catch (error) {
    if ((error as any)?.status === 401 || (error as any)?.status === 403) {
      const { status, body } = authErrorResponse(error)
      return NextResponse.json(body, { status })
    }
    console.error(error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order update failed" }, { status: 500 })
  }
}
