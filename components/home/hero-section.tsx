import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-electronics.jpg"
          alt="Premium electronics collection"
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-center px-4 py-24 lg:px-8 lg:py-36">
        <span className="mb-4 inline-block rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Kenya&apos;s Trusted Electronics Store
        </span>
        <h1 className="max-w-2xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Premium Electronics, Delivered to Your Door
        </h1>
        <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          Shop the latest TVs, smartphones, gaming consoles, and home appliances at competitive prices across Kenya.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/products"
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Shop Now
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products?deals=true"
            className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            View Deals
          </Link>
        </div>
      </div>
    </section>
  )
}
