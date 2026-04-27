import { NextResponse } from "next/server"
import {
  authErrorResponse,
  hashPassword,
  requireAdmin,
  requireOwner,
} from "@/lib/auth"
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserById,
  listAdminUsers,
  updateAdminUser,
  type AdminRole,
} from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const

function normalizeRole(value: unknown): AdminRole {
  return value === "owner" ? "owner" : "staff"
}

export async function GET() {
  try {
    await requireAdmin()
    const users = await listAdminUsers()
    return NextResponse.json({ users }, { headers: NO_STORE })
  } catch (error) {
    const { status, body } = authErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}

export async function POST(request: Request) {
  try {
    await requireOwner()
    const body = await request.json().catch(() => ({}))
    const username = String(body.username || "").trim().toLowerCase()
    const password = String(body.password || "")
    const fullName = String(body.fullName || "").trim()
    const role = normalizeRole(body.role)

    if (!username || username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)
    const user = await createAdminUser({ username, passwordHash, fullName, role })
    return NextResponse.json({ user })
  } catch (error) {
    if ((error as any)?.code === "23505") {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }
    const { status, body } = authErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}

export async function PATCH(request: Request) {
  try {
    const me = await requireAdmin()
    const body = await request.json().catch(() => ({}))
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const target = await getAdminUserById(id)
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Staff can only update their own profile (full name + password). Owner can update anyone.
    if (me.role !== "owner" && me.id !== target.id) {
      return NextResponse.json({ error: "Owner role required" }, { status: 403 })
    }

    const update: { id: number; fullName?: string; role?: AdminRole; passwordHash?: string } = { id }

    if (body.fullName !== undefined) update.fullName = String(body.fullName).trim()

    if (body.password) {
      const password = String(body.password)
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      }
      update.passwordHash = await hashPassword(password)
    }

    if (body.role !== undefined) {
      if (me.role !== "owner") {
        return NextResponse.json({ error: "Owner role required to change roles" }, { status: 403 })
      }
      update.role = normalizeRole(body.role)
      // Don't allow demoting the last owner
      if (target.role === "owner" && update.role !== "owner") {
        const all = await listAdminUsers()
        if (all.filter((u) => u.role === "owner").length <= 1) {
          return NextResponse.json({ error: "Cannot demote the last owner" }, { status: 400 })
        }
      }
    }

    const user = await updateAdminUser(update)
    return NextResponse.json({ user })
  } catch (error) {
    const { status, body } = authErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    const me = await requireOwner()
    const url = new URL(request.url)
    const id = Number(url.searchParams.get("id"))
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    if (id === me.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }
    const target = await getAdminUserById(id)
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

    if (target.role === "owner") {
      const all = await listAdminUsers()
      if (all.filter((u) => u.role === "owner").length <= 1) {
        return NextResponse.json({ error: "Cannot delete the last owner" }, { status: 400 })
      }
    }

    await deleteAdminUser(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const { status, body } = authErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
