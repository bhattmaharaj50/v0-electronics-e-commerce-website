import { NextResponse } from "next/server"
import { getCachedGeo, recordPageView, saveGeoCache } from "@/lib/db"

export const runtime = "nodejs"

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const real = request.headers.get("x-real-ip")
  if (real) return real
  return "unknown"
}

async function lookupGeo(ip: string) {
  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.") || ip === "::1") {
    return null
  }
  const cached = await getCachedGeo(ip)
  if (cached) return cached
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    // Use ipwho.is — free HTTPS endpoint, no API key required
    const res = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,country_code,city`,
      { signal: controller.signal }
    )
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (!data || data.success === false) return null
    const geo = { country: data.country || null, countryCode: data.country_code || null, city: data.city || null }
    await saveGeoCache(ip, geo).catch(() => {})
    return geo
  } catch {
    return null
  }
}

function normalizeReferrer(raw: string, host: string | null): string {
  const value = (raw || "").trim()
  if (!value) return ""
  try {
    const url = new URL(value)
    // Strip same-host (internal) referrers — they're noise in analytics
    if (host && url.host === host) return ""
    return url.host
  } catch {
    return value.slice(0, 200)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = String(body.path || "/").slice(0, 500)
    // Skip admin/api paths so they don't pollute analytics
    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    const host = request.headers.get("host")
    const referrer = normalizeReferrer(String(body.referrer || ""), host)
    const userAgent = request.headers.get("user-agent") || ""
    const sessionId = String(body.sessionId || "").slice(0, 64)
    const ip = clientIp(request)
    const geo = await lookupGeo(ip)

    await recordPageView({
      path,
      referrer,
      userAgent,
      ip,
      country: geo?.country || undefined,
      countryCode: geo?.countryCode || undefined,
      city: geo?.city || undefined,
      sessionId,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Analytics track error", error)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
