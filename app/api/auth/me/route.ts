import { NextResponse } from "next/server"
import { getCurrentAdmin } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getCurrentAdmin()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  return NextResponse.json({ user })
}
