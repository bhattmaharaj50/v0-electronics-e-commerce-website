import { NextResponse } from "next/server"
import { getCurrentAdmin } from "@/lib/auth"
import { ensureCsrfCookie } from "@/lib/csrf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
} as const

export async function GET() {
  const user = await getCurrentAdmin()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  await ensureCsrfCookie()
  return NextResponse.json({ ok: true }, { headers: NO_STORE })
}
