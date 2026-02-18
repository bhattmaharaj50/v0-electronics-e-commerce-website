"use client"

import { getFeaturedProducts } from "@/lib/products"
import { ProductCard } from "@/components/product-card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function FeaturedProducts() {
  const featured = getFeaturedProducts().slice(0, 8)

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Featured Products
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hand-picked products just for you
          </p>
        </div>
        <Link
          href="/products"
          className="hidden items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:flex"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-8 flex justify-center md:hidden">
        <Link
          href="/products"
          className="flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          View All Products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
