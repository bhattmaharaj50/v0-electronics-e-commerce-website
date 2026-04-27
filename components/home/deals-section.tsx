"use client"

import { useProductStore } from "@/lib/product-store"
import { ProductCard } from "@/components/product-card"
import { Clock, Gift, Sparkles } from "lucide-react"
import type { Product } from "@/lib/products"
import type React from "react"

function OfferBlock({
  title,
  icon,
  eyebrow,
  products,
}: {
  title: string
  icon: React.ReactNode
  eyebrow: string
  products: Product[]
}) {
  if (products.length === 0) return null

  return (
    <div className="mb-14 last:mb-0">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-background/60 backdrop-blur-md">
            {icon}
          </div>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </span>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h3>
          </div>
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
    <section className="relative overflow-hidden border-y border-white/5 bg-card/40">
      <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-white/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-white/[0.04] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <OfferBlock
          eyebrow="Limited time"
          title={settings.flashSaleTitle}
          icon={<Clock className="h-5 w-5 text-foreground" />}
          products={flashSales.length ? flashSales : fallbackDeals}
        />
        <OfferBlock
          eyebrow="Today only"
          title={settings.dealOfDayTitle}
          icon={<Sparkles className="h-5 w-5 text-foreground" />}
          products={dealOfDay.length ? dealOfDay : fallbackDeals}
        />
        <OfferBlock
          eyebrow="Holiday savings"
          title={settings.holidayDealsTitle}
          icon={<Gift className="h-5 w-5 text-foreground" />}
          products={holidayDeals.length ? holidayDeals : fallbackDeals}
        />
      </div>
    </section>
  )
}
