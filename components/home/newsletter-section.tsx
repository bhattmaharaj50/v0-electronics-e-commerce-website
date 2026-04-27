"use client"

import { useState } from "react"
import { Mail, CheckCircle2, Sparkles } from "lucide-react"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
      setEmail("")
    }
  }

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-card">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-white/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-white/[0.04] blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center lg:px-8 lg:py-24">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-background/60 backdrop-blur-md">
          <Mail className="h-6 w-6 text-foreground" />
        </div>

        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          Stay in the loop
        </span>

        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          Get the Best Deals,
          <span className="block bg-gradient-to-r from-foreground to-foreground/40 bg-clip-text text-transparent">
            Straight to Your Inbox
          </span>
        </h2>
        <p className="mt-4 max-w-md text-sm text-muted-foreground md:text-base">
          Subscribe and be the first to know about new arrivals, flash sales, and exclusive offers.
        </p>

        {submitted ? (
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
            Thanks for subscribing! We&apos;ll keep you updated.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex w-full max-w-lg items-center gap-2 rounded-full border border-white/10 bg-background/60 p-1.5 backdrop-blur-md focus-within:border-white/30"
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 flex-1 rounded-full bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              className="group inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
            >
              Subscribe
            </button>
          </form>
        )}

        <p className="mt-4 text-[11px] text-muted-foreground">
          No spam — unsubscribe anytime.
        </p>
      </div>
    </section>
  )
}
