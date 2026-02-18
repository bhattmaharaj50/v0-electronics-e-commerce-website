"use client"

import { useState } from "react"
import { Mail, CheckCircle2 } from "lucide-react"

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
    <section className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center lg:px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <Mail className="h-6 w-6 text-foreground" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Stay Updated
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Subscribe to our newsletter and be the first to know about new products, deals, and exclusive offers.
        </p>

        {submitted ? (
          <div className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground">
            <CheckCircle2 className="h-5 w-5" />
            Thanks for subscribing! We&apos;ll keep you updated.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex w-full max-w-md gap-2">
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 flex-1 rounded-lg border border-border bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
