import { cookies } from "next/headers"
import { randomBytes, timingSafeEqual } from "crypto"
import { CSRF_COOKIE, CSRF_HEADER } from "@/lib/csrf-shared"

export { CSRF_COOKIE, CSRF_HEADER }

export function makeCsrfToken(): string {
  return randomBytes(32).toString("hex")
}

export async function setCsrfCookie(token: string, expires: Date) {
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false, // must be readable from JS so the client can echo it back
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  })
}

export async function clearCsrfCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_COOKIE)
}

/**
 * Ensure a CSRF cookie exists for an authenticated request. If the cookie is
 * missing (e.g. it expired, was cleared by the browser, or the user logged in
 * before this protection existed) we issue a fresh one so the next mutating
 * request from the client can echo it back. This keeps long-lived sessions
 * usable without forcing a re-login.
 */
export async function ensureCsrfCookie(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(CSRF_COOKIE)?.value
  if (existing && /^[0-9a-f]{64}$/i.test(existing)) return existing
  const token = makeCsrfToken()
  const expires = new Date()
  expires.setDate(expires.getDate() + 30)
  await setCsrfCookie(token, expires)
  return token
}

function safeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"))
  } catch {
    return false
  }
}

export async function requireCsrf(request: Request): Promise<void> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value || ""
  const headerToken = request.headers.get(CSRF_HEADER) || ""
  if (!cookieToken || !headerToken || !safeEqualHex(cookieToken, headerToken)) {
    const err = new Error("Invalid or missing CSRF token") as Error & { status?: number }
    err.status = 403
    throw err
  }
}
