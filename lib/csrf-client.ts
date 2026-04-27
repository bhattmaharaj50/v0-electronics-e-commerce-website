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

export function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {})
  const token = getCsrfToken()
  if (token) headers.set(CSRF_HEADER, token)
  return fetch(input, { ...init, headers })
}
