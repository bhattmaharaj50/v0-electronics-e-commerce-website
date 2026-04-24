"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"

interface ReviewItem {
  id: number
  productId: string
  name: string
  rating: number
  comment: string
  createdAt: string
}

export function ProductReviews({ productId, onChange }: { productId: string; onChange?: () => void }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  async function loadReviews() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`, { cache: "no-store" })
      const data = await res.json()
      if (res.ok) setReviews(data.reviews || [])
    } finally {
      setLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Unable to submit review")
      setName("")
      setComment("")
      setRating(5)
      setSuccess("Thanks! Your review was posted.")
      await loadReviews()
      onChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-12 border-t border-border pt-10">
      <h2 className="text-2xl font-bold text-foreground">Customer Reviews</h2>

      {/* Form */}
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Your name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. James K"
            className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Rating</label>
          <div className="flex h-10 items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value} stars`}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 ${
                      value <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                    }`}
                  />
                </button>
              )
            })}
            <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Your review</label>
          <textarea
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell other shoppers what you think about this product..."
            className="min-h-24 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && <p className="md:col-span-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        {success && <p className="md:col-span-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600">{success}</p>}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Posting..." : "Post Review"}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet — be the first to share your thoughts.</p>
        ) : (
          <div className="grid gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < r.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
