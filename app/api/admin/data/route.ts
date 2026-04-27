import { NextResponse } from "next/server"
import {
  deleteCategory,
  deleteOrder,
  deleteProduct,
  deleteReview,
  updateReview,
  saveReview,
  getAdminData,
  getStoreData,
  markOrderDispatched,
  markOrderPaid,
  markOrderReady,
  saveCategory,
  saveProduct,
  saveSettings,
  updateOrderStatus,
} from "@/lib/db"
import { authErrorResponse, requireAdmin } from "@/lib/auth"
import { requireCsrf } from "@/lib/csrf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const

export async function GET() {
  try {
    await requireAdmin()
    return NextResponse.json(await getAdminData(), { headers: NO_STORE_HEADERS })
  } catch (error) {
    if ((error as any)?.status === 401 || (error as any)?.status === 403) {
      const { status, body } = authErrorResponse(error)
      return NextResponse.json(body, { status, headers: NO_STORE_HEADERS })
    }
    const message = error instanceof Error ? error.message : "Unable to load admin data"
    console.error("[admin/data] route error:", message)
    try {
      const store = await getStoreData()
      return NextResponse.json(
        { ...store, orders: [], allReviews: [], warning: message },
        { headers: NO_STORE_HEADERS },
      )
    } catch (innerError) {
      const inner = innerError instanceof Error ? innerError.message : "Database unreachable"
      console.error("[admin/data] hard failure:", inner)
      return NextResponse.json({ error: inner }, { status: 500, headers: NO_STORE_HEADERS })
    }
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    await requireCsrf(request)
    const body = await request.json()

    if (body.action === "saveProduct") await saveProduct(body.product)
    else if (body.action === "deleteProduct") await deleteProduct(body.id)
    else if (body.action === "saveCategory") await saveCategory(body.category)
    else if (body.action === "deleteCategory") await deleteCategory(body.slug)
    else if (body.action === "saveSettings") await saveSettings(body.settings)
    else if (body.action === "updateOrderStatus") await updateOrderStatus(body.orderNumber, body.status)
    else if (body.action === "deleteOrder") await deleteOrder(body.orderNumber)
    else if (body.action === "markOrderPaid") await markOrderPaid(body.orderNumber)
    else if (body.action === "markOrderReady") await markOrderReady(body.orderNumber, body.pickupLocation || "")
    else if (body.action === "markOrderDispatched") await markOrderDispatched(body.orderNumber, body.customerWhatsappUrl || "")
    else if (body.action === "deleteReview") await deleteReview(Number(body.id))
    else if (body.action === "updateReview") await updateReview({ id: Number(body.id), name: body.name, rating: body.rating !== undefined ? Number(body.rating) : undefined, comment: body.comment })
    else if (body.action === "addReview") {
      if (!body.productId || !body.name || !body.comment) {
        return NextResponse.json({ error: "Product, name, and comment are required" }, { status: 400 })
      }
      await saveReview({
        productId: String(body.productId),
        name: String(body.name),
        rating: Number(body.rating) || 5,
        comment: String(body.comment),
      })
    }
    else return NextResponse.json({ error: "Unknown admin action" }, { status: 400 })

    return NextResponse.json(await getAdminData(), { headers: NO_STORE_HEADERS })
  } catch (error) {
    if ((error as any)?.status === 401 || (error as any)?.status === 403) {
      const { status, body } = authErrorResponse(error)
      return NextResponse.json(body, { status })
    }
    console.error(error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin action failed" }, { status: 500 })
  }
}
