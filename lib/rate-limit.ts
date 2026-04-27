type Bucket = { count: number; resetAt: number; lockedUntil?: number }

const globalForRl = globalThis as unknown as { munexRateLimit?: Map<string, Bucket> }
const buckets: Map<string, Bucket> = globalForRl.munexRateLimit ?? new Map()
if (!globalForRl.munexRateLimit) globalForRl.munexRateLimit = buckets

export interface RateLimitOptions {
  windowMs: number
  max: number
  lockoutMs?: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterMs: number
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (bucket?.lockedUntil && bucket.lockedUntil > now) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.lockedUntil - now }
  }

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { ok: true, remaining: opts.max - 1, retryAfterMs: 0 }
  }

  if (bucket.count >= opts.max) {
    if (opts.lockoutMs) {
      bucket.lockedUntil = now + opts.lockoutMs
    }
    return { ok: false, remaining: 0, retryAfterMs: (bucket.lockedUntil ?? bucket.resetAt) - now }
  }

  bucket.count += 1
  return { ok: true, remaining: opts.max - bucket.count, retryAfterMs: 0 }
}

export function resetRateLimit(key: string) {
  buckets.delete(key)
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const real = request.headers.get("x-real-ip")
  if (real) return real
  return "unknown"
}

// Periodic cleanup so buckets don't grow unbounded
const globalForCleanup = globalThis as unknown as { munexRlCleanup?: NodeJS.Timeout }
if (!globalForCleanup.munexRlCleanup) {
  globalForCleanup.munexRlCleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if ((!bucket.lockedUntil || bucket.lockedUntil <= now) && bucket.resetAt <= now) {
        buckets.delete(key)
      }
    }
  }, 60_000)
  globalForCleanup.munexRlCleanup.unref?.()
}
