import { NextResponse } from "next/server"
import { loginAdmin } from "@/lib/auth"
import { rateLimit, clientIp } from "@/lib/rate-limit"

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

    // Rate limit by IP+username: max 5 failed attempts in 15 minutes,
    // then locked out for another 15 minutes.
    const key = `login:${clientIp(request)}:${username.toLowerCase()}`
    const rl = rateLimit(key, { windowMs: 15 * 60 * 1000, max: 5, lockoutMs: 15 * 60 * 1000 })
    if (!rl.ok) {
      const retrySec = Math.ceil(rl.retryAfterMs / 1000)
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${Math.ceil(retrySec / 60)} minute(s).` },
        { status: 429, headers: { "Retry-After": String(retrySec) } }
      )
    }

    const user = await loginAdmin(username, password)
    return NextResponse.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed"
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
