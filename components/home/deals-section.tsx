"use client"

import { getDealsOfTheDay } from "@/lib/products"
import { ProductCard } from "@/components/product-card"
import { Clock } from "lucide-react"

export function DealsSection() {
  const deals = getDealsOfTheDay().slice(0, 4)

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Clock className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Deals of the Day
            </h2>
            <p className="text-sm text-muted-foreground">Limited time offers - don&apos;t miss out!</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
