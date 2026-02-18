import { Star } from "lucide-react"

const testimonials = [
  {
    name: "James Ochieng",
    location: "Nairobi",
    text: "Bought a Samsung TV from 25FlowElectronics and the delivery was incredibly fast. Great prices and authentic products!",
    rating: 5,
  },
  {
    name: "Wanjiku Mwangi",
    location: "Mombasa",
    text: "Best place to shop for electronics in Kenya. Their customer service is top notch and prices are very competitive.",
    rating: 5,
  },
  {
    name: "David Kamau",
    location: "Kisumu",
    text: "I ordered a PlayStation 5 and it arrived in perfect condition. Will definitely recommend to friends and family.",
    rating: 4,
  },
]

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          What Our Customers Say
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trusted by thousands of happy customers across Kenya
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < t.rating ? "fill-foreground text-foreground" : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              &ldquo;{t.text}&rdquo;
            </p>
            <div>
              <p className="text-sm font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.location}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
