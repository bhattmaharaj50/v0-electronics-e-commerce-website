"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { useProductStore } from "@/lib/product-store"

export function HeroSection() {
  const { settings } = useProductStore()
  const fallback = settings.heroImageUrl || "/images/hero-electronics.jpg"
  const galleryImages = settings.heroGalleryImages?.filter(Boolean) || []
  const slides = galleryImages.length > 0 ? galleryImages : [fallback]

  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [slides.length])

  // Reset to first slide if the gallery contents change.
  useEffect(() => {
    setActiveSlide(0)
  }, [slides.join("|")])

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        {slides.map((src, index) => (
          <Image
            key={`${src}-${index}`}
            src={src}
            alt="Premium electronics collection"
            fill
            priority={index === 0}
            className={`object-cover opacity-40 transition-opacity duration-1000 ${
              index === activeSlide ? "opacity-40" : "opacity-0"
            }`}
            sizes="100vw"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-center px-4 py-24 lg:px-8 lg:py-36">
        <span className="mb-4 inline-block rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {settings.heroBadge}
        </span>
        <h1 className="max-w-2xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
          {settings.heroTitle}
        </h1>
        <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          {settings.heroSubtitle}
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

        {slides.length > 1 && (
          <div className="mt-10 flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveSlide(index)}
                aria-label={`Show slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeSlide ? "w-8 bg-foreground" : "w-3 bg-muted-foreground/40 hover:bg-muted-foreground/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
