import { NextResponse } from "next/server"
import { emptyAnalytics, getTrafficAnalytics } from "@/lib/db"

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
    const analytics = await getTrafficAnalytics()
    return NextResponse.json({ analytics }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    // Never 500 the dashboard for an analytics fetch — return an empty
    // dataset plus a warning so the UI can still render the tab.
    const message = error instanceof Error ? error.message : "Unable to load analytics"
    console.error("[admin/analytics] route error:", message)
    return NextResponse.json(
      { analytics: emptyAnalytics(), warning: message },
      { headers: NO_STORE_HEADERS },
    )
  }
}
