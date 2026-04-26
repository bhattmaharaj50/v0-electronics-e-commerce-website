"use client"

import { useProductStore } from "@/lib/product-store"

export function FeaturedBrands() {
  const { settings } = useProductStore()
  const logos = settings.brandLogos || []

  if (logos.length === 0) return null

  const title = settings.brandsTitle || "Trusted Brands We Stock"
  const reel = logos.length >= 4 ? [...logos, ...logos] : logos

  return (
    <section className="border-y border-border bg-secondary/30 py-10">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Authentic products from the brands you love</p>
        </div>

        {logos.length >= 4 ? (
          <div className="group relative overflow-hidden">
            <div className="flex w-max animate-brand-marquee items-center gap-10 group-hover:[animation-play-state:paused] md:gap-14">
              {reel.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="flex h-16 w-32 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-background px-3 transition-shadow hover:shadow-md md:h-20 md:w-40"
                >
                  <img
                    src={url}
                    alt={`Brand ${(i % logos.length) + 1}`}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain opacity-80 transition-opacity hover:opacity-100"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {logos.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="flex h-16 w-32 items-center justify-center rounded-xl border border-border bg-background px-3 transition-shadow hover:shadow-md md:h-20 md:w-40"
              >
                <img
                  src={url}
                  alt={`Brand ${i + 1}`}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain opacity-80 transition-opacity hover:opacity-100"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
