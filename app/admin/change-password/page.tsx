"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Zap } from "lucide-react"
import { csrfFetch } from "@/lib/csrf-client"

export default function ChangePasswordPage() {
  const router = useRouter()
  const [me, setMe] = useState<{ id: number; username: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          router.replace("/admin")
          return
        }
        const payload = await res.json().catch(() => ({}))
        const user = payload?.user
        if (!user) {
          router.replace("/admin")
          return
        }
        // If the user no longer needs to change their password, send them on.
        if (!user.mustChangePassword) {
          router.replace("/admin/dashboard")
          return
        }
        setMe({ id: user.id, username: user.username })
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) router.replace("/admin")
      })
    return () => {
      cancelled = true
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    if (!me) return
    setSubmitting(true)
    try {
      const res = await csrfFetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: me.id, password }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || "Could not update password")
      router.replace("/admin/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              For security, please replace the default password before continuing.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Signed in as <strong className="text-foreground">{me?.username}</strong>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Re-enter the password"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save and continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
