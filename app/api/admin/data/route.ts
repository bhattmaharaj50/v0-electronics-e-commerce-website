import { NextResponse } from "next/server"
import {
  deleteCategory,
  deleteOrder,
  deleteProduct,
  deleteReview,
  getAdminData,
  markOrderDispatched,
  markOrderPaid,
  markOrderReady,
  saveCategory,
  saveProduct,
  saveSettings,
  updateOrderStatus,
} from "@/lib/db"

export async function GET() {
  try {
    return NextResponse.json(await getAdminData())
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load admin data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
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
    else return NextResponse.json({ error: "Unknown admin action" }, { status: 400 })

    return NextResponse.json(await getAdminData())
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin action failed" }, { status: 500 })
  }
}
