"use client"

import { useProductStore } from "@/lib/product-store"
import { ProductCard } from "@/components/product-card"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function FeaturedProducts() {
  const { products } = useProductStore()
  const featured = products.slice(0, 8)

  if (featured.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Hand-picked
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Featured Products
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground md:text-base">
            Top-rated electronics our customers love most this season.
          </p>
        </div>
        <Link
          href="/products"
          className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-white/[0.06] md:inline-flex"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-10 flex justify-center md:hidden">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.06]"
        >
          View All Products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
