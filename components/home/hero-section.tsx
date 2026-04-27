"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { useProductStore } from "@/lib/product-store"

export function HeroSection() {
  const { products, settings } = useProductStore()
  const fallback = settings.heroImageUrl || "/images/hero-electronics.jpg"
  const galleryImages = settings.heroGalleryImages?.filter(Boolean) || []
  const slides = galleryImages.length > 0 ? galleryImages : [fallback]

  // Pick a hero showcase product for the right-hand visual card.
  const showcase =
    products.find((p) => p.featured && (p.image || (p.images && p.images.length))) ||
    products.find((p) => p.image || (p.images && p.images.length)) ||
    null

  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [slides.length])

  useEffect(() => {
    setActiveSlide(0)
  }, [slides.join("|")])

  return (
    <section className="relative overflow-hidden">
      {/* Background slideshow */}
      <div className="absolute inset-0">
        {slides.map((src, index) => (
          <Image
            key={`${src}-${index}`}
            src={src}
            alt="Premium electronics collection"
            fill
            priority={index === 0}
            className={`object-cover transition-opacity duration-[1400ms] ${
              index === activeSlide ? "opacity-30 scale-105" : "opacity-0"
            }`}
            sizes="100vw"
          />
        ))}
      </div>

      {/* Layered gradients + subtle grid for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent lg:to-background/20" />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05), transparent 45%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-28">
        {/* Left — copy block */}
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/80 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {settings.heroBadge}
          </span>

          <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {settings.heroTitle.split(" ").map((word, i, arr) => {
              const isLast = i >= arr.length - 2
              return (
                <span
                  key={i}
                  className={
                    isLast
                      ? "bg-gradient-to-r from-foreground via-foreground/80 to-foreground/50 bg-clip-text text-transparent"
                      : ""
                  }
                >
                  {word}
                  {i < arr.length - 1 ? " " : ""}
                </span>
              )
            })}
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {settings.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-2xl shadow-white/10 transition-transform hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Shop Now</span>
              <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/products?deals=true"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/[0.06]"
            >
              <Sparkles className="h-4 w-4" />
              View Deals
            </Link>
          </div>

          {/* Trust micro-strip */}
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              { icon: Truck, label: "Fast Delivery", sub: "Across Kenya" },
              { icon: ShieldCheck, label: "100% Genuine", sub: "Authentic stock" },
              { icon: Sparkles, label: "M-Pesa", sub: "Easy checkout" },
            ].map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.05]"
              >
                <Icon className="h-4 w-4 text-foreground" />
                <p className="mt-2 text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <div className="mt-10 flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show slide ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeSlide
                      ? "w-10 bg-foreground"
                      : "w-3 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right — floating product showcase card (hidden on small screens) */}
        {showcase && (
          <div className="relative hidden lg:col-span-5 lg:block">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-white/10 via-white/0 to-white/0 blur-2xl" />

            <Link
              href={`/products/${showcase.id}`}
              className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-card/60 p-3 backdrop-blur-xl transition-transform hover:-translate-y-1"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-card">
                <Image
                  src={showcase.image || showcase.images?.[0] || fallback}
                  alt={showcase.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 0px, 480px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/0 to-background/0" />

                {/* Floating chip — top-left */}
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-background/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground backdrop-blur-md">
                  <Sparkles className="h-3 w-3" />
                  Featured
                </div>

                {/* Bottom info card */}
                <div className="absolute inset-x-4 bottom-4">
                  <div className="rounded-2xl border border-white/10 bg-background/70 p-4 backdrop-blur-xl">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {showcase.brand}
                    </p>
                    <p className="mt-1 line-clamp-1 text-base font-bold text-foreground">
                      {showcase.name}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-lg font-bold text-foreground">
                        {new Intl.NumberFormat("en-KE", {
                          style: "currency",
                          currency: "KES",
                          maximumFractionDigits: 0,
                        }).format(showcase.price)}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                        Shop
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Floating stat pills */}
            <div className="absolute -left-8 top-1/3 hidden rounded-2xl border border-white/10 bg-background/70 px-4 py-3 backdrop-blur-xl xl:block">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Customers
              </p>
              <p className="text-2xl font-bold text-foreground">10K+</p>
            </div>
            <div className="absolute -right-6 top-2/3 hidden rounded-2xl border border-white/10 bg-background/70 px-4 py-3 backdrop-blur-xl xl:block">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Products
              </p>
              <p className="text-2xl font-bold text-foreground">500+</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
