import { Quote, Star } from "lucide-react"

const testimonials = [
  {
    name: "James Ochieng",
    location: "Nairobi",
    role: "Verified Buyer",
    text: "Bought a Samsung TV from Munex Electronics and the delivery was incredibly fast. Great prices and authentic products!",
    rating: 5,
  },
  {
    name: "Wanjiku Mwangi",
    location: "Mombasa",
    role: "Repeat Customer",
    text: "Best place to shop for electronics in Narok. Their customer service is top notch and prices are very competitive.",
    rating: 5,
  },
  {
    name: "David Kamau",
    location: "Kisumu",
    role: "Verified Buyer",
    text: "I ordered a PlayStation 5 and it arrived in perfect condition. Will definitely recommend to friends and family.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <div className="mb-12 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Reviews
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          Loved by Customers
          <span className="ml-2 inline-block bg-gradient-to-r from-foreground to-foreground/40 bg-clip-text text-transparent">
            Across Kenya
          </span>
        </h2>
        <p className="mt-3 max-w-md text-sm text-muted-foreground md:text-base">
          Join thousands of happy customers shopping with confidence at Munex Electronics.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t, idx) => (
          <div
            key={t.name}
            className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-card p-7 transition-all hover:-translate-y-1 hover:border-white/25"
          >
            {/* Hover glow */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <Quote className="h-7 w-7 text-foreground/15" />

            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < t.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>

            <p className="flex-1 text-sm leading-relaxed text-foreground/90 md:text-base">
              {t.text}
            </p>

            <div className="flex items-center gap-3 pt-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-secondary text-sm font-bold text-foreground">
                {t.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.role} · {t.location}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
