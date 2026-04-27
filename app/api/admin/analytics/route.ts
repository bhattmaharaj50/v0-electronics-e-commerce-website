import { NextResponse } from "next/server"
import { emptyAnalytics, getTrafficAnalytics } from "@/lib/db"
import { authErrorResponse, requireAdmin } from "@/lib/auth"

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
    const analytics = await getTrafficAnalytics()
    return NextResponse.json({ analytics }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    if ((error as any)?.status === 401 || (error as any)?.status === 403) {
      const { status, body } = authErrorResponse(error)
      return NextResponse.json(body, { status })
    }
    const message = error instanceof Error ? error.message : "Unable to load analytics"
    console.error("[admin/analytics] route error:", message)
    return NextResponse.json(
      { analytics: emptyAnalytics(), warning: message },
      { headers: NO_STORE_HEADERS },
    )
  }
}
