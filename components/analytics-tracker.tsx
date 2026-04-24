"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const SESSION_KEY = "munex_session_id"

function getSessionId(): string {
  if (typeof window === "undefined") return ""
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedRef = useRef<string>("")

  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith("/admin")) return
    const fullPath = pathname + (searchParams && searchParams.toString() ? `?${searchParams.toString()}` : "")
    if (lastTrackedRef.current === fullPath) return
    lastTrackedRef.current = fullPath

    const payload = {
      path: fullPath,
      referrer: typeof document !== "undefined" ? document.referrer || "" : "",
      sessionId: getSessionId(),
    }

    const timer = setTimeout(() => {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    }, 250)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  return null
}
