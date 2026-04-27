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
      const res = await fetch("/api/auth/csrf", { cache: "no-store", credentials: "same-origin" })
      // If the refresh itself reports we're no longer authenticated, propagate.
      if (res.status === 401 || res.status === 403) {
        handleSessionExpired()
      }
      return getCsrfToken()
    } catch {
      return getCsrfToken()
    } finally {
      refreshInflight = null
    }
  })()
  return refreshInflight
}

let sessionExpiredHandled = false

function handleSessionExpired() {
  if (typeof window === "undefined") return
  if (sessionExpiredHandled) return
  sessionExpiredHandled = true
  // Reset after a short delay in case the user logs back in within the same tab lifecycle.
  setTimeout(() => {
    sessionExpiredHandled = false
  }, 5000)
  try {
    // eslint-disable-next-line no-alert
    alert("Your admin session has expired. Please log in again.")
  } catch {
    // ignore — environments without alert (SSR / extensions)
  }
  // Redirect after the alert so the user always sees the message first.
  const onAdmin = window.location.pathname.startsWith("/admin")
  if (onAdmin) {
    window.location.href = "/admin?expired=1"
  }
}

/**
 * Fetch wrapper that always sends the CSRF token on mutating requests.
 *
 * Reliability features built in so the user never sees a confusing silent failure:
 *  1. If no CSRF cookie is present locally, transparently fetch a fresh one
 *     before sending the real request (no spurious "Invalid or missing CSRF token").
 *  2. If the server still rejects with a CSRF error (cookie / header drift after
 *     a server restart, etc.), refresh the token once and retry the request.
 *  3. If the server reports the session is gone (401 / 403 "Not authenticated"),
 *     surface it loudly with an alert and a redirect to the login page so the
 *     user can never click "Save" on a form and have nothing happen.
 */
export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const send = async (token: string) => {
    const headers = new Headers(init.headers || {})
    if (token) headers.set(CSRF_HEADER, token)
    return fetch(input, { ...init, headers, credentials: init.credentials ?? "same-origin" })
  }

  let token = getCsrfToken()
  if (!token) token = await refreshCsrfToken()
  let response = await send(token)

  // Try to recover from a CSRF mismatch exactly once (e.g., after a server
  // restart that invalidated the token) before giving up.
  if (response.status === 403) {
    const cloned = response.clone()
    const body = await cloned.json().catch(() => null as { error?: string } | null)
    const looksLikeCsrf = body?.error && /csrf/i.test(body.error)
    if (looksLikeCsrf) {
      const fresh = await refreshCsrfToken()
      if (fresh) response = await send(fresh)
    }
  }

  // If the session is gone, tell the user clearly instead of failing silently.
  if (response.status === 401) {
    handleSessionExpired()
  }

  return response
}
