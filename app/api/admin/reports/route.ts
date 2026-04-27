import { NextResponse } from "next/server"
import { authErrorResponse, requireAdmin } from "@/lib/auth"
import { getSalesReport } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const url = new URL(request.url)
    const range = Number(url.searchParams.get("range")) || 30
    const report = await getSalesReport(range)
    return NextResponse.json({ report }, { headers: NO_STORE })
  } catch (error) {
    const { status, body } = authErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
