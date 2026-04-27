import { NextResponse } from "next/server"
import { loginAdmin } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const username = String(body.username || "").trim()
    const password = String(body.password || "")
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }
    const user = await loginAdmin(username, password)
    return NextResponse.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed"
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
