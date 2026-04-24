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
  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.") || ip === "::1") {
    return null
  }
  const cached = await getCachedGeo(ip)
  if (cached) return cached
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,city`,
      { signal: controller.signal }
    )
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== "success") return null
    const geo = { country: data.country, countryCode: data.countryCode, city: data.city }
    await saveGeoCache(ip, geo).catch(() => {})
    return geo
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = String(body.path || "/").slice(0, 500)
    const referrer = String(body.referrer || "").slice(0, 500)
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
