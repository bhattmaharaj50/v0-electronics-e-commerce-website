import { NextResponse } from "next/server"
import {
  deleteCategory,
  deleteProduct,
  getAdminData,
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
    else return NextResponse.json({ error: "Unknown admin action" }, { status: 400 })

    return NextResponse.json(await getAdminData())
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin action failed" }, { status: 500 })
  }
}
