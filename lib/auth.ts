import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import {
  createAdminSession,
  deleteAdminSession,
  getAdminSession,
  getAdminUserByUsername,
  touchAdminLogin,
  type AdminUser,
} from "@/lib/db"

const COOKIE_NAME = "munex_session"
const SESSION_DAYS = 30

function expiryDate(): Date {
  const d = new Date()
  d.setDate(d.getDate() + SESSION_DAYS)
  return d
}

function makeToken(): string {
  return randomBytes(32).toString("hex")
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function loginAdmin(username: string, password: string): Promise<AdminUser> {
  const user = await getAdminUserByUsername(username)
  if (!user) throw new Error("Invalid username or password")
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw new Error("Invalid username or password")

  const token = makeToken()
  const expiresAt = expiryDate()
  await createAdminSession(user.id, token, expiresAt)
  await touchAdminLogin(user.id)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (token) await deleteAdminSession(token)
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const session = await getAdminSession(token)
  return session ? session.user : null
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentAdmin()
  if (!user) {
    const err = new Error("Not authenticated")
    ;(err as any).status = 401
    throw err
  }
  return user
}

export async function requireOwner(): Promise<AdminUser> {
  const user = await requireAdmin()
  if (user.role !== "owner") {
    const err = new Error("Owner role required")
    ;(err as any).status = 403
    throw err
  }
  return user
}

export function authErrorResponse(error: unknown): { status: number; body: { error: string } } {
  const status = (error as any)?.status === 401 || (error as any)?.status === 403 ? (error as any).status : 500
  return { status, body: { error: error instanceof Error ? error.message : "Auth error" } }
}
