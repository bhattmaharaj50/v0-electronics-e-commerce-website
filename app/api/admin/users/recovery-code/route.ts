import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import {
  authErrorResponse,
  hashPassword,
  requireAdmin,
} from "@/lib/auth"
import { requireCsrf } from "@/lib/csrf"
import { getAdminUserById, setAdminRecoveryCode } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function makeRecoveryCode(): string {
  // 8 bytes -> 16 hex chars, formatted as XXXX-XXXX-XXXX-XXXX
  const hex = randomBytes(8).toString("hex").toUpperCase()
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`
}

export async function POST(request: Request) {
  try {
    const me = await requireAdmin()
    await requireCsrf(request)
    const body = await request.json().catch(() => ({}))
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const target = await getAdminUserById(id)
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Owners can generate a code for any admin; staff only for themselves.
    if (me.role !== "owner" && me.id !== target.id) {
      return NextResponse.json({ error: "Owner role required" }, { status: 403 })
    }

    const code = makeRecoveryCode()
    const hash = await hashPassword(code)
    const user = await setAdminRecoveryCode(id, hash)

    // The plaintext code is returned exactly once and never stored.
    return NextResponse.json({ user, recoveryCode: code })
  } catch (error) {
    const { status, body } = authErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
