"use client"

import { CSRF_COOKIE, CSRF_HEADER } from "@/lib/csrf-shared"

function readCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const target = name + "="
  const parts = document.cookie.split(";")
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(target)) return decodeURIComponent(trimmed.slice(target.length))
  }
  return ""
}

export function getCsrfToken(): string {
  return readCookie(CSRF_COOKIE)
}

let refreshInflight: Promise<string> | null = null

async function refreshCsrfToken(): Promise<string> {
  if (refreshInflight) return refreshInflight
  refreshInflight = (async () => {
    try {
      // Hit the dedicated refresh endpoint; the server sets the cookie in the response.
      await fetch("/api/auth/csrf", { cache: "no-store", credentials: "same-origin" })
      return getCsrfToken()
    } catch {
      return getCsrfToken()
    } finally {
      refreshInflight = null
    }
  })()
  return refreshInflight
}

/**
 * Fetch wrapper that always sends the CSRF token on mutating requests. If the
 * client doesn't yet have a CSRF cookie (e.g. session predates the protection,
 * or the cookie expired), it transparently fetches one before the real request
 * so the user never sees a spurious "Invalid or missing CSRF token" error.
 */
export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {})
  let token = getCsrfToken()
  if (!token) token = await refreshCsrfToken()
  if (token) headers.set(CSRF_HEADER, token)
  return fetch(input, { ...init, headers, credentials: init.credentials ?? "same-origin" })
}
