"use client"

import Link from "next/link"
import {
  Tv,
  Speaker,
  Smartphone,
  Refrigerator,
  Microwave,
  WashingMachine,
  CookingPot,
  Flame,
  Tablet,
  Headphones,
  Gamepad2,
  Joystick,
  Cable,
  Droplets,
  Shirt,
  ChefHat,
  Soup,
  ArrowUpRight,
} from "lucide-react"
import { useProductStore } from "@/lib/product-store"

const iconMap: Record<string, React.ElementType> = {
  Tv,
  Speaker,
  Smartphone,
  Refrigerator,
  Microwave,
  WashingMachine,
  CookingPot,
  Flame,
  Tablet,
  Headphones,
  Gamepad2,
  Joystick,
  Cable,
  Droplets,
  Shirt,
  ChefHat,
  Soup,
}

export function CategoriesSection() {
  const { categories, products } = useProductStore()

  // Pick a representative product image per category for richer visuals.
  const imageFor = (slug: string) => {
    const match = products.find(
      (p) => p.category === slug && (p.image || (p.images && p.images.length > 0)),
    )
    return match?.image || match?.images?.[0] || ""
  }

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Browse the store
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Shop by Category
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground md:text-base">
            From flagship phones to flagship kitchens — find exactly what you need.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-white/[0.06]"
        >
          See all products
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] || Tv
          const productCount = products.filter((p) => p.category === cat.slug).length
          const bgImage = imageFor(cat.slug)

          return (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group relative flex h-36 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-card p-4 transition-all hover:-translate-y-1 hover:border-white/30 md:h-44"
            >
              {bgImage && (
                <img
                  src={bgImage}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-20 transition-all duration-700 group-hover:scale-110 group-hover:opacity-30"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-background/60 backdrop-blur-md transition-colors group-hover:bg-background/80">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
              </div>
              <div className="relative">
                <p className="text-sm font-bold text-foreground md:text-base">{cat.name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {productCount} {productCount === 1 ? "item" : "items"}
                </p>
              </div>
              <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground group-hover:opacity-100" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
