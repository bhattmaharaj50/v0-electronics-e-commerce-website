"use client"

import { useProductStore } from "@/lib/product-store"
import { ProductCard } from "@/components/product-card"
import { Clock, Gift, Sparkles } from "lucide-react"
import type { Product } from "@/lib/products"
import type React from "react"

function OfferBlock({ title, icon, products }: { title: string; icon: React.ReactNode; products: Product[] }) {
  if (products.length === 0) return null

  return (
    <div className="mb-12 last:mb-0">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">{title}</h3>
          <p className="text-sm text-muted-foreground">Limited stock offers managed from the admin backend.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export function DealsSection() {
  const { products, settings } = useProductStore()
  const discounted = products.filter((product) => product.originalPrice)
  const flashSales = products.filter((product) => product.offerType === "flash-sale")
  const dealOfDay = products.filter((product) => product.offerType === "deal-of-day")
  const holidayDeals = products.filter((product) => product.offerType === "holiday-deal")
  const fallbackDeals = discounted.length ? discounted.slice(0, 4) : products.slice(0, 4)

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <OfferBlock
          title={settings.flashSaleTitle}
          icon={<Clock className="h-5 w-5 text-primary-foreground" />}
          products={flashSales.length ? flashSales : fallbackDeals}
        />
        <OfferBlock
          title={settings.dealOfDayTitle}
          icon={<Sparkles className="h-5 w-5 text-primary-foreground" />}
          products={dealOfDay.length ? dealOfDay : fallbackDeals}
        />
        <OfferBlock
          title={settings.holidayDealsTitle}
          icon={<Gift className="h-5 w-5 text-primary-foreground" />}
          products={holidayDeals.length ? holidayDeals : fallbackDeals}
        />
      </div>
    </section>
  )
}
