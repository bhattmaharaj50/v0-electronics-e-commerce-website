import { NextResponse } from "next/server"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { rateLimit, clientIp } from "@/lib/rate-limit"
import {
  getAdminUserByUsername,
  resetAdminPasswordWithRecovery,
} from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const username = String(body.username || "").trim().toLowerCase()
    const recoveryCode = String(body.recoveryCode || "").trim().toUpperCase()
    const newPassword = String(body.newPassword || "")

    if (!username || !recoveryCode || !newPassword) {
      return NextResponse.json(
        { error: "Username, recovery code, and new password are required" },
        { status: 400 }
      )
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Rate limit per IP+username: 5 attempts / 15 min, then locked for 15 min.
    const key = `forgot:${clientIp(request)}:${username}`
    const rl = rateLimit(key, { windowMs: 15 * 60 * 1000, max: 5, lockoutMs: 15 * 60 * 1000 })
    if (!rl.ok) {
      const retrySec = Math.ceil(rl.retryAfterMs / 1000)
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil(retrySec / 60)} minute(s).` },
        { status: 429, headers: { "Retry-After": String(retrySec) } }
      )
    }

    // Look up the user. Always do a bcrypt compare against a dummy hash if the
    // user doesn't exist or has no recovery code, to avoid timing leaks.
    const user = await getAdminUserByUsername(username)
    const hashToCompare =
      user?.recoveryCodeHash ||
      "$2b$10$abcdefghijklmnopqrstuvCwzdummyhashthatneverevermatch12"
    const ok = await verifyPassword(recoveryCode, hashToCompare)

    if (!user || !user.recoveryCodeHash || !ok) {
      return NextResponse.json(
        { error: "Invalid username or recovery code" },
        { status: 401 }
      )
    }

    const passwordHash = await hashPassword(newPassword)
    await resetAdminPasswordWithRecovery({ id: user.id, passwordHash })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reset password"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
